import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db-retry";
import type { Idea, Debate } from "@prisma/client";
import { runAgentStream } from "./orchestrator";
import {
  juezSchema,
  estrategaSchema,
  arquitectoSchema,
  type AgentContext,
} from "./agents";
import type { AgentKey } from "./agent-meta";

type Emit = (obj: Record<string, unknown>) => void;

export function buildVisionString(
  messages: { role: string; content: string }[]
): string {
  return messages
    .map((m) => {
      switch (m.role) {
        case "USER":
          return `Usuario: ${m.content}`;
        case "UPDATE":
          return `Actualización del usuario (nueva información añadida): ${m.content}`;
        case "DISCOVERER":
          return `Descubridor: ${m.content}`;
        case "VISIONARIO":
          return `Visionario: ${m.content}`;
        default:
          return m.content;
      }
    })
    .join("\n");
}

async function runOne(
  emit: Emit,
  agent: AgentKey,
  debateId: string,
  ctx: AgentContext
): Promise<unknown> {
  emit({ type: "agent-start", agent });
  let output: unknown = null;
  let model = "";
  for await (const ev of runAgentStream(agent, ctx)) {
    if (ev.type === "delta") {
      emit({ type: "agent-delta", agent, text: ev.text });
    } else if (ev.type === "complete") {
      output = ev.output;
      model = ev.model ?? "";
    } else {
      emit({ type: "agent-error", agent, error: ev.error });
    }
  }
  if (output == null) {
    throw new Error(`El agente ${agent} no produjo una salida válida`);
  }
  await withRetry(() =>
    prisma.agentResult.create({
      data: { debateId, agent: agent as never, output: output as object, model },
    })
  );
  emit({ type: "agent-complete", agent, output, model });
  return output;
}

export async function runDebate(
  idea: Idea,
  debate: Debate,
  vision: string,
  context: string | null,
  previousScore: number | null,
  emit: Emit,
  research?: unknown | null
): Promise<void> {
  emit({ type: "round", debateId: debate.id, round: debate.round });
  const base: AgentContext = {
    domain: idea.domain as "SOFTWARE" | "PHYSICAL",
    ideaTitle: idea.title,
    ideaDescription: idea.description,
    vision,
    debateContext: context ?? undefined,
    previousScore,
    research: research ? JSON.stringify(research, null, 2) : undefined,
  };

  try {
    const visionary = await runOne(emit, "VISIONARIO", debate.id, base);

    const inqui = await runOne(emit, "INQUISIDOR", debate.id, {
      ...base,
      visionaryOutput: visionary,
    });

    const capi = await runOne(emit, "CAPITALISTA", debate.id, {
      ...base,
      visionaryOutput: visionary,
    });

    const judgeRaw = await runOne(emit, "JUEZ", debate.id, {
      ...base,
      visionaryOutput: visionary,
      inquisidorOutput: inqui,
      capitalistaOutput: capi,
    });
    const judge = juezSchema.parse(judgeRaw);

    const score = Math.round(judge.puntaje);
    let verdict: "DESCARTAR" | "REQUIERE_PIVOTE" | "APROBADO";
    if (score <= 40) verdict = "DESCARTAR";
    else if (score < 70) verdict = "REQUIERE_PIVOTE";
    else verdict = "APROBADO";

    await withRetry(() =>
      prisma.debate.update({
        where: { id: debate.id },
        data: {
          score,
          verdict,
          summary: judge.resumenEjecutivo,
          status: "COMPLETE",
        },
      })
    );
    await withRetry(() =>
      prisma.idea.update({
        where: { id: idea.id },
        data: { score, verdict, interviewDone: true },
      })
    );

    emit({ type: "verdict", score, verdict, judge });

    if (verdict === "DESCARTAR") {
      emit({ type: "done", score, verdict });
      return;
    }

    if (verdict === "REQUIERE_PIVOTE") {
      const stratRaw = await runOne(emit, "ESTRATEGA", debate.id, {
        ...base,
        visionaryOutput: visionary,
        inquisidorOutput: inqui,
        capitalistaOutput: capi,
        judgeOutput: judge,
      });
      const strat = estrategaSchema.parse(stratRaw);
      const createdPivots: {
        id: string;
        titulo: string;
        descripcion: string;
        porQueEliminaRiesgos: string;
      }[] = [];
      for (const p of strat.opcionesDePivote) {
        const rec = await withRetry(() =>
          prisma.pivotOption.create({
            data: {
              debateId: debate.id,
              title: p.titulo,
              description: p.descripcion,
              rationale: p.porQueEliminaRiesgos,
            },
          })
        );
        createdPivots.push({
          id: rec.id,
          titulo: p.titulo,
          descripcion: p.descripcion,
          porQueEliminaRiesgos: p.porQueEliminaRiesgos,
        });
      }
      emit({
        type: "pivots",
        pivots: createdPivots,
        score,
        verdict,
      });
      emit({ type: "done", score, verdict, needsPivot: true });
      return;
    }

    // APROBADO
    const archRaw = await runOne(emit, "ARQUITECTO", debate.id, {
      ...base,
      judgeOutput: judge,
    });
    const arch = arquitectoSchema.parse(archRaw);
    emit({ type: "roadmap", roadmap: arch, score, verdict });
    emit({ type: "done", score, verdict });
  } catch (e) {
    try {
      await withRetry(() =>
        prisma.debate.update({
          where: { id: debate.id },
          data: { status: "ERROR" },
        })
      );
    } catch {
      /* noop: no se pudo persistir el estado */
    }
    emit({
      type: "error",
      error: e instanceof Error ? e.message : "Error durante el debate",
    });
  }
}
