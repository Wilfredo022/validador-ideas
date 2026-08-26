"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, KeyRound } from "lucide-react";
import {
  AGENT_LABELS,
  DEFAULT_CONFIG,
  DEFAULT_MODELS,
  type AgentKey,
  type ProviderKey,
} from "@/lib/ai/agent-meta";

const PROVIDERS: { key: ProviderKey; label: string }[] = [
  { key: "claude", label: "Claude" },
  { key: "deepseek", label: "DeepSeek" },
  { key: "glm", label: "GLM" },
];

const AGENTS = Object.keys(AGENT_LABELS) as AgentKey[];

interface Row {
  agent: string;
  provider: ProviderKey;
  model: string;
  mode: "schema" | "json";
}

export default function ModelConfigPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [available, setAvailable] = useState<ProviderKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        setRows(data.configs as Row[]);
        setAvailable((data.available ?? []) as ProviderKey[]);
        setLoading(false);
      });
  }, []);

  function providerFor(agent: AgentKey): ProviderKey {
    return (
      rows.find((r) => r.agent === agent)?.provider ?? DEFAULT_CONFIG[agent].provider
    );
  }
  function modelFor(agent: AgentKey): string {
    return rows.find((r) => r.agent === agent)?.model ?? DEFAULT_CONFIG[agent].model;
  }
  function modeFor(agent: AgentKey): "schema" | "json" {
    return rows.find((r) => r.agent === agent)?.mode ?? DEFAULT_CONFIG[agent].mode;
  }

  function update(agent: AgentKey, patch: Partial<Row>) {
    setRows((prev) => {
      const existing = prev.find((r) => r.agent === agent);
      if (!existing) {
        return [
          ...prev,
          {
            agent,
            provider: providerFor(agent),
            model: modelFor(agent),
            mode: modeFor(agent),
            ...patch,
          },
        ];
      }
      return prev.map((r) => (r.agent === agent ? { ...r, ...patch } : r));
    });
  }

  async function save() {
    setSaving(true);
    try {
      const configsToSave = AGENTS.map((a) => ({
        agent: a,
        provider: providerFor(a),
        model: modelFor(a),
        mode: modeFor(a),
      }));
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configs: configsToSave }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      toast.success("Configuración de modelos guardada");
    } catch {
      toast.error("No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="card text-center text-muted-foreground">Cargando…</div>;
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Configuración de modelos</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Asigna qué proveedor y modelo usa cada agente. Cámbialos para comparar puntos de vista.
          Claude usa salida estructurada nativa; DeepSeek y GLM usan modo JSON.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="badge inline-flex gap-1.5 bg-muted text-muted-foreground">
          <KeyRound size={12} />
          Claves disponibles: {available.length ? available.join(", ") : "ninguna"}
        </span>
      </div>

      <div className="space-y-3">
        {AGENTS.map((agent) => (
          <div key={agent} className="card grid gap-4 py-4 sm:grid-cols-[1.2fr_1fr_1.4fr] sm:items-end">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Agente
              </div>
              <div className="mt-1 font-semibold">{AGENT_LABELS[agent]}</div>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Proveedor
              </label>
              <select
                className="input"
                value={providerFor(agent)}
                onChange={(e) =>
                  update(agent, {
                    provider: e.target.value as ProviderKey,
                    model: DEFAULT_MODELS[e.target.value as ProviderKey],
                  })
                }
              >
                {PROVIDERS.map((p) => (
                  <option key={p.key} value={p.key} disabled={!available.includes(p.key)}>
                    {p.label}
                    {!available.includes(p.key) ? " (sin clave)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Modelo
              </label>
              <input
                className="input"
                value={modelFor(agent)}
                onChange={(e) => update(agent, { model: e.target.value })}
              />
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
        <Save size={16} />
        {saving ? "Guardando…" : "Guardar configuración"}
      </button>
    </div>
  );
}
