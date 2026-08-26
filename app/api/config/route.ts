import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { configSchema } from "@/lib/validations";
import { availableProviders } from "@/lib/ai/provider";

export async function GET() {
  const rows = await prisma.agentModelConfig.findMany();
  return NextResponse.json({ configs: rows, available: availableProviders() });
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = configSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  for (const c of parsed.data.configs) {
    await prisma.agentModelConfig.upsert({
      where: { agent: c.agent },
      update: {
        provider: c.provider,
        model: c.model,
        mode: c.mode,
      },
      create: {
        agent: c.agent,
        provider: c.provider,
        model: c.model,
        mode: c.mode,
      },
    });
  }
  return NextResponse.json({ ok: true });
}
