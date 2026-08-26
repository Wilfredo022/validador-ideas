"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Compass, Sparkles } from "lucide-react";
import { createDiscovery } from "@/app/actions";

export default function DiscoverySeedForm() {
  const router = useRouter();
  const [seed, setSeed] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createDiscovery(seed);
      toast.success("Exploración creada. El Descubridor te guiará.");
      router.push(`/ideas/${res.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card flex h-full flex-col space-y-4">
      <div>
        <span className="badge bg-amber-100 text-amber-800">Desde cero</span>
        <h2 className="mt-3 flex items-center gap-2 text-lg font-bold tracking-tight">
          <Sparkles size={18} className="text-primary" />
          Aún no tengo la idea clara
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cuéntale al Descubridor un problema, una intuición o algo que viste. Él te ayuda a convertirla en una idea concreta.
        </p>
      </div>
      <textarea
        className="input min-h-[9.5rem] flex-1"
        value={seed}
        onChange={(e) => setSeed(e.target.value)}
        placeholder="Ej: Vi que en mi ciudad a nadie le reparan las bicis a domicilio… o déjalo vacío y el Descubridor te preguntará."
      />
      <button className="btn btn-ghost w-full" disabled={loading}>
        <Compass size={16} />
        {loading ? "Creando…" : "Empezar a explorar"}
      </button>
    </form>
  );
}
