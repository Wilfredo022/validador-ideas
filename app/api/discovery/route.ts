import { prisma } from "@/lib/prisma";
import { streamText } from "ai";
import { getModel, getFallbackChain } from "@/lib/ai/provider";
import { getModelConfig } from "@/lib/ai/model-config";
import { buildDiscoverySystem } from "@/lib/ai/agents";
import { interviewSchema } from "@/lib/validations";
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
  const parsed = interviewSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const { ideaId, messages } = parsed.data;

  const idea = await withRetry(() =>
    prisma.idea.findUnique({ where: { id: ideaId } })
  );
  if (!idea || idea.stage !== "DISCOVERY") {
    return Response.json(
      { error: "Idea en exploración no encontrada" },
      { status: 404 }
    );
  }

  const lastUser = messages.length > 0 ? messages[messages.length - 1] : null;
  if (lastUser) {
    await withRetry(() =>
      prisma.refinementMessage.create({
        data: { ideaId, role: "USER", content: lastUser.content },
      })
    );
  }

  const history = await withRetry(() =>
    prisma.refinementMessage.findMany({
      where: { ideaId },
      orderBy: { createdAt: "asc" },
    })
  );

  const conf = await getModelConfig("VISIONARIO_INTERVIEW");
  const chain = getFallbackChain(conf);
  const system = buildDiscoverySystem();

  const llmMessages =
    history.length === 0
      ? [
          {
            role: "user" as const,
            content:
              "[INICIO] El usuario quiere desarrollar una idea de negocio desde cero. Saluda brevemente y haz TU PRIMERA pregunta: pregúntale qué observó, qué problema vio o qué le gustaría resolver.",
          },
        ]
      : history.map((m) => ({
          role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
          content: m.content,
        }));

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (obj: Record<string, unknown>) => sse(controller, obj);
      let full = "";
      let lastError: unknown = null;

      for (const target of chain) {
        if (full) break;
        try {
          const model = getModel(target.provider, target.model);
          const result = streamText({
            model,
            system,
            maxOutputTokens: 3000,
            messages: llmMessages,
          });
          for await (const part of result.textStream) {
            full += part;
            emit({ type: "delta", text: part });
          }
        } catch (e) {
          lastError = e;
          full = "";
        }
      }

      if (full) {
        const clean = full.replace(/\[LISTO\]/gi, "").trim();
        await withRetry(() =>
          prisma.refinementMessage.create({
            data: { ideaId, role: "DISCOVERER", content: clean },
          })
        );
        const ready = /\[LISTO\]|idea (sustancial|lista)|pasarla al Visionario/i.test(
          full
        );
        emit({ type: "complete", ready });
      } else {
        emit({
          type: "error",
          error:
            lastError instanceof Error
              ? lastError.message
              : "Todos los proveedores fallaron",
        });
      }

      try {
        controller.close();
      } catch {
        /* noop */
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