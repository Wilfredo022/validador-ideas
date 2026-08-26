import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { DEFAULT_MODELS } from "./agent-meta";

export type ProviderKey = "claude" | "deepseek" | "glm";

function env(key: string): string | undefined {
  return process.env[key];
}

export function hasKey(provider: ProviderKey): boolean {
  switch (provider) {
    case "claude":
      return Boolean(env("ANTHROPIC_API_KEY"));
    case "deepseek":
      return Boolean(env("DEEPSEEK_API_KEY"));
    case "glm":
      return Boolean(env("ZHIPU_API_KEY"));
  }
}

// Restringe los proveedores usados vía ALLOWED_PROVIDERS (p.ej. "deepseek"
// para usar solo DeepSeek). Sin la variable, se permite cualquier proveedor
// que tenga clave configurada.
function allowedList(): ProviderKey[] | null {
  const raw = env("ALLOWED_PROVIDERS");
  if (!raw || !raw.trim()) return null;
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase() as ProviderKey)
    .filter((s) => s.length > 0);
}

export function providerEnabled(provider: ProviderKey): boolean {
  if (!hasKey(provider)) return false;
  const allowed = allowedList();
  if (!allowed) return true;
  return allowed.includes(provider);
}

export function availableProviders(): ProviderKey[] {
  return (["claude", "deepseek", "glm"] as ProviderKey[]).filter(providerEnabled);
}

function getAnthropic() {
  return createAnthropic({ apiKey: env("ANTHROPIC_API_KEY") });
}

function getDeepSeek() {
  return createOpenAI({
    apiKey: env("DEEPSEEK_API_KEY"),
    baseURL: "https://api.deepseek.com/v1",
    name: "deepseek",
  });
}

function getGLM() {
  return createOpenAI({
    apiKey: env("ZHIPU_API_KEY"),
    baseURL: "https://open.bigmodel.cn/api/paas/v4",
    name: "glm",
  });
}

export function getModel(provider: ProviderKey, modelId: string) {
  switch (provider) {
    case "claude":
      return getAnthropic()(modelId);
    case "deepseek":
      return getDeepSeek()(modelId);
    case "glm":
      return getGLM()(modelId);
  }
}

const FALLBACK_ORDER: Record<ProviderKey, ProviderKey[]> = {
  // GLM antes que Claude: Claude suele estar geo-bloqueado, así que evitamos
  // intentos 403 innecesarios si el primario falla.
  claude: ["deepseek", "glm"],
  deepseek: ["glm", "claude"],
  glm: ["deepseek", "claude"],
};

export interface ModelTarget {
  provider: ProviderKey;
  model: string;
  mode: "schema" | "json";
}

export function modeForProvider(provider: ProviderKey): ModelTarget["mode"] {
  return provider === "claude" ? "schema" : "json";
}

export function getFallbackChain(target: ModelTarget): ModelTarget[] {
  const chain: ModelTarget[] = [];
  const seen = new Set<ProviderKey>();
  if (providerEnabled(target.provider)) {
    chain.push({ ...target, mode: modeForProvider(target.provider) });
    seen.add(target.provider);
  }
  for (const provider of FALLBACK_ORDER[target.provider]) {
    if (seen.has(provider) || !providerEnabled(provider)) continue;
    seen.add(provider);
    chain.push({
      provider,
      model: DEFAULT_MODELS[provider],
      mode: modeForProvider(provider),
    });
  }
  return chain;
}
