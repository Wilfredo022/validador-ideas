"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSSE } from "@/hooks/use-sse";
import InterviewChat from "./interview-chat";
import AgentCard from "./agent-card";
import VerdictBanner from "./verdict-banner";
import RoadmapCard from "./roadmap-card";
import MarketResearchCard, { type ResearchReport } from "./market-research-card";
import { ArrowRight, ChevronDown, Loader2, RefreshCw } from "lucide-react";
import ExpandableText from "./expandable-text";

type AgentName =
  | "INVESTIGADOR"
  | "VISIONARIO"
  | "INQUISIDOR"
  | "CAPITALISTA"
  | "JUEZ"
  | "ESTRATEGA"
  | "ARQUITECTO";

interface AgentSlot {
  output?: unknown;
  model?: string;
  streaming?: boolean;
}

interface Pivot {
  id: string;
  title: string;
  description: string;
  rationale: string;
  chosen?: boolean;
}

interface JudgeOutput {
  puntaje: number;
  ejes: { problema: number; construccion: number; rentabilidad: number; competitividad: number };
  resumenEjecutivo: string;
  pros: string[];
  contras: string[];
  palancas: { accion: string; impactoPuntos: number; explicacion: string }[];
}

interface LiveDebate {
  debateId: string;
  round: number;
  agents: Partial<Record<AgentName, AgentSlot>>;
  judge?: JudgeOutput;
  verdict?: string;
  score?: number;
  pivots?: Pivot[];
  status: string;
}

type ServerDebate = {
  id: string;
  round: number;
  context: string | null;
  score: number | null;
  verdict: string | null;
  summary: string | null;
  status: string;
  agents: { agent: AgentName; output: unknown; model: string }[];
  pivots: Pivot[];
};

function toLive(d: ServerDebate): LiveDebate {
  const agents: LiveDebate["agents"] = {};
  for (const a of d.agents) agents[a.agent] = { output: a.output, model: a.model };
  const judge = agents.JUEZ?.output as JudgeOutput | undefined;
  return {
    debateId: d.id,
    round: d.round,
    agents,
    judge,
    verdict: d.verdict ?? undefined,
    score: d.score ?? undefined,
    pivots: d.pivots,
    status: d.status,
  };
}

const ORDER: AgentName[] = [
  "VISIONARIO",
  "INQUISIDOR",
  "CAPITALISTA",
  "JUEZ",
  "ESTRATEGA",
  "ARQUITECTO",
];

function emptyLive(): LiveDebate {
  return { debateId: "", round: 0, agents: {}, status: "RUNNING" };
}

