export function Field({ label, value }: { label: string; value: unknown }) {
  if (value == null || value === "") return null;
  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="text-sm leading-relaxed text-foreground/85">{String(value)}</div>
    </div>
  );
}

export function List({
  label,
  items,
  tone = "neutral",
}: {
  label: string;
  items?: string[];
  tone?: "neutral" | "success" | "danger" | "accent";
}) {
  if (!items || items.length === 0) return null;
  const bullet =
    tone === "success"
      ? "text-emerald-500"
      : tone === "danger"
        ? "text-rose-500"
        : tone === "accent"
          ? "text-primary"
          : "text-muted-foreground/50";
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <ul className="space-y-1.5 text-sm leading-relaxed text-foreground/85">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span className={`mt-0.5 ${bullet}`}>•</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
