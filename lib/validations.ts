import { z } from "zod";

export const createIdeaSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres").max(120),
  description: z
    .string()
    .min(10, "Describe tu idea con al menos 10 caracteres")
    .max(4000),
  domain: z.enum(["SOFTWARE", "PHYSICAL"]),
});

export const analyzeSchema = z.object({
  ideaId: z.string().min(1),
  update: z.string().min(1).max(2000).optional(),
});

export const pivotsSchema = z.object({
  debateId: z.string().min(1),
});

export const researchSchema = z.object({
  ideaId: z.string().min(1),
});

export const finalizeDiscoverySchema = z.object({
  ideaId: z.string().min(1),
  title: z.string().min(3).max(120).optional(),
  description: z.string().min(10).max(4000).optional(),
});

export const pivotSchema = z.object({
  debateId: z.string().min(1),
  pivotOptionId: z.string().min(1),
});

export const regenerateSchema = z.object({
  debateId: z.string().min(1),
  agent: z.enum([
    "VISIONARIO",
    "INQUISIDOR",
    "CAPITALISTA",
    "JUEZ",
    "ESTRATEGA",
    "ARQUITECTO",
  ]),
  provider: z.enum(["claude", "deepseek", "glm"]).optional(),
  model: z.string().min(1).optional(),
});

export const interviewSchema = z.object({
  ideaId: z.string().min(1),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .max(200),
});

export const configSchema = z.object({
  configs: z.array(
    z.object({
      agent: z.string().min(1),
      provider: z.enum(["claude", "deepseek", "glm"]),
      model: z.string().min(1),
      mode: z.enum(["schema", "json"]),
    })
  ),
});

export type CreateIdeaInput = z.infer<typeof createIdeaSchema>;
