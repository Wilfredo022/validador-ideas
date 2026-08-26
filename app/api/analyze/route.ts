import { prisma } from "@/lib/prisma";
import { runDebate, buildVisionString } from "@/lib/ai/debate";
import { withRetry } from "@/lib/db-retry";
import { analyzeSchema } from "@/lib/validations";

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
  const parsed = analyzeSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const { ideaId, update } = parsed.data;

  // Si el usuario añadió información nueva, se persiste como "actualización"
  // y pasa a formar parte de la visión de todos los agentes.
  if (update) {
    await withRetry(() =>
      prisma.refinementMessage.create({
        data: { ideaId, role: "UPDATE", content: update },
      })
    );
  }

  const idea = await withRetry(() =>
    prisma.idea.findUnique({ where: { id: ideaId } })
  );
  if (!idea) {
    return Response.json({ error: "Idea no encontrada" }, { status: 404 });
  }

  const refinements = await withRetry(() =>
    prisma.refinementMessage.findMany({
      where: { ideaId },
      orderBy: { createdAt: "asc" },
    })
  );
  const vision = buildVisionString(refinements);

  const research = await withRetry(() =>
    prisma.marketResearch.findFirst({
      where: { ideaId },
      orderBy: { createdAt: "desc" },
    })
  );

  const maxRound = await withRetry(() =>
    prisma.debate.aggregate({
      where: { ideaId },
      _max: { round: true },
    })
  );
  const round = (maxRound._max.round ?? 0) + 1;
  const debate = await withRetry(() =>
    prisma.debate.create({
      data: { ideaId, round, status: "RUNNING" },
    })
  );

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (obj: Record<string, unknown>) => sse(controller, obj);
      try {
        await runDebate(idea, debate, vision, null, null, emit, research?.report ?? null);
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
