import { streamObject, generateText } from "ai";
import { z } from "zod";
import {
  getModel,
  getFallbackChain,
  providerEnabled,
  type ProviderKey,
} from "./provider";
import { getModelConfig } from "./model-config";
import type { AgentKey } from "./agent-meta";
import { buildAgentPrompt, schemas, type AgentContext } from "./agents";

export interface AgentStreamEvent {
  type: "delta" | "complete" | "error";
  text?: string;
  output?: unknown;
  model?: string;
  error?: string;
}

export function parseJsonStrict(text: string, schema: z.ZodType): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const json = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  const parsed = JSON.parse(json);
  return schema.parse(parsed);
}

async function retryJson(
  model: ReturnType<typeof getModel>,
  system: string,
  raw: string,
  schema: z.ZodType
): Promise<unknown> {
  const result = await generateText({
    model,
    system,
    maxOutputTokens: 8000,
    prompt: `El JSON anterior fue inválido. Devuélvelo corregido como JSON válido SOLO, sin texto extra.\n\nJSON erróneo:\n${raw}`,
  });
  return parseJsonStrict(result.text, schema);
}

export async function* runAgentStream(
  agent: AgentKey,
  ctx: AgentContext,
  override?: { provider: ProviderKey; model: string }
): AsyncGenerator<AgentStreamEvent> {
  const conf = await getModelConfig(agent);
  const chain = getFallbackChain(
    override ? { ...conf, ...override } : conf
  );
  const system = buildAgentPrompt(agent, ctx);
  const schema = schemas[agent];
  const prompt =
    "Analiza la idea y responde únicamente con el objeto JSON estructurado que se te pide en el sistema.";

  let lastError: unknown = null;

  for (const target of chain) {
    try {
      const model = getModel(target.provider, target.model);

      if (target.mode === "schema") {
        const result = streamObject({ model, schema, system, prompt });
        for await (const partial of result.partialObjectStream) {
          yield { type: "delta", text: JSON.stringify(partial) ?? "" };
        }
        const output = await result.object;
        yield { type: "complete", output, model: target.model };
        return;
      }

      // json mode (DeepSeek / GLM)
      const result = await generateText({
        model,
        system,
        prompt,
        maxOutputTokens: 8000,
        providerOptions: {
          openai: { response_format: { type: "json_object" } },
        },
      });
      yield { type: "delta", text: " " };
      try {
        const output = parseJsonStrict(result.text, schema);
        yield { type: "complete", output, model: target.model };
        return;
      } catch (parseErr) {
        const fixed = await retryJson(model, system, result.text, schema).catch(
          () => {
            throw parseErr;
          }
        );
        yield { type: "complete", output: fixed, model: target.model };
        return;
      }
    } catch (err) {
      lastError = err;
      // Continuar con el siguiente proveedor de respaldo
    }
  }

  yield {
    type: "error",
    error:
      lastError instanceof Error
        ? lastError.message
        : "Todos los proveedores fallaron",
  };
}

export function availableProviderCount(): number {
  return (["claude", "deepseek", "glm"] as const).filter(providerEnabled).length;
}
