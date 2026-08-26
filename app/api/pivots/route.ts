import { prisma } from "@/lib/prisma";
import { runAgentStream } from "@/lib/ai/orchestrator";
import { estrategaSchema } from "@/lib/ai/agents";
import { buildVisionString } from "@/lib/ai/debate";
import { pivotsSchema } from "@/lib/validations";
import { withRetry } from "@/lib/db-retry";

export const runtime = "nodejs";

function sse(controller: ReadableStreamDefaultController, obj: Record<string, unknown>) {
  try {
    controller.enqueue(
      new TextEncoder().encode(`data: ${JSON.stringify(obj)}\n\n`)
    );
  } catch {
    /* stream cerrado */
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = pivotsSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const { debateId } = parsed.data;

  const debate = await withRetry(() =>
    prisma.debate.findUnique({
      where: { id: debateId },
      include: { idea: true, agents: true },
    })
  );
  if (!debate) {
    return Response.json({ error: "Debate no encontrado" }, { status: 404 });
  }
  const idea = debate.idea;

  const refinements = await withRetry(() =>
    prisma.refinementMessage.findMany({
      where: { ideaId: idea.id },
      orderBy: { createdAt: "asc" },
    })
  );
  const vision = buildVisionString(refinements);

  const byAgent = new Map<string, unknown>();
  for (const a of debate.agents) byAgent.set(a.agent, a.output);

  const base = {
    domain: idea.domain as "SOFTWARE" | "PHYSICAL",
    ideaTitle: idea.title,
    ideaDescription: idea.description,
    vision,
    debateContext: debate.context ?? undefined,
    previousScore: debate.score,
    visionaryOutput: byAgent.get("VISIONARIO"),
    inquisidorOutput: byAgent.get("INQUISIDOR"),
    capitalistaOutput: byAgent.get("CAPITALISTA"),
  };

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (obj: Record<string, unknown>) => sse(controller, obj);
      emit({ type: "agent-start", agent: "ESTRATEGA" });
      let output: unknown = null;
      let model = "";
      try {
        for await (const ev of runAgentStream("ESTRATEGA", base as never)) {
          if (ev.type === "delta")
            emit({ type: "agent-delta", agent: "ESTRATEGA", text: ev.text });
          else if (ev.type === "complete") {
            output = ev.output;
            model = ev.model ?? "";
          } else {
            emit({ type: "agent-error", agent: "ESTRATEGA", error: ev.error });
          }
        }
        if (output == null) throw new Error("El Estratega no produjo salida");

        const strat = estrategaSchema.parse(output);

        await withRetry(() =>
          prisma.agentResult.create({
            data: {
              debateId,
              agent: "ESTRATEGA",
              output: output as object,
              model,
            },
          })
        );

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
                debateId,
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
          type: "agent-complete",
          agent: "ESTRATEGA",
          output,
          model,
        });
        emit({ type: "pivots", pivots: createdPivots });
        emit({ type: "done" });
      } catch (e) {
        emit({
          type: "error",
          error: e instanceof Error ? e.message : "Error buscando pivotes",
        });
      } finally {
        try {
          controller.close();
        } catch {
          /* noop */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}