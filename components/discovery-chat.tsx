"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useSSE } from "@/hooks/use-sse";
import { Send, Sparkles, Check, Compass } from "lucide-react";

interface Msg {
  role: "USER" | "DISCOVERER";
  content: string;
}

export default function DiscoveryChat({
  ideaId,
  initial,
}: {
  ideaId: string;
  initial: { role: string; content: string }[];
}) {
  const [messages, setMessages] = useState<Msg[]>(
    initial.map((m) => ({
      role: m.role === "USER" ? "USER" : "DISCOVERER",
      content: m.content,
    }))
  );
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [ready, setReady] = useState(false);
  const { run } = useSSE();
  const endRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  const [panelOpen, setPanelOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  function scrollToEnd() {
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function handleStreamEvent(ev: Record<string, unknown>) {
    if (ev.type === "delta") {
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        copy[copy.length - 1] = {
          role: "DISCOVERER",
          content: last.content + (ev.text ?? ""),
        };
        return copy;
      });
      scrollToEnd();
    } else if (ev.type === "complete") {
      setStreaming(false);
      if (ev.ready) setReady(true);
    } else if (ev.type === "error") {
      setStreaming(false);
      toast.error((ev.error as string) || "Error");
    }
  }

  useEffect(() => {
    const hasDiscoverer = messages.some((m) => m.role === "DISCOVERER");
    if (hasDiscoverer || startedRef.current) return;
    startedRef.current = true;
    setStreaming(true);
    setMessages((prev) => [...prev, { role: "DISCOVERER", content: "" }]);
    scrollToEnd();
    run("/api/discovery", { ideaId, messages: [] }, {
      onEvent: handleStreamEvent,
      onError: (err) => {
        setStreaming(false);
        toast.error(err.message);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function send() {
    const content = input.trim();
    if (!content || streaming) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "USER", content }];
    setMessages([...next, { role: "DISCOVERER", content: "" }]);
    setStreaming(true);
    scrollToEnd();
    await run(
      "/api/discovery",
      {
        ideaId,
        messages: next.map((m) => ({
          role: m.role === "USER" ? "user" : "assistant",
          content: m.content,
        })),
      },
      {
        onEvent: handleStreamEvent,
        onError: (err) => {
          setStreaming(false);
          toast.error(err.message);
        },
      }
    );
  }

  async function suggest() {
    setSuggesting(true);
    try {
      const res = await fetch("/api/suggest-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setTitle(data.titulo);
      setDescription(data.descripcion);
      toast.success("Sugerencia generada. Puedes editarla.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo generar");
    } finally {
      setSuggesting(false);
    }
  }

  async function confirmFinalize() {
    const t = title.trim();
    const d = description.trim();
    if (!t || !d) {
      toast.error("Escribe o genera un título y una descripción");
      return;
    }
    setFinalizing(true);
    try {
      const res = await fetch("/api/finalize-discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId, title: t, description: d }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      toast.success("Idea lista. Ahora el Visionario te entrevistará.");
      window.location.href = `/ideas/${data.id}`;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
      setFinalizing(false);
    }
  }

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Compass size={16} />
            </span>
            Descubre tu idea
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cuéntale un problema o una intuición. El Descubridor te guía hasta convertirla en una idea concreta.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setPanelOpen((p) => !p)}
          disabled={streaming || messages.length === 0}
        >
          Pasar al Visionario →
        </button>
      </div>

      {panelOpen && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-primary">Definir la idea antes de validarla</h3>
            <button
              type="button"
              className="btn btn-ghost px-3 py-1.5 text-xs"
              onClick={suggest}
              disabled={suggesting}
            >
              <Sparkles size={14} className={suggesting ? "animate-pulse" : ""} />
              {suggesting ? "Generando…" : "Sugerir título y descripción"}
            </button>
          </div>
          <div className="space-y-2">
            <input
              className="input"
              placeholder="Título de la idea"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="input min-h-24"
              placeholder="Descripción: problema, solución y modelo de negocio…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Al confirmar, el Visionario te hará su entrevista.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={confirmFinalize}
              disabled={finalizing || !title.trim() || !description.trim()}
            >
              <Check size={14} />
              {finalizing ? "Confirmando…" : "Confirmar y validar"}
            </button>
          </div>
        </div>
      )}

      <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "USER" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[82%] whitespace-pre-wrap rounded-[20px] px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "USER"
                  ? "rounded-br-md bg-primary text-white"
                  : "rounded-bl-md bg-muted text-foreground/90"
              }`}
            >
              {m.role === "DISCOVERER" && !m.content && streaming ? (
                <span className="animate-pulse-soft">El Descubridor está pensando…</span>
              ) : (
                m.content.replace(/\[LISTO\]/g, "")
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="flex items-center gap-2">
        <input
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Cuéntale qué viste o qué problema quieres resolver…"
          disabled={streaming}
        />
        <button
          type="button"
          className="btn btn-primary h-[46px] w-[46px] shrink-0 px-0"
          onClick={send}
          disabled={!input || streaming}
        >
          <Send size={16} />
        </button>
      </div>

      {ready && (
        <p className="text-center text-xs font-medium text-emerald-600">
          El Descubridor cree que ya hay una idea sustancial — pásala al Visionario.
        </p>
      )}
    </div>
  );
}
