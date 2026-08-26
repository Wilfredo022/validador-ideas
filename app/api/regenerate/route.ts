import { prisma } from "@/lib/prisma";
import { runAgentStream } from "@/lib/ai/orchestrator";
import { juezSchema } from "@/lib/ai/agents";
import { buildVisionString } from "@/lib/ai/debate";
import type { AgentKey } from "@/lib/ai/agent-meta";
import { regenerateSchema } from "@/lib/validations";
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
  const parsed = regenerateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const { debateId, agent } = parsed.data;
  const override = parsed.data.provider && parsed.data.model
    ? { provider: parsed.data.provider, model: parsed.data.model }
    : undefined;

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

  const research = await withRetry(() =>
    prisma.marketResearch.findFirst({
      where: { ideaId: idea.id },
      orderBy: { createdAt: "desc" },
    })
  );

  const byAgent = new Map<string, unknown>();
  for (const a of debate.agents) byAgent.set(a.agent, a.output);

  const base = {
    domain: idea.domain as "SOFTWARE" | "PHYSICAL",
    ideaTitle: idea.title,
    ideaDescription: idea.description,
    vision,
    debateContext: debate.context ?? undefined,
    previousScore: debate.score,
    research: research?.report
      ? JSON.stringify(research.report, null, 2)
      : undefined,
    visionaryOutput: byAgent.get("VISIONARIO"),
    inquisidorOutput: byAgent.get("INQUISIDOR"),
    capitalistaOutput: byAgent.get("CAPITALISTA"),
    judgeOutput: byAgent.get("JUEZ"),
  };

  const conf = override as { provider: "claude" | "deepseek" | "glm"; model: string } | undefined;

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (obj: Record<string, unknown>) => sse(controller, obj);
      emit({ type: "agent-start", agent });
      let output: unknown = null;
      let usedModel = "";
      try {
        for await (const ev of runAgentStream(agent as AgentKey, base as never, conf)) {
          if (ev.type === "delta") emit({ type: "agent-delta", agent, text: ev.text });
          else if (ev.type === "complete") {
            output = ev.output;
            usedModel = ev.model ?? "";
          } else {
            emit({ type: "agent-error", agent, error: ev.error });
          }
        }
        if (output == null) throw new Error("El agente no produjo salida");

        await withRetry(() =>
          prisma.agentResult.create({
            data: {
              debateId,
              agent: agent as never,
              output: output as object,
              model: usedModel,
            },
          })
        );
        emit({ type: "agent-complete", agent, output, model: usedModel });

        if (agent === "JUEZ") {
          const judge = juezSchema.parse(output);
          const score = Math.round(judge.puntaje);
          let verdict: "DESCARTAR" | "REQUIERE_PIVOTE" | "APROBADO";
          if (score <= 40) verdict = "DESCARTAR";
          else if (score < 70) verdict = "REQUIERE_PIVOTE";
          else verdict = "APROBADO";
          await withRetry(() =>
            prisma.debate.update({
              where: { id: debateId },
              data: { score, verdict, summary: judge.resumenEjecutivo },
            })
          );
          await withRetry(() =>
            prisma.idea.update({
              where: { id: idea.id },
              data: { score, verdict },
            })
          );
          emit({ type: "verdict", score, verdict, judge });
        }
      } catch (e) {
        emit({
          type: "error",
          error: e instanceof Error ? e.message : "Error",
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
