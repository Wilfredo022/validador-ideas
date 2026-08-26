// Reintenta operaciones de BD ante errores transitorios de conexión.
// En Neon (capa gratuita) el compute puede estar despertando del autosuspend
// y tirar la primera conexión (ECONNRESET / timeout / conexión cerrada).
const TRANSIENT =
  /ECONNRESET|Connection terminated|ETIMEDOUT|timeout|terminated unexpectedly|read error|Server has closed the connection|ConnectionClosed|connection refused|could not connect|socket hang up|read ECONNRESET|P1017/i;

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1500
): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!TRANSIENT.test(msg) || i === retries) throw e;
      await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw new Error("withRetry: no se pudo completar la operación");
}