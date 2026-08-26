import { Check, Compass, MessageCircle, Scale, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type PhaseKey = "discovery" | "interview" | "research" | "debate";

const ALL_STEPS = [
  { key: "discovery" as const, label: "Explorar", icon: Compass },
  { key: "interview" as const, label: "Entrevista", icon: MessageCircle },
  { key: "research" as const, label: "Mercado", icon: Search },
  { key: "debate" as const, label: "Veredicto", icon: Scale },
];

export default function PhaseStepper({
  includeDiscovery = false,
  current,
  completed,
}: {
  includeDiscovery?: boolean;
  current: PhaseKey;
  completed: Partial<Record<PhaseKey, boolean>>;
}) {
  const steps = ALL_STEPS.filter((s) => s.key !== "discovery" || includeDiscovery);

  return (
    <ol className="flex items-center gap-1.5 overflow-x-auto pb-1">
      {steps.map((step, i) => {
        const done = Boolean(completed[step.key]);
        const active = step.key === current;
        const Icon = step.icon;
        return (
          <li key={step.key} className="flex items-center gap-1.5">
            {i > 0 && <span className="h-px w-4 shrink-0 bg-border sm:w-8" />}
            <div
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold",
                done && !active && "bg-emerald-50 text-emerald-700",
                active && "bg-primary text-white shadow-md shadow-primary/20",
                !done && !active && "bg-muted text-muted-foreground"
              )}
            >
              {done && !active ? <Check size={13} /> : <Icon size={13} />}
              {step.label}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
