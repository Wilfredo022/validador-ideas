import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import IdeaView from "@/components/idea-view";
import DiscoveryChat from "@/components/discovery-chat";
import PhaseStepper, { type PhaseKey } from "@/components/phase-stepper";
import ExpandableText from "@/components/expandable-text";
import { ChevronLeft, Laptop, Store } from "lucide-react";

export const dynamic = "force-dynamic";

async function loadIdea(id: string) {
  return prisma.idea.findUnique({
    where: { id },
    include: {
      refinements: { orderBy: { createdAt: "asc" } },
      debates: {
        include: {
          agents: { orderBy: { createdAt: "asc" } },
          pivots: true,
        },
        orderBy: { round: "asc" },
      },
      research: { orderBy: { createdAt: "desc" } },
    },
  });
}

export default async function IdeaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let idea: Awaited<ReturnType<typeof loadIdea>> = null;
  try {
    idea = await loadIdea(id);
  } catch {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
        No se pudo conectar con la base de datos (Neon). Si tienes el VPN activo,
        desconéctalo o excluye *.neon.tech del túnel y recarga.
      </div>
    );
  }

  if (!idea) notFound();

  const lastResearch = idea.research.find((r) => r.status === "COMPLETE") ?? null;

  const debates = idea.debates.map((d) => ({
    id: d.id,
    round: d.round,
    context: d.context,
    score: d.score,
    verdict: d.verdict,
    summary: d.summary,
    status: d.status,
    agents: d.agents.map((a) => ({
      agent: a.agent,
      output: a.output,
      model: a.model,
    })),
    pivots: d.pivots.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      rationale: p.rationale,
      chosen: p.chosen,
    })),
  }));

  const hasVerdict = debates.some((d) => d.score != null);
  const current: PhaseKey =
    idea.stage === "DISCOVERY"
      ? "discovery"
      : !idea.interviewDone
        ? "interview"
        : hasVerdict
          ? "debate"
          : "research";

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ChevronLeft size={16} /> Volver a ideas
        </Link>
        <PhaseStepper
          includeDiscovery={idea.stage === "DISCOVERY"}
          current={current}
          completed={{
            discovery: idea.stage !== "DISCOVERY",
            interview: idea.interviewDone,
            research: Boolean(lastResearch),
            debate: hasVerdict,
          }}
        />
      </div>

      <div className="card relative overflow-hidden">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative">
          <span className="badge bg-muted text-muted-foreground">
            {idea.domain === "SOFTWARE" ? (
              <span className="inline-flex items-center gap-1">
                <Laptop size={12} /> Proyecto digital
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Store size={12} /> Mundo real
              </span>
            )}
          </span>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{idea.title}</h1>
          <div className="mt-3 max-w-3xl">
            <ExpandableText
              text={idea.description}
              lines={4}
              className="whitespace-pre-wrap text-sm text-muted-foreground"
            />
          </div>
        </div>
      </div>

      {idea.stage === "DISCOVERY" ? (
        <DiscoveryChat
          ideaId={idea.id}
          initial={idea.refinements.map((r) => ({ role: r.role, content: r.content }))}
        />
      ) : (
        <IdeaView
          idea={{ id: idea.id, interviewDone: idea.interviewDone }}
          refinements={idea.refinements.map((r) => ({ role: r.role, content: r.content }))}
          debates={debates}
          research={
            lastResearch
              ? {
                  report: lastResearch.report,
                  model: lastResearch.model,
                }
              : null
          }
          hasSearchKey={Boolean(process.env.TAVILY_API_KEY)}
        />
      )}
    </div>
  );
}
