import { prisma } from "@/lib/prisma";
import IdeaForm from "@/components/idea-form";
import IdeaGrid from "@/components/idea-grid";
import IdeaCard from "@/components/idea-card";
import DiscoverySeedForm from "@/components/discovery-seed-form";
import { CheckCircle2, Compass, Lightbulb, Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let rows: Awaited<ReturnType<typeof loadIdeas>> = [];
  let dbError: string | null = null;
  try {
    rows = await loadIdeas();
  } catch {
    dbError =
      "No se pudo conectar con la base de datos (Neon). Si tienes el VPN activo, desconéctalo o excluye *.neon.tech del túnel y recarga.";
  }

  const discoveryIdeas = rows.filter((i) => i.stage === "DISCOVERY");
  const readyIdeas = rows.filter((i) => i.stage === "READY");
  const analyzed = readyIdeas.filter((i) => i.verdict != null);
  const approved = readyIdeas.filter((i) => i.verdict === "APROBADO").length;
  const avgScore = analyzed.length
    ? Math.round(analyzed.reduce((sum, i) => sum + i.score, 0) / analyzed.length)
    : 0;

  const stats = [
    { label: "Ideas", value: readyIdeas.length, icon: Lightbulb, tone: "bg-primary/10 text-primary" },
    { label: "Analizadas", value: analyzed.length, icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-600" },
    { label: "Promedio", value: analyzed.length ? avgScore : "—", icon: Trophy, tone: "bg-amber-50 text-amber-600" },
    { label: "Aprobadas", value: approved, icon: Compass, tone: "bg-sky-50 text-sky-600" },
  ];

  return (
    <div className="space-y-10 animate-fade-up">
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#3d32c7] via-[#5746e0] to-[#6c5ce7] p-6 text-white shadow-[0_20px_50px_rgba(87,70,224,0.32)] sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">Jurado multi-agente</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Valida tu idea antes de invertir
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/90 sm:text-base">
            Explora desde cero con el Descubridor, o trae una idea hecha. Seis agentes la debaten para eliminar el sesgo optimista.
          </p>
        </div>
      </section>

      {rows.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="card flex items-center gap-3 py-4">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${s.tone}`}>
                  <Icon size={18} />
                </span>
                <div>
                  <div className="text-xl font-extrabold tabular-nums leading-none">{s.value}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold tracking-tight">Empieza una validación</h2>
          <p className="text-sm text-muted-foreground">Elige el camino según lo clara que tengas la idea.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <IdeaForm />
          <DiscoverySeedForm />
        </div>
      </section>

      {dbError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center text-sm text-rose-700">
          {dbError}
        </div>
      )}

      {discoveryIdeas.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold tracking-tight">
            En desarrollo
            <span className="ml-2 text-xs font-normal text-muted-foreground">Banco de ideas</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {discoveryIdeas.map((i) => (
              <IdeaCard key={i.id} {...i} stage="DISCOVERY" />
            ))}
          </div>
        </section>
      )}

      <IdeaGrid ideas={readyIdeas} />
    </div>
  );
}

async function loadIdeas() {
  const ideas = await prisma.idea.findMany({ orderBy: { createdAt: "desc" } });
  return ideas.map((i) => ({
    id: i.id,
    title: i.title,
    description: i.description,
    domain: i.domain,
    score: i.score,
    verdict: i.verdict,
    stage: i.stage,
    createdAt: i.createdAt.toISOString(),
  }));
}
