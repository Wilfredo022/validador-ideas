"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lightbulb, Menu, Scale, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Ideas", icon: Lightbulb },
  { href: "/configuracion", label: "Modelos", icon: Settings },
] as const;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "text-white/55 hover:bg-white/8 hover:text-white"
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] p-4 md:block">
        <div className="flex h-full flex-col rounded-[28px] bg-sidebar p-5 shadow-2xl">
          <Link href="/" className="mb-8 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/35">
              <Scale size={20} />
            </span>
            <div>
              <div className="text-sm font-bold tracking-tight text-white">Validador</div>
              <div className="text-[11px] text-white/40">Jurado multi-agente</div>
            </div>
          </Link>
          <NavLinks />
          <div className="mt-auto rounded-2xl bg-white/5 p-4">
            <p className="text-xs leading-relaxed text-white/45">
              Seis agentes debaten tu idea para quitar el sesgo optimista antes de invertir.
            </p>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur-xl md:hidden">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
            <Scale size={16} />
          </span>
          Validador
        </Link>
        <button
          type="button"
          className="rounded-xl p-2 text-muted-foreground hover:bg-muted"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[272px] flex-col bg-sidebar p-5 shadow-2xl">
            <div className="mb-8 flex items-center justify-between">
              <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white">
                  <Scale size={20} />
                </span>
                <div>
                  <div className="text-sm font-bold text-white">Validador</div>
                  <div className="text-[11px] text-white/40">Jurado multi-agente</div>
                </div>
              </Link>
              <button
                type="button"
                className="rounded-xl p-2 text-white/60 hover:bg-white/10"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <main className="md:pl-[272px]">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
