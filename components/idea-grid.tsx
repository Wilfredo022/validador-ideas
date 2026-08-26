"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import IdeaCard from "./idea-card";
import { cn } from "@/lib/utils";

export type IdeaRow = {
  id: string;
  title: string;
  description: string;
  domain: "SOFTWARE" | "PHYSICAL";
  score: number;
  verdict: "DESCARTAR" | "REQUIERE_PIVOTE" | "APROBADO" | null;
  createdAt: string;
};

export default function IdeaGrid({ ideas }: { ideas: IdeaRow[] }) {
  const [domain, setDomain] = useState<"all" | "SOFTWARE" | "PHYSICAL">("all");
  const [verdict, setVerdict] = useState<
    "all" | "APROBADO" | "REQUIERE_PIVOTE" | "DESCARTAR" | "PENDING"
  >("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ideas
      .filter((i) => (domain === "all" ? true : i.domain === domain))
      .filter((i) => {
        if (verdict === "all") return true;
        if (verdict === "PENDING") return i.verdict == null;
        return i.verdict === verdict;
      })
      .filter((i) =>
        q ? i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q) : true
      )
      .sort((a, b) => b.score - a.score);
  }, [ideas, domain, verdict, query]);

  const analyzed = ideas.filter((i) => i.verdict != null);
  const featured = [...analyzed].sort((a, b) => b.score - a.score).slice(0, 3);

  if (ideas.length === 0) return null;

  return (
    <div className="space-y-8">
      {featured.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold tracking-tight">Destacadas</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {featured.map((i) => (
              <IdeaCard key={i.id} {...i} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-lg font-bold tracking-tight">Todas tus ideas</h2>
          <div className="relative w-full lg:max-w-xs">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="input py-2.5 pl-10"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar idea…"
            />
          </div>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {(["all", "SOFTWARE", "PHYSICAL"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDomain(d)}
              className={cn("chip", domain === d ? "chip-on" : "chip-off")}
            >
              {d === "all" ? "Todas" : d === "SOFTWARE" ? "Digital" : "Mundo real"}
            </button>
          ))}
          <span className="mx-1 hidden h-6 w-px self-center bg-border sm:block" />
          {(
            [
              ["all", "Cualquier veredicto"],
              ["APROBADO", "Aprobadas"],
              ["REQUIERE_PIVOTE", "Pivote"],
              ["DESCARTAR", "Descartadas"],
              ["PENDING", "Pendientes"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => setVerdict(v)}
              className={cn("chip", verdict === v ? "chip-on" : "chip-off")}
            >
              {label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="card text-center text-sm text-muted-foreground">
            No hay ideas con este filtro.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((i) => (
              <IdeaCard key={i.id} {...i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
