"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ExpandableText({
  text,
  lines = 3,
  className,
}: {
  text: string;
  lines?: 2 | 3 | 4 | 5;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    if (open) return;
    const el = ref.current;
    if (!el) return;
    const check = () => setOverflows(el.scrollHeight > el.clientHeight + 4);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, lines, open]);

  const clamp =
    lines === 2
      ? "line-clamp-2"
      : lines === 3
        ? "line-clamp-3"
        : lines === 4
          ? "line-clamp-4"
          : "line-clamp-5";

  return (
    <div className="min-w-0">
      <p ref={ref} className={cn("leading-relaxed", !open && clamp, className)}>
        {text}
      </p>
      {(overflows || open) && (
        <button
          type="button"
          className="mt-1 inline-flex items-center gap-0.5 text-xs font-semibold text-primary"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Ver menos" : "Ver más"}
          <ChevronDown size={13} className={cn("transition", open && "rotate-180")} />
        </button>
      )}
    </div>
  );
}
