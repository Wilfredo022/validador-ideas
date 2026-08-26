"use client";

import { useState } from "react";
import { Search, RefreshCw, ExternalLink, Loader2, ChevronDown } from "lucide-react";
import { Field, List } from "@/components/ui/field";
import ExpandableText from "./expandable-text";

export interface ResearchReport {
  sintesis: string;
  mercado: {
    tamanioEstimado: string;
    tendencias: string[];
    contextoPais: string;
  };
  competencia: {
    nombre: string;
    tipo: "DIRECTA" | "INDIRECTA" | "SUSTITUTO";
    precio: string;
    propuesta: string;
    fortalezas: string;
    debilidades: string;
  }[];
  alternativasGratuitas: string[];
  oportunidad: string;
  amenazas: string[];
  fuentes: string[];
}

const TIPO_LABEL: Record<ResearchReport["competencia"][number]["tipo"], string> = {
  DIRECTA: "Directa",
  INDIRECTA: "Indirecta",
  SUSTITUTO: "Sustituto",
};

export default function MarketResearchCard({
  research,
  onRun,
  streaming,
  status,
  hasKey,
}: {
  research: ResearchReport | null;
  onRun: () => void;
  streaming: boolean;
  status?: string;
  hasKey: boolean;
}) {
  const [open, setOpen] = useState(!research);

  return (
    <div className="card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="flex flex-wrap items-center gap-2 text-lg font-bold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Search size={16} />
            </span>
            Investigación de mercado
            {research && !streaming && (
              <span className="badge bg-emerald-50 font-medium text-emerald-700">Lista</span>
            )}
          </h2>
          {(!research || open) && (
            <p className="mt-1 text-sm text-muted-foreground">
              Competencia real, tamaño de mercado y oportunidades. El debate usa estos datos.
            </p>
          )}
          {research && !open && !streaming && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{research.sintesis}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {research && !streaming && (
            <>
              <button type="button" className="btn btn-ghost text-xs" onClick={() => setOpen((v) => !v)}>
                {open ? "Ocultar" : "Ver informe"}
                <ChevronDown size={14} className={open ? "rotate-180" : ""} />
              </button>
              <button type="button" className="btn btn-ghost text-xs" onClick={onRun} disabled={streaming}>
                <RefreshCw size={13} />
                Re-investigar
              </button>
            </>
          )}
          {!research && (
            <button type="button" className="btn btn-primary" onClick={onRun} disabled={streaming}>
              {streaming ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              {streaming ? "Investigando…" : "Investigar el mercado"}
            </button>
          )}
        </div>
      </div>

      {!hasKey && !research && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Falta configurar el buscador web en <code className="font-semibold">.env</code> (por ejemplo{" "}
          <b>SERPER_API_KEY</b> de serper.dev o <b>TAVILY_API_KEY</b> de tavily.com) para poder investigar el
          mercado.
        </div>
      )}

      {!research && !streaming && hasKey && (
        <div className="mt-4 surface p-4 text-sm text-muted-foreground">
          El Investigador rastreará competencia, precios y contexto del país. Hazlo antes del debate para un veredicto más preciso.
        </div>
      )}

      {streaming && (
        <div className="mt-4 surface p-4 text-sm">
          <div className="mb-2 flex items-center gap-2 text-foreground/70">
            <Loader2 size={14} className="animate-spin text-primary" />
            El Investigador está rastreando el mercado…
          </div>
          {status && (
            <div className="rounded-xl bg-card px-3 py-2 text-xs text-muted-foreground">
              <span className="text-muted-foreground/70">Buscando: </span>
              {status}
            </div>
          )}
        </div>
      )}

      {research && !streaming && open && (
        <div className="mt-4 space-y-4">
          <Field label="Síntesis" value={research.sintesis} />

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Tamaño de mercado" value={research.mercado?.tamanioEstimado} />
            <Field label="Contexto del país" value={research.mercado?.contextoPais} />
          </div>
          <List label="Tendencias" items={research.mercado?.tendencias} />

          {Array.isArray(research.competencia) && research.competencia.length > 0 && (
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Competencia real ({research.competencia.length})
              </div>
              <div className="space-y-2">
                {research.competencia.map((c, i) => (
                  <div key={i} className="surface p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{c.nombre}</span>
                      <span className="badge bg-card text-[10px] text-muted-foreground">
                        {TIPO_LABEL[c.tipo] ?? c.tipo}
                      </span>
                      {c.precio && <span className="badge bg-emerald-50 text-emerald-700">{c.precio}</span>}
                    </div>
                    <p className="mt-1.5 text-sm text-foreground/75">{c.propuesta}</p>
                    <div className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
                      <div className="text-emerald-700">
                        <span className="text-muted-foreground">Fortalezas: </span>
                        {c.fortalezas}
                      </div>
                      <div className="text-rose-700">
                        <span className="text-muted-foreground">Debilidades: </span>
                        {c.debilidades}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <List label="Alternativas gratuitas o sustitutos" items={research.alternativasGratuitas} />

          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
              Oportunidad detectada
            </div>
            <ExpandableText text={research.oportunidad} lines={3} className="text-sm text-foreground/90" />
          </div>

          <List label="Amenazas del mercado" items={research.amenazas} />

          {Array.isArray(research.fuentes) && research.fuentes.length > 0 && (
            <div>
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Fuentes
              </div>
              <ul className="space-y-1">
                {research.fuentes.map((url, i) => (
                  <li key={i}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink size={11} />
                      {url.length > 60 ? url.slice(0, 60) + "…" : url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
