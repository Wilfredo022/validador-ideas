import { prisma } from "@/lib/prisma";
import { runDebate, buildVisionString } from "@/lib/ai/debate";
import { pivotSchema } from "@/lib/validations";
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
  const parsed = pivotSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const { debateId, pivotOptionId } = parsed.data;

  const previousDebate = await withRetry(() =>
    prisma.debate.findUnique({
      where: { id: debateId },
      include: { idea: true },
    })
  );
  if (!previousDebate) {
    return Response.json({ error: "Debate no encontrado" }, { status: 404 });
  }
  const idea = previousDebate.idea;

  await withRetry(() =>
    prisma.pivotOption.update({
      where: { id: pivotOptionId },
      data: { chosen: true },
    })
  );

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

  const maxRound = await withRetry(() =>
    prisma.debate.aggregate({
      where: { ideaId: idea.id },
      _max: { round: true },
    })
  );
  const round = (maxRound._max.round ?? 0) + 1;

  const chosen = await withRetry(() =>
    prisma.pivotOption.findUnique({ where: { id: pivotOptionId } })
  );
  const context = `La idea original era "${idea.title}" (${idea.description}). Falló por ${previousDebate.summary ?? "las razones del veredicto anterior"}. El usuario decidió aplicar este nuevo enfoque: ${chosen?.title}: ${chosen?.description}. Vuelvan a debatir asumiendo este cambio.`;

  const debate = await withRetry(() =>
    prisma.debate.create({
      data: {
        ideaId: idea.id,
        round,
        context,
        status: "RUNNING",
      },
    })
  );

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (obj: Record<string, unknown>) => sse(controller, obj);
      try {
        await runDebate(
          idea,
          debate,
          vision,
          context,
          previousDebate.score,
          emit,
          research?.report ?? null
        );
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
