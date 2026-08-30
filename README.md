# Validador de Ideas Multi-Agente

Una app web para **validar ideas de negocio antes de invertir** mediante un debate adversarial de agentes de IA. En lugar de depender de una sola opinión (o de tu propio sesgo optimista), un jurado de seis agentes con roles distintos analiza tu idea, investiga el mercado, la puntúa y propone pivotes.

Construido con **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma** y **PostgreSQL (Neon)**.

## ¿Qué hace?

La app te guía por un flujo completo de validación:

1. **Descubrimiento** (opcional) — Si todavía no tienes una idea clara, un agente "Descubridor" te entrevista desde una observación o problema hasta convertirla en una idea con sustancia.
2. **Entrevista** — El Visionario actúa como entrevistador para extraer tu visión completa: problema, público, competencia, contexto de país/ciudad, modelo de negocio y limitaciones.
3. **Investigación de mercado** — Un agente **Investigador** busca fuentes web reales (Serper o Tavily) y arma un informe con tamaño de mercado, competidores reales, contexto de país y oportunidades.
4. **Debate** — Tres agentes argumentan y el **Juez** emite el veredicto final:
   - **El Visionario** — defiende el potencial, la propuesta de valor y la narrativa.
   - **El Inquisidor** — el abogado del diablo: por qué la idea fallaría.
   - **El Capitalista** — evalúa la viabilidad económica pura (CAC, LTV, márgenes, punto de equilibrio).
   - **El Juez** — pondera riesgos vs. oportunidades y puntúa del 0 al 100 en 4 ejes (problema, construcción, rentabilidad, competitividad).
5. **Pivotes** — Si el veredicto no es favorable, **El Estratega** propone 2-3 pivotes alineados con las palancas del Juez para reestructurar la idea sin perder su esencia.
6. **Plan de ejecución** — **El Arquitecto** traduce la idea validada en un plan táctico: stack y MVP (proyectos digitales) o insumos y validación física (negocios del mundo real).

Cada idea puede debatirse en **rondas sucesivas** tras elegir un pivote, y todo queda persistido en la base de datos.

## Veredictos y puntuación

- **0–40** → `DESCARTAR`
- **41–69** → `REQUIERE_PIVOTE`
- **70–100** → `APROBADO`

El puntaje se desglosa en 4 ejes de 0–25 puntos cada uno.

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend / API | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| Base de datos | PostgreSQL (Neon recomendado) vía Prisma 7 + adaptador `pg` |
| LLMs | Anthropic Claude, DeepSeek y Zhipu GLM (con cadena de respaldo automática) |
| Búsqueda web | Serper o Tavily |
| Validación | Zod |

## Requisitos previos

- **Node.js 20+**
- **pnpm** (recomendado) — o npm/yarn
- Una base de datos **PostgreSQL** (el proyecto está pensado para Neon, pero cualquier Postgres sirve)

## Instalación

```bash
# 1. Clona el repositorio y entra
git clone <url-del-repo>
cd idea-validator

# 2. Instala dependencias (genera el cliente Prisma automáticamente)
pnpm install

# 3. Configura las variables de entorno
cp .env.example .env
# ...y edita .env con tus claves (ver sección siguiente)

# 4. Crea las tablas en la base de datos
pnpm db:migrate        # aplica las migraciones existentes

# 5. Arranca en desarrollo
pnpm dev
```

Abre **http://localhost:3000**.

> En Neon, asegúrate de que `DATABASE_URL` use el host con `-pooler` (para la app) y que `DIRECT_URL` use el host sin `-pooler` (para que Prisma pueda migrar).

## Configuración (.env)

Copia `.env.example` a `.env` y completa:

