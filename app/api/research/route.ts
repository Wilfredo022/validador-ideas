import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db-retry";
import { runMarketResearch } from "@/lib/ai/research";
import { buildVisionString } from "@/lib/ai/debate";
import { researchSchema } from "@/lib/validations";

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
  const parsed = researchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const { ideaId } = parsed.data;

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

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (obj: Record<string, unknown>) => sse(controller, obj);
      try {
        await runMarketResearch(
          {
            id: idea.id,
            title: idea.title,
            description: idea.description,
            domain: idea.domain as "SOFTWARE" | "PHYSICAL",
          },
          vision,
          emit
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