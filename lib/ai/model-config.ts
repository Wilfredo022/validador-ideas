import { prisma } from "@/lib/prisma";
import type { ProviderKey } from "./provider";
import { DEFAULT_CONFIG } from "./agent-meta";

export type { AgentKey, ModelConf } from "./agent-meta";
export { AGENT_LABELS, DEFAULT_MODELS } from "./agent-meta";
export type { ProviderKey };

const ENV_AGENT = {
  INVESTIGADOR: "INVESTIGADOR",
  VISIONARIO_INTERVIEW: "VISIONARIO_INTERVIEW",
  VISIONARIO: "VISIONARIO",
  INQUISIDOR: "INQUISIDOR",
  CAPITALISTA: "CAPITALISTA",
  JUEZ: "JUEZ",
  ESTRATEGA: "ESTRATEGA",
  ARQUITECTO: "ARQUITECTO",
} as const;

function fromEnv(
  agent: keyof typeof ENV_AGENT,
  conf: { provider: string; model: string; mode: string }
) {
  const provider =
    process.env[`${ENV_AGENT[agent]}_PROVIDER`] || conf.provider;
  const model = process.env[`${ENV_AGENT[agent]}_MODEL`] || conf.model;
  const mode = process.env[`${ENV_AGENT[agent]}_MODE`] || conf.mode;
  return {
    provider: provider as ProviderKey,
    model,
    mode: mode as "schema" | "json",
  };
}

export async function getModelConfig(agent: keyof typeof ENV_AGENT) {
  const defaults = fromEnv(agent, DEFAULT_CONFIG[agent]);
  try {
    const db = await prisma.agentModelConfig.findUnique({ where: { agent } });
    if (db) {
      return {
        provider: db.provider as ProviderKey,
        model: db.model,
        mode: db.mode as "schema" | "json",
      };
    }
  } catch {
    // DB no disponible: usar defaults
  }
  return defaults;
}

export async function saveConfig(
  agent: string,
  conf: { provider: string; model: string; mode: string }
): Promise<void> {
  await prisma.agentModelConfig.upsert({
    where: { agent },
    update: conf,
    create: { agent, ...conf },
  });
}