| Variable | Requerida | Descripción |
| --- | --- | --- |
| `DATABASE_URL` | Sí | Conexión con pooler de Neon (`-pooler`) |
| `DIRECT_URL` | Sí | Conexión directa sin `-pooler` (la usa Prisma para migraciones) |
| `ANTHROPIC_API_KEY` | No* | Clave de Claude (Anthropic) |
| `DEEPSEEK_API_KEY` | No* | Clave de DeepSeek |
| `ZHIPU_API_KEY` | No* | Clave de Zhipu GLM |
| `ALLOWED_PROVIDERS` | No | Restringe proveedores, p.ej. `deepseek`. Sin ella se usan todos los que tengan clave |
| `SERPER_API_KEY` | No** | Búsqueda web (serper.dev, plan gratis) |
| `TAVILY_API_KEY` | No** | Búsqueda web alternativa (tavily.com) |
| `<AGENTE>_MODEL` / `<AGENTE>_PROVIDER` / `<AGENTE>_MODE` | No | Sobreescribe el modelo de un agente, p.ej. `JUEZ_MODEL=claude-opus-4-8` |

\* Necesitas al menos **una** clave de LLM para que la app funcione.
\*\* Necesitas al menos **una** clave de búsqueda para que la investigación de mercado funcione (si no, la app marca el dato de mercado como incertidumbre).

## Configurar modelos por agente

Cada agente (`INVESTIGADOR`, `VISIONARIO_INTERVIEW`, `VISIONARIO`, `INQUISIDOR`, `CAPITALISTA`, `JUEZ`, `ESTRATEGA`, `ARQUITECTO`) tiene un modelo por defecto. Puedes:

- Cambiarlo en la página **Configuración** de la app (se guarda en la base de datos), o
- Sobreescribirlo con variables de entorno como `JUEZ_MODEL=...` y `JUEZ_PROVIDER=...`.

Los modelos por defecto usan DeepSeek como primario. Si un proveedor falla, la app intenta automáticamente los respaldos en orden (p.ej. `deepseek → glm → claude`).

## Scripts útiles

| Comando | Descripción |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` / `pnpm start` | Build y arranque de producción |
| `pnpm lint` | ESLint |
| `pnpm db:migrate` | Aplica migraciones de Prisma |
| `pnpm db:push` | Sincroniza el esquema sin migraciones |
| `pnpm db:studio` | Abre Prisma Studio |
| `pnpm db:generate` | Regenera el cliente Prisma |
| `pnpm backup` | Exporta todas tus ideas a `backups/backup-<fecha>.json` |
| `pnpm warm` | Mantiene despierto el compute de Neon (ping cada 4 min) hasta Ctrl+C |
| `pnpm warm:once` | Un solo ping (útil para despertar Neon al instante) |

> **Sobre Neon (plan gratuito):** el compute se suspende solo (~5 min de inactividad). La app ya reintenta conexiones transitorias (`lib/db-retry.ts`) para tolerar el "despertar". Si desarrollas y quieres cero interrupciones, corre `pnpm warm` en otra terminal — pero no lo dejes 24/7, ya que gasta horas de cómputo.

## Estructura del proyecto

```
app/                  # Páginas y rutas API (App Router)
  api/                # Endpoints: analyze, research, debate, interview, pivots, config...
components/           # Componentes React (formularios, tarjetas, panel de configuración...)
lib/
  ai/                 # Lógica de agentes y proveedores LLM
    agents.ts         # Prompts y esquemas Zod de cada agente
    orchestrator.ts   # Ejecución de agentes con streaming y fallback entre proveedores
    provider.ts       # Proveedores (Claude, DeepSeek, GLM) y cadena de respaldo
    model-config.ts   # Configuración de modelos por agente (DB + env)
  search.ts           # Búsqueda web (Serper / Tavily)
  prisma.ts           # Cliente Prisma con pool adaptado a Neon
  db-retry.ts         # Reintentos ante errores transitorios de conexión
prisma/
  schema.prisma       # Modelo de datos (Idea, Debate, AgentResult, PivotOption...)
  migrations/         # Migraciones de base de datos
scripts/              # backup.mjs, keepalive.mjs, keepalive-loop.mjs
```
