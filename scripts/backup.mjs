// Copia de seguridad local de todas tus ideas.
// Exporta a JSON todo lo guardado en Neon (ideas, entrevistas, debates,
// agentes, pivotes). No depende de la app corriendo.
// Uso: node --env-file=.env scripts/backup.mjs
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL.replace(/&channel_binding=require/, ""),
  connectionTimeoutMillis: 20_000,
  max: 1,
  family: 4,
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const ideas = await prisma.idea.findMany({
  orderBy: { createdAt: "asc" },
  include: {
    refinements: { orderBy: { createdAt: "asc" } },
    debates: {
      orderBy: { round: "asc" },
      include: { agents: true, pivots: true },
    },
  },
});

const payload = {
  exportedAt: new Date().toISOString(),
  ideas,
};

const dir = join(process.cwd(), "backups");
mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const file = join(dir, `backup-${stamp}.json`);
writeFileSync(file, JSON.stringify(payload, null, 2), "utf8");

console.log(`✅ Backup creado: ${file}`);
console.log(`   Ideas: ${ideas.length} | Debates: ${ideas.reduce((n, i) => n + i.debates.length, 0)}`);
await prisma.$disconnect();