"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import ScoreGauge, { scoreColor } from "./score-gauge";
import ExpandableText from "./expandable-text";
import { cn } from "@/lib/utils";

interface JudgeOutput {
  puntaje: number;
  ejes: { problema: number; construccion: number; rentabilidad: number; competitividad: number };
  resumenEjecutivo: string;
  pros: string[];
  contras: string[];
  palancas: { accion: string; impactoPuntos: number; explicacion: string }[];
}

const verdictLabel: Record<string, { text: string; hint: string; cls: string }> = {
  APROBADO: {
    text: "Aprobado",
    hint: "El jurado ve una idea viable. Sigue la hoja de ruta.",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  REQUIERE_PIVOTE: {
    text: "Requiere pivote",
    hint: "Hay potencial, pero la ejecución actual no va a funcionar.",
    cls: "bg-amber-50 text-amber-800 border-amber-200",
  },
  DESCARTAR: {
    text: "Descartar",
    hint: "El jurado no ve una base sólida para seguir así.",
    cls: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

const AXES: { key: keyof JudgeOutput["ejes"]; label: string; hint: string }[] = [
  { key: "problema", label: "Problema", hint: "¿Duele de verdad?" },
  { key: "construccion", label: "Construcción", hint: "¿Se puede ejecutar?" },
  { key: "rentabilidad", label: "Rentabilidad", hint: "¿Hay negocio?" },
  { key: "competitividad", label: "Competitividad", hint: "¿Se diferencia?" },
];

function barColor(value: number) {
  if (value >= 18) return "bg-emerald-500";
  if (value >= 12) return "bg-amber-500";
  return "bg-rose-500";
}

type Tab = "resumen" | "mejorar" | "balance";

export default function VerdictBanner({
  judge,
  verdict,
}: {
  judge: JudgeOutput;
  verdict: string;
}) {
  const color = scoreColor(judge.puntaje);
  const v = verdictLabel[verdict] ?? verdictLabel.DESCARTAR;
  const [tab, setTab] = useState<Tab>("resumen");
  const hasPalancas = judge.palancas.length > 0;

  const tabs: { id: Tab; label: string; hidden?: boolean }[] = [
    { id: "resumen", label: "Resumen" },
    { id: "mejorar", label: "Cómo subir la nota", hidden: !hasPalancas },
    { id: "balance", label: "A favor y en contra" },
  ];

  return (
    <section
      className="overflow-hidden rounded-[24px] border border-border bg-card shadow-[0_10px_40px_rgba(22,22,31,0.06)]"
      style={{ borderColor: `${color}33` }}
    >
      <div
        className="px-5 py-6 sm:px-6 sm:py-7"
        style={{ background: `linear-gradient(180deg, ${color}14 0%, #ffffff 72%)` }}
      >
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
          <ScoreGauge score={judge.puntaje} size={128} />
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Veredicto del jurado
            </p>
            <span className={`badge mt-2 border px-3 py-1 text-sm ${v.cls}`}>{v.text}</span>
            <p className="mt-2 text-sm font-medium text-foreground/80">{v.hint}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {AXES.map((axis) => {
            const value = judge.ejes[axis.key];
            return (
              <div key={axis.key} className="rounded-2xl bg-white/80 px-3.5 py-3 ring-1 ring-border/80">
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{axis.label}</div>
                    <div className="text-[11px] text-muted-foreground">{axis.hint}</div>
                  </div>
                  <div className="text-sm font-extrabold tabular-nums">
                    {value}
                    <span className="text-xs font-medium text-muted-foreground">/25</span>
                  </div>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full transition-all", barColor(value))}
                    style={{ width: `${Math.max(4, (value / 25) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-t border-border px-3 pt-3 sm:px-5">
        {tabs
          .filter((t) => !t.hidden)
          .map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn("chip shrink-0", tab === t.id ? "chip-on" : "chip-off")}
            >
              {t.label}
            </button>
          ))}
      </div>

      <div className="p-5 sm:p-6">
        {tab === "resumen" && (
          <div>
            <h2 className="mb-2 text-lg font-bold tracking-tight">¿Qué decidió el Juez?</h2>
            <ExpandableText
              text={judge.resumenEjecutivo}
              lines={4}
              className="text-sm text-foreground/80"
            />
          </div>
        )}

        {tab === "mejorar" && hasPalancas && (
          <div>
            <h2 className="mb-1 flex items-center gap-2 text-lg font-bold tracking-tight">
              <TrendingUp size={18} className="text-amber-600" />
              Cómo subir esta nota
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Acciones concretas. El número es el impacto estimado en puntos.
            </p>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {judge.palancas.map((p, i) => (
                <article key={i} className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-sm font-extrabold text-emerald-700">
                    +{p.impactoPuntos}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold leading-snug">{p.accion}</h3>
                    {p.explicacion && (
                      <ExpandableText
                        text={p.explicacion}
                        lines={3}
                        className="mt-1 text-xs text-muted-foreground"
                      />
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {tab === "balance" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs">+</span>
                A favor
                <span className="ml-auto text-xs font-medium text-emerald-700/70">{judge.pros.length}</span>
              </div>
              <ul className="space-y-3">
                {judge.pros.map((p, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <ExpandableText text={p} lines={3} className="text-foreground/80" />
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-rose-700">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-xs">−</span>
                En contra
                <span className="ml-auto text-xs font-medium text-rose-700/70">{judge.contras.length}</span>
              </div>
              <ul className="space-y-3">
                {judge.contras.map((p, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                    <ExpandableText text={p} lines={3} className="text-foreground/80" />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
