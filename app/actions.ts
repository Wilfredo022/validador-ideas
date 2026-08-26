"use server";

import { prisma } from "@/lib/prisma";
import { createIdeaSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function createIdea(input: {
  title: string;
  description: string;
  domain: "SOFTWARE" | "PHYSICAL";
}) {
  const parsed = createIdeaSchema.parse(input);
  const idea = await prisma.idea.create({ data: parsed });
  revalidatePath("/");
  return { id: idea.id };
}

export async function deleteIdea(id: string) {
  await prisma.idea.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath(`/ideas/${id}`);
  return { ok: true };
}

export async function markInterviewSkipped(id: string) {
  await prisma.idea.update({
    where: { id },
    data: { interviewSkipped: true, interviewDone: true },
  });
  revalidatePath(`/ideas/${id}`);
  return { ok: true };
}

export async function createDiscovery(seed: string) {
  const clean = seed.trim();
  const idea = await prisma.idea.create({
    data: {
      title: clean ? clean.slice(0, 60) : "Idea en exploración",
      description: clean || "En desarrollo con el Descubridor.",
      domain: "SOFTWARE",
      stage: "DISCOVERY",
    },
  });
  if (clean) {
    await prisma.refinementMessage.create({
      data: { ideaId: idea.id, role: "USER", content: clean },
    });
  }
  revalidatePath("/");
  return { id: idea.id };
}
