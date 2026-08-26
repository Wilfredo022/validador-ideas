// Mantiene el compute de Neon despierto ejecutando un query mínimo.
// En la capa gratuita de Neon el autosuspend (~5 min) es obligatorio;
// este ping periódico resetea el temporizador de inactividad.
// Uso: node --env-file=.env scripts/keepalive.mjs
import { Pool } from "pg";

const url = (process.env.DATABASE_URL || "").replace(/&channel_binding=require/, "");

async function ping() {
  const pool = new Pool({
    connectionString: url,
    connectionTimeoutMillis: 20_000,
    max: 1,
    family: 4,
  });
  try {
    await pool.query("select 1 as ok");
    console.log(`[${new Date().toISOString()}] keepalive OK`);
    process.exit(0);
  } catch (e) {
    console.error(`[${new Date().toISOString()}] keepalive ERROR: ${e instanceof Error ? e.message : e}`);
    process.exit(1);
  } finally {
    await pool.end().catch(() => {});
  }
}

ping();