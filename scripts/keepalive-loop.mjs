// Mantiene el compute de Neon despierto mientras desarrollas.
// Corre un ping cada 4 min (el autosuspend del plan gratis es ~5 min).
// Uso: node --env-file=.env scripts/keepalive-loop.mjs   (Ctrl+C para detener)
import { Pool } from "pg";

const url = (process.env.DATABASE_URL || "").replace(/&channel_binding=require/, "");
const INTERVAL_MS = 4 * 60 * 1000;

async function ping() {
  const pool = new Pool({
    connectionString: url,
    connectionTimeoutMillis: 20_000,
    max: 1,
    family: 4,
  });
  try {
    await pool.query("select 1 as ok");
    console.log(`[${new Date().toLocaleTimeString()}] keepalive OK`);
  } catch (e) {
    console.error(`[${new Date().toLocaleTimeString()}] keepalive ERROR: ${e instanceof Error ? e.message : e}`);
  } finally {
    await pool.end().catch(() => {});
  }
}

console.log("Keep-alive activo (ping cada 4 min). Ctrl+C para detener.");
await ping();
const timer = setInterval(ping, INTERVAL_MS);
process.on("SIGINT", () => {
  clearInterval(timer);
  console.log("\nKeep-alive detenido.");
  process.exit(0);
});