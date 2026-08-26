"use client";

import { useCallback, useRef, useState } from "react";

interface RunOptions {
  onEvent: (ev: Record<string, unknown>) => void;
  onDone?: () => void;
  onError?: (err: Error) => void;
}

export function useSSE() {
  const [running, setRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(
    async (url: string, body: unknown, opts: RunOptions) => {
      setRunning(true);
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          throw new Error(`Error ${res.status}`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";
          for (const part of parts) {
            if (!part.startsWith("data: ")) continue;
            try {
              opts.onEvent(JSON.parse(part.slice(6)));
            } catch {
              /* ignorar evento corrupto */
            }
          }
        }
        opts.onDone?.();
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          opts.onError?.(err as Error);
        }
      } finally {
        setRunning(false);
      }
    },
    []
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { run, running, cancel };
}