export default function IdeaView({
  idea,
  refinements,
  debates,
  research,
  hasSearchKey,
}: {
  idea: { id: string; interviewDone: boolean };
  refinements: { role: string; content: string }[];
  debates: ServerDebate[];
  research: { report: unknown; model?: string | null } | null;
  hasSearchKey: boolean;
}) {
  const router = useRouter();
  const { run, running } = useSSE();
  const researchHook = useSSE();

  const [interviewDone, setInterviewDone] = useState(idea.interviewDone);
  const [updateText, setUpdateText] = useState("");
  const [researchReport, setResearchReport] = useState<ResearchReport | null>(
    research?.report ? (research.report as ResearchReport) : null
  );
  const [researchStreaming, setResearchStreaming] = useState(false);
  const [researchStatus, setResearchStatus] = useState("");

  const latestComplete = [...debates].reverse().find((d) => d.score != null) ?? null;
  const hasStaleRunning = debates.some(
    (d) => d.status === "RUNNING" && (d.score == null || d.round > (latestComplete?.round ?? 0))
  );
  const [live, setLive] = useState<LiveDebate | null>(
    latestComplete ? toLive(latestComplete) : null
  );

  function handleResearchEvent(ev: Record<string, unknown>) {
    const type = ev.type as string;
    if (type === "research-start") {
      setResearchStreaming(true);
    } else if (type === "research-query") {
      setResearchStatus(ev.query as string);
    } else if (type === "research-progress") {
      setResearchStatus(`Procesando resultados… (${ev.done}/${ev.total})`);
    } else if (type === "research-complete") {
      setResearchReport(ev.report as ResearchReport);
      setResearchStreaming(false);
      setResearchStatus("");
      toast.success("Investigación de mercado completada");
    } else if (type === "research-error") {
      setResearchStreaming(false);
      setResearchStatus("");
      toast.error((ev.error as string) || "Error en la investigación");
    }
  }

  function startResearch() {
    setResearchStreaming(true);
    setResearchStatus("");
    researchHook.run(
      "/api/research",
      { ideaId: idea.id },
      {
        onEvent: handleResearchEvent,
        onError: (err) => {
          setResearchStreaming(false);
          toast.error(err.message);
        },
        onDone: () => router.refresh(),
      }
    );
  }

  function handleEvent(ev: Record<string, unknown>) {
    const type = ev.type as string;
    if (type === "round") {
      setLive((l) => ({
        ...(l ?? emptyLive()),
        debateId: ev.debateId as string,
        round: ev.round as number,
        status: "RUNNING",
      }));
    } else if (type === "agent-start") {
      const agent = ev.agent as AgentName;
      setLive((l) => {
        const base = l ?? emptyLive();
        return { ...base, agents: { ...base.agents, [agent]: { streaming: true } } };
      });
    } else if (type === "agent-complete") {
      const agent = ev.agent as AgentName;
      setLive((l) => {
        const base = l ?? emptyLive();
        return {
          ...base,
          agents: {
            ...base.agents,
            [agent]: { output: ev.output, model: ev.model as string, streaming: false },
          },
        };
      });
    } else if (type === "agent-error") {
      const agent = ev.agent as AgentName;
      setLive((l) => {
        const base = l ?? emptyLive();
        return { ...base, agents: { ...base.agents, [agent]: { streaming: false } } };
      });
    } else if (type === "verdict") {
      setLive((l) => ({
        ...(l ?? emptyLive()),
        judge: ev.judge as JudgeOutput,
        verdict: ev.verdict as string,
        score: ev.score as number,
      }));
    } else if (type === "pivots") {
      const list = (
        ev.pivots as {
          id: string;
          titulo: string;
          descripcion: string;
          porQueEliminaRiesgos: string;
        }[]
      ).map((p) => ({
        id: p.id,
        title: p.titulo,
        description: p.descripcion,
        rationale: p.porQueEliminaRiesgos,
      }));
      setLive((l) => ({ ...(l ?? emptyLive()), pivots: list }));
    } else if (type === "roadmap") {
      const arch = live?.agents.ARQUITECTO;
      setLive((l) => ({
        ...(l ?? emptyLive()),
        agents: { ...(l?.agents ?? {}), ARQUITECTO: { output: ev.roadmap, streaming: false } },
      }));
      void arch;
    } else if (type === "error") {
      toast.error((ev.error as string) || "Error en el análisis");
      setLive((l) => (l ? { ...l, status: "ERROR" } : l));
    } else if (type === "done") {
      setLive((l) => (l ? { ...l, status: "COMPLETE" } : l));
      toast.success("Análisis completado");
    }
  }

  function finish() {
    router.refresh();
  }

  function startAnalysis() {
    setLive(null);
    run("/api/analyze", { ideaId: idea.id }, { onEvent: handleEvent, onDone: finish });
  }

  function startPivot(pivotId: string) {
    if (!live?.debateId) return;
    run(
      "/api/pivot",
      { debateId: live.debateId, pivotOptionId: pivotId },
      { onEvent: handleEvent, onDone: finish }
    );
  }

  function searchPivots() {
    if (!live?.debateId) return;
    toast.info("El Estratega está buscando pivotes…");
    run("/api/pivots", { debateId: live.debateId }, { onEvent: handleEvent, onDone: finish });
  }

  function addUpdateAndReanalyze() {
    const content = updateText.trim();
    if (!content) return;
    setUpdateText("");
    toast.info("Añadiendo tu información y re-analizando…");
    run(
      "/api/analyze",
      { ideaId: idea.id, update: content },
      { onEvent: handleEvent, onDone: finish }
    );
  }

  if (!interviewDone) {
    return (
      <InterviewChat
        ideaId={idea.id}
        initial={refinements}
        onDone={() => setInterviewDone(true)}
      />
    );
  }

  const shownAgents = ORDER.filter((a) => live?.agents[a]);
  const hasVerdict = Boolean(live?.judge && live.verdict);

  return (
    <div className="space-y-6">
      {hasStaleRunning && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Hay un análisis de una ronda reciente que quedó <b>interrumpido</b> y no terminó de
          guardarse. Mostrando el último veredicto completo. Puedes iniciar un nuevo análisis o
          aplicar un pivote si lo hay.
        </div>
      )}

      {hasVerdict && (
        <VerdictBanner judge={live!.judge!} verdict={live!.verdict!} />
      )}

      {live?.pivots && live.pivots.length > 0 && (
        <section
          className={`rounded-[24px] border p-5 sm:p-6 ${
            live.verdict === "REQUIERE_PIVOTE"
              ? "border-amber-200 bg-gradient-to-br from-amber-50 to-card"
              : "border-violet-200 bg-gradient-to-br from-violet-50 to-card"
          }`}
        >
          <h2
            className={`text-lg font-bold tracking-tight ${
              live.verdict === "REQUIERE_PIVOTE" ? "text-amber-800" : "text-violet-800"
            }`}
          >
            {live.verdict === "REQUIERE_PIVOTE"
              ? "Elige un pivote"
              : "Pivotes opcionales"}
          </h2>
          <p className="mt-1 mb-5 text-sm text-muted-foreground">
            {live.verdict === "REQUIERE_PIVOTE"
              ? "La idea tiene potencial, pero esta ejecución fallará. Elige un enfoque y el jurado vuelve a debatirlo."
              : "Otras formas de llevar la idea más lejos. Elige una para re-debatir."}
          </p>
          <div className="grid gap-4 lg:grid-cols-3">
            {live.pivots.map((p, i) => (
              <article
                key={p.id}
                className="flex flex-col rounded-2xl border border-border bg-card p-5"
              >
                <div className="mb-3 flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {i + 1}
                  </span>
                  <h3 className="text-sm font-bold leading-snug">{p.title}</h3>
                </div>
                <ExpandableText text={p.description} lines={3} className="text-sm text-foreground/75" />
                <div className="mt-3 rounded-xl bg-emerald-50 p-3">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                    Por qué funciona
                  </p>
                  <ExpandableText text={p.rationale} lines={2} className="text-xs text-emerald-900/80" />
                </div>
                <button
                  type="button"
                  onClick={() => startPivot(p.id)}
                  disabled={running}
                  className="btn btn-primary mt-4 w-full"
                >
                  Aplicar este pivote
                  <ArrowRight size={14} />
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {live && !running && (
        <div className="flex justify-end">
          <button type="button" className="btn btn-ghost text-xs" onClick={startAnalysis}>
            <Loader2 size={13} />
            Re-analizar la idea
          </button>
        </div>
      )}

      {!hasVerdict && (
        <MarketResearchCard
          research={researchReport}
          onRun={startResearch}
          streaming={researchStreaming}
          status={researchStatus}
          hasKey={hasSearchKey}
        />
      )}

      {!live && (
        <div className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Análisis profundo</h2>
            <p className="text-sm text-muted-foreground">
              El jurado de agentes debatirá tu idea en vivo.
            </p>
            {!researchReport && !researchStreaming && (
              <p className="mt-1 text-xs text-amber-700">
                Aún no has investigado el mercado. El debate será más preciso si lo haces antes.
              </p>
            )}
          </div>
          <button type="button" className="btn btn-primary shrink-0" onClick={startAnalysis} disabled={running}>
            <Loader2 size={16} className={running ? "animate-spin" : ""} />
            Iniciar análisis
          </button>
        </div>
      )}

      {live?.debateId && !running && (
        <details className="card group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold tracking-tight">
                <RefreshCw size={16} className="text-primary" />
                Iterar o añadir datos
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Nueva información o más pivotes, sin perder la esencia.
              </p>
            </div>
            <ChevronDown size={18} className="shrink-0 text-muted-foreground transition group-open:rotate-180" />
          </summary>
          <div className="mt-4 space-y-4 border-t border-border pt-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                El Estratega puede proponer formas de reestructurar la idea.
              </p>
              <button
                type="button"
                className="btn btn-ghost shrink-0"
                onClick={searchPivots}
                disabled={running}
              >
                <RefreshCw size={14} />
                Buscar más pivotes
              </button>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground/80">
                ¿Qué cambió? Se añadirá a la visión y el jurado re-debatirá.
              </label>
              <textarea
                className="input min-h-20"
                value={updateText}
                onChange={(e) => setUpdateText(e.target.value)}
                placeholder="Ej: Ya implementamos la funcionalidad X, tenemos 10 negocios piloto y cobramos desde el día 1…"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={addUpdateAndReanalyze}
                  disabled={!updateText.trim() || running}
                >
                  <RefreshCw size={14} />
                  Añadir y re-analizar
                </button>
              </div>
            </div>
          </div>
        </details>
      )}

      {hasVerdict && (
        <MarketResearchCard
          research={researchReport}
          onRun={startResearch}
          streaming={researchStreaming}
          status={researchStatus}
          hasKey={hasSearchKey}
        />
      )}

      {shownAgents.length > 0 && (
        <section>
          <h2 className="mb-3 flex flex-wrap items-center gap-2 text-lg font-bold tracking-tight">
            El debate
            <span className="text-xs font-normal text-muted-foreground">
              toca cada agente para el argumento completo
            </span>
          </h2>
          <div className="space-y-2">
            {shownAgents.map((a) => (
              <AgentCard
                key={`${a}-${live?.round}`}
                agent={a}
                output={live?.agents[a]?.output}
                model={live?.agents[a]?.model}
                streaming={live?.agents[a]?.streaming}
                debateId={live?.debateId}
                onJudgeUpdated={() => router.refresh()}
              />
            ))}
          </div>
        </section>
      )}

      {running && shownAgents.length === 0 && (
        <div className="card animate-pulse-soft text-center text-sm text-muted-foreground">
          El jurado está deliberando…
        </div>
      )}

      {live?.verdict === "APROBADO" && Boolean(live.agents.ARQUITECTO?.output) && (
        <RoadmapCard roadmap={live.agents.ARQUITECTO?.output as never} />
      )}

      {debates.length > 1 && (
        <div className="card">
          <h2 className="mb-4 text-lg font-bold tracking-tight">Evolución del debate</h2>
          <div className="flex flex-wrap items-center gap-3">
            {debates.map((d, i) => (
              <Fragment key={d.id}>
                <div
                  className={`flex min-w-[72px] flex-col items-center rounded-2xl border px-4 py-2.5 ${
                    d.score != null
                      ? "border-border bg-muted/50"
                      : "border-dashed border-amber-300 bg-amber-50"
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Ronda {d.round}
                  </span>
                  {d.score != null ? (
                    <span className="text-xl font-extrabold tabular-nums">{d.score}</span>
                  ) : (
                    <span className="text-xs italic text-amber-700">
                      {d.status === "RUNNING" ? "en curso" : "—"}
                    </span>
                  )}
                </div>
                {i < debates.length - 1 && <ArrowRight size={14} className="text-muted-foreground/30" />}
              </Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
