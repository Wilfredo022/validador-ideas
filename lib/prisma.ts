import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool, type PoolConfig } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({
  connectionString,
  max: 1,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 15_000,
  // Forzar IPv4: las VPNs suelen romper la ruta IPv6 hacia AWS/Neon
  family: 4,
} as PoolConfig);
// Evita que un error de conexión (p.ej. autosuspend de Neon) tumbe el proceso
pool.on("error", (err) => {
  console.error("Pool de BD (error no crítico):", err.message);
});
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
