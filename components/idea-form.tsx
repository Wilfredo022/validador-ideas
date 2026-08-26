"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Laptop, Store } from "lucide-react";
import { createIdea } from "@/app/actions";
import { cn } from "@/lib/utils";

export default function IdeaForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState<"SOFTWARE" | "PHYSICAL">("SOFTWARE");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createIdea({ title, description, domain });
      toast.success("Idea creada. Ahora entrevista al Visionario.");
      router.push(`/ideas/${res.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear la idea");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card flex h-full flex-col space-y-4">
      <div>
        <span className="badge bg-primary/10 text-primary">Idea lista</span>
        <h2 className="mt-3 text-lg font-bold tracking-tight">Ya sé qué quiero validar</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe el problema y la solución. El Visionario te hará preguntas para completar la visión.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setDomain("SOFTWARE")}
          className={cn("btn flex-1", domain === "SOFTWARE" ? "btn-primary" : "btn-ghost")}
        >
          <Laptop size={15} />
          Digital
        </button>
        <button
          type="button"
          onClick={() => setDomain("PHYSICAL")}
          className={cn("btn flex-1", domain === "PHYSICAL" ? "btn-primary" : "btn-ghost")}
        >
          <Store size={15} />
          Mundo real
        </button>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">Título de la idea</label>
        <input
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej: App de delivery para pueblos rurales"
          required
          minLength={3}
        />
      </div>

      <div className="flex-1">
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">
          Descríbela lo mejor que puedas
        </label>
        <textarea
          className="input min-h-28"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Cuenta el problema, a quién va dirigido, cómo funciona, tu motivación…"
          required
          minLength={10}
        />
      </div>

      <button className="btn btn-primary w-full" disabled={loading}>
        {loading ? "Creando…" : "Crear idea y empezar"}
        {!loading && <ArrowRight size={16} />}
      </button>
    </form>
  );
}
