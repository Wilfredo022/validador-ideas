"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useSSE } from "@/hooks/use-sse";
import { markInterviewSkipped } from "@/app/actions";
import { Send, Sun } from "lucide-react";

interface Msg {
  role: "USER" | "VISIONARIO";
  content: string;
}

export default function InterviewChat({
  ideaId,
  initial,
  onDone,
}: {
  ideaId: string;
  initial: { role: string; content: string }[];
  onDone: () => void;
}) {
  const [messages, setMessages] = useState<Msg[]>(
    initial.map((m) => ({ role: m.role as Msg["role"], content: m.content }))
  );
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [ready, setReady] = useState(false);
  const { run } = useSSE();
  const endRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  function scrollToEnd() {
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function handleStreamEvent(ev: Record<string, unknown>) {
    if (ev.type === "delta") {
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        copy[copy.length - 1] = {
          role: "VISIONARIO",
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
      toast.error((ev.error as string) || "Error en la entrevista");
    }
  }

  useEffect(() => {
    if (messages.length > 0 || startedRef.current) return;
    startedRef.current = true;
    setStreaming(true);
    setMessages([{ role: "VISIONARIO", content: "" }]);
    scrollToEnd();
    run("/api/interview", { ideaId, messages: [] }, {
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
    setMessages(next);
    setStreaming(true);
    setMessages([...next, { role: "VISIONARIO", content: "" }]);
    scrollToEnd();

    await run(
      "/api/interview",
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

  async function skip() {
    await markInterviewSkipped(ideaId);
    toast.info("Entrevista omitida. El análisis se hará con visión parcial.");
    onDone();
  }

  return (
    <div className="card flex flex-col gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Sun size={16} />
          </span>
          Entrevista con el Visionario
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Responde sus preguntas para extraer toda tu visión. Cuando termines, inicia el análisis profundo.
        </p>
      </div>

      <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "USER" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-[20px] px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "USER"
                  ? "rounded-br-md bg-primary text-white"
                  : "rounded-bl-md bg-muted text-foreground/90"
              }`}
            >
              {m.role === "VISIONARIO" && !m.content && streaming ? (
                <span className="animate-pulse-soft">El Visionario está escribiendo…</span>
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
          placeholder="Responde al Visionario…"
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

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" className="btn btn-ghost text-xs" onClick={skip}>
          Saltar entrevista
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {ready && (
            <span className="badge bg-emerald-50 text-emerald-700">
              El Visionario ya tiene visión suficiente
            </span>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={onDone}
            disabled={streaming || messages.length === 0}
          >
            Iniciar análisis profundo →
          </button>
        </div>
      </div>
      {messages.length > 0 && !ready && (
        <p className="text-center text-xs text-muted-foreground">
          Puedes iniciar el análisis cuando consideres que ya contaste toda tu visión.
        </p>
      )}
    </div>
  );
}
