import { prisma } from "@/lib/prisma";
import { generateText } from "ai";
import { getModel, getFallbackChain } from "@/lib/ai/provider";
import { getModelConfig } from "@/lib/ai/model-config";
import { buildFinalizePrompt } from "@/lib/ai/agents";
import { withRetry } from "@/lib/db-retry";
import { z } from "zod";

export const runtime = "nodejs";

const finalSchema = z.object({
  titulo: z.string().min(3),
  descripcion: z.string().min(10),
});

function parseFinal(text: string) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const json = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  return finalSchema.parse(JSON.parse(json));
}

export async function POST(req: Request) {
  const body = await req.json();
  const ideaId = String(body?.ideaId ?? "");
  if (!ideaId) {
    return Response.json({ error: "Falta ideaId" }, { status: 400 });
  }

  const idea = await withRetry(() =>
    prisma.idea.findUnique({
      where: { id: ideaId },
      include: { refinements: { orderBy: { createdAt: "asc" } } },
    })
  );
  if (!idea) {
    return Response.json({ error: "Idea no encontrada" }, { status: 404 });
  }

  const transcript = idea.refinements
    .map((m) =>
      m.role === "USER" ? `Usuario: ${m.content}` : `Descubridor: ${m.content}`
    )
    .join("\n");

  const conf = await getModelConfig("VISIONARIO_INTERVIEW");
  const chain = getFallbackChain(conf);
  let generated: { titulo: string; descripcion: string } | null = null;

  for (const target of chain) {
    if (generated) break;
    try {
      const model = getModel(target.provider, target.model);
      const result = await generateText({
        model,
        maxOutputTokens: 800,
        prompt: buildFinalizePrompt(transcript || "El usuario no aportó detalles todavía."),
        providerOptions: {
          openai: { response_format: { type: "json_object" } },
        },
      });
      generated = parseFinal(result.text);
    } catch {
      generated = null;
    }
  }

  if (!generated) {
    return Response.json({ error: "No se pudo generar la sugerencia" }, { status: 422 });
  }

  return Response.json({ titulo: generated.titulo, descripcion: generated.descripcion });
}