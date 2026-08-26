"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useSSE } from "@/hooks/use-sse";
import {
  RefreshCw,
  ChevronDown,
  Search,
  Sun,
  Flame,
  CircleDollarSign,
  Scale,
  Compass,
  Hammer,
  type LucideIcon,
} from "lucide-react";
import type { AgentKey } from "@/lib/ai/agent-meta";
import { Field, List } from "@/components/ui/field";

type AgentName =
  | "INVESTIGADOR"
  | "VISIONARIO"
  | "INQUISIDOR"
  | "CAPITALISTA"
  | "JUEZ"
  | "ESTRATEGA"
  | "ARQUITECTO";

const META: Record<
  AgentName,
  { icon: LucideIcon; title: string; color: string; ring: string; desc: string }
> = {
  INVESTIGADOR: {
    icon: Search,
    title: "El Investigador",
    color: "text-indigo-700",
    ring: "bg-indigo-50 text-indigo-600",
    desc: "Investigación de mercado",
  },
  VISIONARIO: {
    icon: Sun,
    title: "El Visionario",
    color: "text-amber-700",
    ring: "bg-amber-50 text-amber-600",
    desc: "Optimista · Propuesta de valor",
  },
  INQUISIDOR: {
    icon: Flame,
    title: "El Inquisidor",
    color: "text-rose-700",
    ring: "bg-rose-50 text-rose-600",
    desc: "Realista · Abogado del diablo",
  },
  CAPITALISTA: {
    icon: CircleDollarSign,
    title: "El Capitalista",
    color: "text-emerald-700",
    ring: "bg-emerald-50 text-emerald-600",
    desc: "Finanzas · Monetización",
  },
  JUEZ: {
    icon: Scale,
    title: "El Juez",
    color: "text-sky-700",
    ring: "bg-sky-50 text-sky-600",
    desc: "Consenso · Calificación",
  },
  ESTRATEGA: {
    icon: Compass,
    title: "El Estratega",
    color: "text-violet-700",
    ring: "bg-violet-50 text-violet-600",
    desc: "Motor de pivotes",
  },
  ARQUITECTO: {
    icon: Hammer,
    title: "El Arquitecto",
    color: "text-teal-700",
    ring: "bg-teal-50 text-teal-600",
    desc: "Plan de ejecución",
  },
};

function summaryFor(agent: AgentName, output: unknown): string {
  const o = (output ?? {}) as Record<string, unknown>;
  switch (agent) {
    case "VISIONARIO":
      return (o.propuestaUnicaDeValor as string) ?? "";
    case "INQUISIDOR":
      return (
        (o.porqueElClienteNoCompraria as string) ??
        ((o.riesgosDeEjecucion as string[])?.[0] as string) ??
        ""
      );
    case "CAPITALISTA":
      return (
        (o.viabilidadDeMargenes as string) ??
        (o.modeloDeMonetizacion as string) ??
        ""
      );
    case "JUEZ":
      return (o.resumenEjecutivo as string) ?? "";
    case "ESTRATEGA": {
      const n = (o.opcionesDePivote as unknown[])?.length ?? 0;
      return n === 1 ? "1 opción de pivote propuesta" : `${n} opciones de pivote propuestas`;
    }
    case "ARQUITECTO":
      if ((o as { tipo?: string }).tipo === "PHYSICAL")
        return (o.validacionFisicaPreliminar as string) ?? "";
      return (o.stackRecomendado as string) ?? "";
    default:
      return "";
  }
}

