export type AgentKey =
  | "INVESTIGADOR"
  | "VISIONARIO_INTERVIEW"
  | "VISIONARIO"
  | "INQUISIDOR"
  | "CAPITALISTA"
  | "JUEZ"
  | "ESTRATEGA"
  | "ARQUITECTO";

export type ProviderKey = "claude" | "deepseek" | "glm";

export interface ModelConf {
  provider: ProviderKey;
  model: string;
  mode: "schema" | "json";
}

export const DEFAULT_CONFIG: Record<AgentKey, ModelConf> = {
  INVESTIGADOR: {
    provider: "deepseek",
    model: "deepseek-v4-pro",
    mode: "json",
  },
  VISIONARIO_INTERVIEW: {
    provider: "deepseek",
    model: "deepseek-v4-flash",
    mode: "json",
  },
  VISIONARIO: { provider: "deepseek", model: "deepseek-v4-pro", mode: "json" },
  INQUISIDOR: {
    provider: "deepseek",
    model: "deepseek-v4-pro",
    mode: "json",
  },
  CAPITALISTA: {
    provider: "deepseek",
    model: "deepseek-v4-flash",
    mode: "json",
  },
  JUEZ: { provider: "deepseek", model: "deepseek-v4-pro", mode: "json" },
  ESTRATEGA: { provider: "deepseek", model: "deepseek-v4-pro", mode: "json" },
  ARQUITECTO: { provider: "deepseek", model: "deepseek-v4-pro", mode: "json" },
};

export const AGENT_LABELS: Record<AgentKey, string> = {
  INVESTIGADOR: "El Investigador de Mercado",
  VISIONARIO_INTERVIEW: "El Visionario (entrevista)",
  VISIONARIO: "El Visionario",
  INQUISIDOR: "El Inquisidor",
  CAPITALISTA: "El Capitalista",
  JUEZ: "El Juez",
  ESTRATEGA: "El Estratega",
  ARQUITECTO: "El Arquitecto",
};

export const DEFAULT_MODELS: Record<ProviderKey, string> = {
  claude: "claude-sonnet-5",
  deepseek: "deepseek-v4-flash",
  glm: "glm-4.6",
};
