import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db-retry";
import { generateText } from "ai";
import { z } from "zod";
import { getModel, getFallbackChain } from "./provider";
import { getModelConfig } from "./model-config";
import { runAgentStream, parseJsonStrict } from "./orchestrator";
import {
  investigadorSchema,
  type AgentContext,
  type Domain,
} from "./agents";
import { searchWeb, type SearchResult } from "@/lib/search";

const queriesWrapperSchema = z.object({
  consultas: z.array(z.string().min(3)).min(3).max(8),
});

const QUERY_SYSTEM = `
<system>
  <agente id="INVESTIGADOR" rol="generador-de-busquedas"/>
  <mision>Diseñar las consultas de búsqueda web ideales para investigar el mercado de una idea de negocio.</mision>
  <instrucciones>
    <regla>Genera entre 4 y 6 consultas, en español o inglés según el mercado objetivo.</regla>
    <regla>Cubre: competidores directos, alternativas gratuitas o sustitutos, tamaño del mercado y tendencias, contexto del país o región, y precios.</regla>
    <regla>Si la visión menciona un país o ciudad, incluye consultas específicas de ese lugar.</regla>
    <regla>Responde SOLO con un objeto JSON válido {"consultas": [...]}, sin texto extra.</regla>
  </instrucciones>
</system>`;

interface QueryInput {
  ideaTitle: string;
  ideaDescription: string;
  domain: Domain;
  vision: string;
}

async function generateQueries(input: QueryInput): Promise<string[]> {
  const conf = await getModelConfig("INVESTIGADOR");
  const chain = getFallbackChain(conf);
  const prompt = `Idea: ${input.ideaTitle}\nDescripción: ${input.ideaDescription}\nDominio: ${input.domain}\nVisión del usuario:\n${input.vision}`;

  let lastError: unknown = null;
  for (const target of chain) {
    try {
      const model = getModel(target.provider, target.model);
      const result = await generateText({
        model,
        system: QUERY_SYSTEM,
        prompt,
        maxOutputTokens: 2000,
        providerOptions: {
          openai: { response_format: { type: "json_object" } },
        },
      });
      const parsed = parseJsonStrict(
        result.text,
        queriesWrapperSchema
      ) as z.infer<typeof queriesWrapperSchema>;
      return parsed.consultas;
    } catch (e) {
      lastError = e;
    }
  }
  throw new Error(
    lastError instanceof Error
      ? lastError.message
      : "No se pudieron generar las consultas de búsqueda"
  );
}

function compileSources(
  perQuery: { query: string; results: SearchResult[] }[]
): string {
  return JSON.stringify(
    perQuery
      .filter((c) => c.results.length > 0)
      .map((c) => ({
        consulta: c.query,
        resultados: c.results.map((r) => ({
          titulo: r.title,
          url: r.url,
          contenido: r.content.slice(0, 1500),
        })),
      })),
    null,
    2
  );
}

type Emit = (obj: Record<string, unknown>) => void;

const EMPTY_REPORT = {
  sintesis: "",
  mercado: { tamanioEstimado: "", tendencias: [], contextoPais: "" },
  competencia: [],
  alternativasGratuitas: [],
  oportunidad: "",
  amenazas: [],
  fuentes: [],
};

export async function runMarketResearch(
  idea: { id: string; title: string; description: string; domain: Domain },
  vision: string,
  emit: Emit
): Promise<void> {
  // Registro creado al inicio: si algo falla después, la investigación queda
  // rastreada en BD (consultas/fuentes) y no se pierde el trabajo hecho.
  let recId: string | null = null;
  try {
    emit({ type: "research-start" });

    const rec = await withRetry(() =>
      prisma.marketResearch.create({
        data: {
          ideaId: idea.id,
          report: EMPTY_REPORT as object,
          status: "RUNNING",
        },
      })
    );
    recId = rec.id;

    const queries = await generateQueries({
      ideaTitle: idea.title,
      ideaDescription: idea.description,
      domain: idea.domain,
      vision,
    });
    emit({ type: "research-queries", queries });

    await withRetry(() =>
      prisma.marketResearch.update({
        where: { id: rec.id },
        data: { queries },
      })
    );

    const perQuery: { query: string; results: SearchResult[] }[] = [];
    for (const q of queries) {
      emit({ type: "research-query", query: q });
      const results = await searchWeb(q, 5);
      perQuery.push({ query: q, results });
      emit({
        type: "research-progress",
        done: perQuery.length,
        total: queries.length,
      });
    }

    const totalResults = perQuery.reduce((n, c) => n + c.results.length, 0);
    if (totalResults === 0) {
      await withRetry(() =>
        prisma.marketResearch.update({
          where: { id: rec.id },
          data: { status: "ERROR" },
        })
      );
      throw new Error(
        "La búsqueda web no devolvió resultados. Verifica la key del buscador en .env e intenta de nuevo."
      );
    }

    const rawSources = compileSources(perQuery);

    // Guarda las fuentes crudas ANTES de sintetizar: aunque falle el informe,
    // los datos buscados ya están persistidos y se pueden reutilizar.
    await withRetry(() =>
      prisma.marketResearch.update({
        where: { id: rec.id },
        data: { queries, rawSources, status: "SEARCHING" },
      })
    );

    const ctx: AgentContext = {
      domain: idea.domain,
      ideaTitle: idea.title,
      ideaDescription: idea.description,
      vision,
      research: rawSources,
    };

    let output: unknown = null;
    let model = "";
    for await (const ev of runAgentStream("INVESTIGADOR", ctx)) {
      if (ev.type === "delta") emit({ type: "research-delta", text: ev.text });
      else if (ev.type === "complete") {
        output = ev.output;
        model = ev.model ?? "";
      } else if (ev.type === "error") {
        emit({ type: "research-error", error: ev.error });
      }
    }

    if (output == null) {
      throw new Error("El Investigador no produjo un informe válido");
    }
    const report = investigadorSchema.parse(output);

    // Guardado final del informe: más reintentos, por si Neon está despertando.
    await withRetry(
      () =>
        prisma.marketResearch.update({
          where: { id: rec.id },
          data: { report: report as object, status: "COMPLETE", model: model || null },
        }),
      4,
      1500
    );

    emit({ type: "research-complete", report, model, queries, researchId: rec.id });
    emit({ type: "research-done" });
  } catch (e) {
    if (recId) {
      const id = recId;
      try {
        await withRetry(() =>
          prisma.marketResearch.update({
            where: { id },
            data: { status: "ERROR" },
          })
        );
      } catch {
        /* noop */
      }
    }
    emit({
      type: "research-error",
      error:
        e instanceof Error ? e.message : "Error durante la investigación de mercado",
    });
  }
}