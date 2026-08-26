"use client";

import Link from "next/link";
import { scoreColor } from "./score-gauge";
import { useTransition } from "react";
import { deleteIdea } from "@/app/actions";
import { toast } from "sonner";
import { Compass, Laptop, Store, Trash2 } from "lucide-react";

type Verdict = "DESCARTAR" | "REQUIERE_PIVOTE" | "APROBADO";

const verdictStyle: Record<Verdict, string> = {
  APROBADO: "bg-emerald-50 text-emerald-700",
  REQUIERE_PIVOTE: "bg-amber-50 text-amber-700",
  DESCARTAR: "bg-rose-50 text-rose-700",
};

export default function IdeaCard({
  id,
  title,
  description,
  domain,
  score,
  verdict,
  stage = "READY",
}: {
  id: string;
  title: string;
  description: string;
  domain: "SOFTWARE" | "PHYSICAL";
  score: number;
  verdict: Verdict | null;
  stage?: "DISCOVERY" | "READY";
}) {
  const [pending, startTransition] = useTransition();

  function onDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      await deleteIdea(id);
      toast.success("Idea eliminada");
    });
  }

  const isDiscovery = stage === "DISCOVERY";

  return (
    <Link
      href={`/ideas/${id}`}
      className="card group relative flex flex-col gap-3 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_16px_40px_rgba(108,92,231,0.12)]"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="badge bg-muted text-muted-foreground">
          {isDiscovery ? (
            <span className="inline-flex items-center gap-1">
              <Compass size={12} /> En desarrollo
            </span>
          ) : domain === "SOFTWARE" ? (
            <span className="inline-flex items-center gap-1">
              <Laptop size={12} /> Digital
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Store size={12} /> Mundo real
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className="rounded-lg p-1.5 text-muted-foreground/40 transition hover:bg-rose-50 hover:text-rose-500"
          title="Eliminar"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <h3 className="text-base font-bold leading-snug tracking-tight">{title}</h3>
      <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{description}</p>

      <div className="mt-auto flex items-center justify-between pt-1">
        {isDiscovery ? (
          <span className="badge animate-pulse-soft bg-primary/10 text-primary">Explorando…</span>
        ) : verdict ? (
          <>
            <span className={`badge ${verdictStyle[verdict]}`}>
              {verdict === "APROBADO"
                ? "Aprobado"
                : verdict === "REQUIERE_PIVOTE"
                  ? "Requiere pivote"
                  : "Descartar"}
            </span>
            <span className="text-2xl font-extrabold tabular-nums" style={{ color: scoreColor(score) }}>
              {score}
            </span>
          </>
        ) : (
          <span className="badge bg-muted text-muted-foreground">Sin analizar</span>
        )}
      </div>
    </Link>
  );
}