export default function AgentCard({
  agent,
  output,
  model,
  streaming,
  debateId,
  onJudgeUpdated,
}: {
  agent: AgentName;
  output: unknown;
  model?: string | null;
  streaming?: boolean;
  debateId?: string;
  onJudgeUpdated?: () => void;
}) {
  const meta = META[agent];
  const Icon = meta.icon;
  const [expanded, setExpanded] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const { run } = useSSE();

  async function regenerate(e: React.MouseEvent) {
    e.stopPropagation();
    if (!debateId) return;
    setRegenerating(true);
    toast.info(`Re-ejecutando ${meta.title}…`);
    await run(
      "/api/regenerate",
      { debateId, agent },
      {
        onEvent: (ev) => {
          if (ev.type === "agent-complete" && agent === "JUEZ") onJudgeUpdated?.();
          else if (ev.type === "error") toast.error((ev.error as string) || "Error");
        },
        onError: (err) => toast.error(err.message),
        onDone: () => {
          toast.success(`${meta.title} regenerado`);
          setRegenerating(false);
        },
      }
    );
  }

  const summary = summaryFor(agent, output);
  const hasContent = Boolean(output);

  return (
    <div className="overflow-hidden rounded-[20px] border border-border bg-card shadow-[0_8px_30px_rgba(22,22,31,0.05)] transition hover:border-primary/25">
      <div className="flex items-center gap-1 p-2 sm:p-2.5">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-2 text-left"
          onClick={() => hasContent && setExpanded((e) => !e)}
          disabled={streaming}
        >
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${meta.ring}`}>
            <Icon size={18} />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`font-semibold ${meta.color}`}>{meta.title}</span>
              {model && <span className="badge bg-muted text-[10px] text-muted-foreground">{model}</span>}
            </div>
            <div className="truncate text-xs text-muted-foreground">{meta.desc}</div>
            {!streaming && hasContent && summary && (
              <div className="mt-1 line-clamp-1 text-sm text-foreground/70">{summary}</div>
            )}
            {streaming && (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-2 w-2 animate-pulse-soft rounded-full bg-primary" />
                Debatiendo…
              </div>
            )}
          </div>

          {hasContent && (
            <span className={`text-muted-foreground/40 transition ${expanded ? "rotate-180" : ""}`}>
              <ChevronDown size={18} />
            </span>
          )}
        </button>
        {debateId && hasContent && (
          <button
            type="button"
            className="mr-1 shrink-0 rounded-xl p-2 text-muted-foreground/60 transition hover:bg-muted hover:text-foreground"
            onClick={regenerate}
            title="Re-ejecutar este agente"
          >
            <RefreshCw size={15} className={regenerating ? "animate-spin" : ""} />
          </button>
        )}
      </div>

      {expanded && hasContent && (
        <div className="border-t border-border bg-muted/40 p-4">
          <AgentBody agent={agent} output={output} />
        </div>
      )}
    </div>
  );
}

function posicionamientoBlock(o: Record<string, unknown>) {
  const p = o.posicionamiento as
    | {
        diferenciacion: string;
        mensajeDeMarca: string;
        competenciaPrincipal: string;
        estrategiaDeEntrada: string;
        canalesIniciales: string[];
        riesgoCompetitivo: string;
      }
    | undefined;
  if (!p) return null;
  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-primary">
        Posicionamiento de mercado
      </div>
      <div className="space-y-2">
        <Field label="Diferenciación" value={p.diferenciacion} />
        <Field label="Mensaje de marca" value={p.mensajeDeMarca} />
        <Field label="Competencia principal" value={p.competenciaPrincipal} />
        <Field label="Estrategia de entrada" value={p.estrategiaDeEntrada} />
        <List label="Canales iniciales" items={p.canalesIniciales} tone="accent" />
        <Field label="Riesgo competitivo" value={p.riesgoCompetitivo} />
      </div>
    </div>
  );
}

function AgentBody({ agent, output }: { agent: AgentName; output: unknown }) {
  const o = output as Record<string, unknown>;
  switch (agent) {
    case "VISIONARIO":
      return (
        <div className="space-y-3">
          <Field label="Propuesta única de valor" value={o.propuestaUnicaDeValor} />
          <Field label="Público objetivo ideal" value={o.publicoObjetivoIdeal} />
          <Field label="Mejor escenario de adopción" value={o.mejorEscenarioAdopcion} />
          <Field label="Diferenciación clave" value={o.diferenciacionClave} />
          <Field label="Narrativa" value={o.narrativa} />
        </div>
      );
    case "INQUISIDOR":
      return (
        <div className="space-y-3">
          <List label="Riesgos de ejecución" items={o.riesgosDeEjecucion as string[]} />
          <List label="Fricciones de adopción" items={o.friccionesDeAdopcion as string[]} />
          <List label="Barreras de entrada" items={o.barrerasDeEntrada as string[]} />
          <Field label="Por qué el cliente no compraría" value={o.porqueElClienteNoCompraria} />
        </div>
      );
    case "CAPITALISTA":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Modelo de monetización" value={o.modeloDeMonetizacion} />
          <Field label="Tiempo al primer ingreso" value={o.tiempoAlPrimerIngreso} />
          <Field label="Margen bruto estimado" value={o.margenBrutoEstimado} />
          <Field label="CAC estimado" value={o.cacEstimado} />
          <Field label="LTV estimado" value={o.ltvEstimado} />
          <Field label="Inversión inicial" value={o.inversionInicial} />
          <Field label="Punto de equilibrio" value={o.puntoDeEquilibrio} />
          <Field label="Viabilidad de márgenes" value={o.viabilidadDeMargenes} />
        </div>
      );
    case "JUEZ":
      return (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-4 text-sm">
            {(["problema", "construccion", "rentabilidad", "competitividad"] as const).map((k) => (
              <div key={k} className="rounded-2xl bg-card px-3 py-2">
                <div className="font-bold tabular-nums">
                  {(o.ejes as Record<string, number> | undefined)?.[k] ?? 0}/25
                </div>
                <div className="text-xs capitalize text-muted-foreground">{k}</div>
              </div>
            ))}
          </div>
          <Field label="Resumen ejecutivo" value={o.resumenEjecutivo} />
          <div className="grid gap-3 sm:grid-cols-2">
            <List label="Pros" items={o.pros as string[]} tone="success" />
            <List label="Contras" items={o.contras as string[]} tone="danger" />
          </div>
          {Array.isArray(o.palancas) && o.palancas.length > 0 && (
            <div>
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Palancas para subir la nota
              </div>
              <ul className="space-y-2 text-sm">
                {(o.palancas as { accion: string; impactoPuntos: number; explicacion: string }[]).map(
                  (p, i) => (
                    <li key={i} className="rounded-2xl bg-card p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-foreground/90">{p.accion}</span>
                        <span className="badge bg-emerald-50 text-emerald-700">+{p.impactoPuntos} pts</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{p.explicacion}</p>
                    </li>
                  )
                )}
              </ul>
            </div>
          )}
        </div>
      );
    case "ESTRATEGA":
      return (
        <div className="space-y-3">
          {(o.opcionesDePivote as { titulo: string; descripcion: string; porQueEliminaRiesgos: string }[]).map(
            (p, i) => (
              <div key={i} className="rounded-2xl bg-card p-3">
                <div className="font-medium text-violet-800">{p.titulo}</div>
                <p className="mt-1 text-sm text-foreground/80">{p.descripcion}</p>
                <p className="mt-1 text-xs text-muted-foreground">✓ {p.porQueEliminaRiesgos}</p>
              </div>
            )
          )}
        </div>
      );
    case "ARQUITECTO":
      if (o.tipo === "PHYSICAL") {
        return (
          <div className="space-y-3">
            <List label="Insumos mínimos" items={o.insumosMinimos as string[]} />
            <Field label="Validación física preliminar" value={o.validacionFisicaPreliminar} />
            <List label="Requerimientos operativos" items={o.requerimientosOperativos as string[]} />
            {posicionamientoBlock(o)}
          </div>
        );
      }
      return (
        <div className="space-y-3">
          <Field label="Stack recomendado" value={o.stackRecomendado} />
          <Field label="Arquitectura base" value={o.arquitecturaBase} />
          <List label="Funciones esenciales del MVP" items={o.funcionesEsencialesMvp as string[]} />
          {posicionamientoBlock(o)}
        </div>
      );
    default:
      return <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(output, null, 2)}</pre>;
  }
}

export function agentKey(name: AgentName): AgentKey {
  return name;
}
