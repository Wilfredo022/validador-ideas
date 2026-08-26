import { z } from "zod";
import type { AgentKey } from "./agent-meta";

export const investigadorSchema = z.object({
  sintesis: z.string().describe("Síntesis general de los hallazgos de la investigación"),
  mercado: z.object({
    tamanioEstimado: z.string().describe("Estimación del tamaño del mercado o segmento relevante"),
    tendencias: z.array(z.string()).describe("Tendencias actuales del sector"),
    contextoPais: z.string().describe("Contexto específico del país/región: adopción, regulación, cultura de consumo, barreras locales"),
  }),
  competencia: z
    .array(
      z.object({
        nombre: z.string(),
        tipo: z.enum(["DIRECTA", "INDIRECTA", "SUSTITUTO"]),
        precio: z.string().describe("Rango de precio/plan si es público"),
        propuesta: z.string().describe("Qué ofrece el competidor"),
        fortalezas: z.string(),
        debilidades: z.string(),
      })
    )
    .describe("Competidores reales encontrados en la búsqueda"),
  alternativasGratuitas: z
    .array(z.string())
    .describe("Alternativas gratuitas o sustitutos de bajo costo que enfrentaría"),
  oportunidad: z.string().describe("Hueco de mercado detectado y cómo diferenciarse"),
  amenazas: z.array(z.string()).describe("Amenazas del mercado (saturación, regulatorias, costos, etc.)"),
  fuentes: z.array(z.string()).describe("URLs de las fuentes consultadas"),
});

export const visionarioSchema = z.object({
  propuestaUnicaDeValor: z.string().describe("Declaración clara y única de valor"),
  publicoObjetivoIdeal: z.string().describe("Perfil del cliente objetivo ideal"),
  mejorEscenarioAdopcion: z.string().describe("Mejor escenario de adopción proyectado"),
  diferenciacionClave: z.string().describe("La diferenciación clave frente a la competencia"),
  narrativa: z.string().describe("La mejor narrativa/gancho para vender la idea"),
});

export const inquisidorSchema = z.object({
  riesgosDeEjecucion: z
    .array(z.string())
    .min(1)
    .max(3)
    .describe("Los 3 mayores riesgos de ejecución"),
  friccionesDeAdopcion: z
    .array(z.string())
    .min(1)
    .describe("Fricciones críticas: por qué el cliente no compraría"),
  barrerasDeEntrada: z.array(z.string()).min(1).describe("Barreras de entrada"),
  porqueElClienteNoCompraria: z.string().describe("El argumento central de por qué fracasaría"),
});

export const capitalistaSchema = z.object({
  modeloDeMonetizacion: z.string().describe("Modelo de cobro/monetización recomendado"),
  tiempoAlPrimerIngreso: z.string().describe("Estimación del tiempo al primer ingreso"),
  margenBrutoEstimado: z.string().describe("Margen bruto estimado"),
  cacEstimado: z.string().describe("Costo de adquisición de cliente estimado"),
  ltvEstimado: z.string().describe("Valor de vida del cliente estimado"),
  inversionInicial: z.string().describe("Inversión inicial estimada (maquinaria/inventario/infraestructura)"),
  puntoDeEquilibrio: z.string().describe("Punto de equilibrio"),
  viabilidadDeMargenes: z.string().describe("Veredicto de viabilidad de márgenes"),
});

export const juezSchema = z.object({
  puntaje: z.number().min(0).max(100).describe("Puntaje total del 0 al 100"),
  ejes: z.object({
    problema: z.number().min(0).max(25).describe("Sub-puntaje 0-25: claridad del problema que resuelve"),
    construccion: z.number().min(0).max(25).describe("Sub-puntaje 0-25: viabilidad de construcción"),
    rentabilidad: z.number().min(0).max(25).describe("Sub-puntaje 0-25: rentabilidad financiera"),
    competitividad: z.number().min(0).max(25).describe("Sub-puntaje 0-25: ventaja competitiva"),
  }),
  veredicto: z.enum(["DESCARTAR", "REQUIERE_PIVOTE", "APROBADO"]),
  resumenEjecutivo: z.string().describe("Resumen ejecutivo del porqué de la nota"),
  pros: z.array(z.string()).describe("Lista definitiva de pros"),
  contras: z.array(z.string()).describe("Lista definitiva de contras"),
  palancas: z
    .array(
      z.object({
        accion: z.string(),
        impactoPuntos: z.number().describe("Cuántos puntos subiría el score si se ejecuta esta acción"),
        explicacion: z.string(),
      })
    )
    .describe("Palancas: acciones concretas que más subirían el puntaje"),
});

export const estrategaSchema = z.object({
  opcionesDePivote: z
    .array(
      z.object({
        titulo: z.string(),
        descripcion: z.string(),
        porQueEliminaRiesgos: z.string().describe("Cómo esta opción evita los riesgos detectados"),
      })
    )
    .min(2)
    .max(3)
    .describe("Exactamente 2 o 3 opciones de pivote"),
});

export const posicionamientoSchema = z.object({
  diferenciacion: z.string().describe("La diferenciación clave que se debe comunicar"),
  mensajeDeMarca: z.string().describe("Mensaje de posicionamiento frente a la competencia"),
  competenciaPrincipal: z.string().describe("A quién se enfrenta de forma principal"),
  estrategiaDeEntrada: z.string().describe("Cómo entrar al mercado según el país/contexto investigado"),
  canalesIniciales: z.array(z.string()).describe("Primeros canales de adquisición"),
  riesgoCompetitivo: z.string().describe("Principal riesgo competitivo y cómo mitigarlo"),
});

export const arquitectoSchema = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("SOFTWARE"),
    stackRecomendado: z.string(),
    arquitecturaBase: z.string(),
    funcionesEsencialesMvp: z
      .array(z.string())
      .min(1)
      .max(3)
      .describe("Las 3 funciones estrictamente esenciales del MVP"),
    posicionamiento: posicionamientoSchema,
  }),
  z.object({
    tipo: z.literal("PHYSICAL"),
    insumosMinimos: z.array(z.string()).describe("Lista de insumos mínimos"),
    validacionFisicaPreliminar: z.string().describe("Diseño de validación física preliminar"),
    requerimientosOperativos: z.array(z.string()).describe("Requerimientos operativos para arrancar"),
    posicionamiento: posicionamientoSchema,
  }),
]);

export const schemas: Record<AgentKey, z.ZodType> = {
  VISIONARIO_INTERVIEW: z.any(),
  INVESTIGADOR: investigadorSchema,
  VISIONARIO: visionarioSchema,
  INQUISIDOR: inquisidorSchema,
  CAPITALISTA: capitalistaSchema,
  JUEZ: juezSchema,
  ESTRATEGA: estrategaSchema,
  ARQUITECTO: arquitectoSchema,
};

export type Domain = "SOFTWARE" | "PHYSICAL";

export interface AgentContext {
  domain: Domain;
  ideaTitle: string;
  ideaDescription: string;
  vision: string;
  debateContext?: string;
  research?: string;
  visionaryOutput?: unknown;
  inquisidorOutput?: unknown;
  capitalistaOutput?: unknown;
  previousScore?: number | null;
  judgeOutput?: unknown;
}

function xmlSafe(value: unknown): string {
  if (value == null) return "";
  const s = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function domainLabel(domain: Domain): string {
  return domain === "SOFTWARE"
    ? "proyecto digital (software, SaaS, app)"
    : "proyecto del mundo real (servicio local, negocio físico, manufactura)";
}

function baseContext(ctx: AgentContext): string {
  return `
  <contexto>
    <dominio>${domainLabel(ctx.domain)}</dominio>
    <ideaOriginal>
      <titulo>${xmlSafe(ctx.ideaTitle)}</titulo>
      <descripcion>${xmlSafe(ctx.ideaDescription)}</descripcion>
    </ideaOriginal>
    ${ctx.debateContext ? `<pivoteContexto>${xmlSafe(ctx.debateContext)}</pivoteContexto>` : ""}
    <visionCompleta>${xmlSafe(ctx.vision || "El usuario no completó la entrevista; la visión es solo la descripción inicial.")}</visionCompleta>
    ${ctx.research ? `<investigacionMercado>${xmlSafe(ctx.research)}</investigacionMercado>` : ""}
    ${ctx.previousScore != null ? `<puntajeAnterior>${ctx.previousScore}</puntajeAnterior>` : ""}
  </contexto>`;
}

function researchRule(ctx: AgentContext): string {
  return ctx.research
    ? `<regla>Usa la investigación de mercado disponible: cita competidores reales, precios y contexto de país/región en vez de suponerlos.</regla>`
    : `<regla>No inventes competidores concretos: señala las categorías de competencia y alternativas que el usuario mencionó, y marca la falta de datos de mercado como una incertidumbre.</regla>`;
}

function visionaryBlock(ctx: AgentContext): string {
  return ctx.visionaryOutput
    ? `<argumentoVisionario>${xmlSafe(ctx.visionaryOutput)}</argumentoVisionario>`
    : "<argumentoVisionario>No disponible</argumentoVisionario>";
}

function buildPrompt(agent: AgentKey, ctx: AgentContext): string {
  switch (agent) {
    case "VISIONARIO":
      return `
<system>
  <agente id="VISIONARIO" rol="optimista-propuesta-de-valor" dominio="${ctx.domain}"/>
  <mision>Encontrar el máximo potencial, la diferenciación clave y la mejor narrativa para la idea.</mision>
  ${baseContext(ctx)}
  <instrucciones>
    <regla>${ctx.domain === "SOFTWARE"
      ? "Identifica efectos de red, escalabilidad a costo marginal cero y resolución de dolores críticos de usuarios digitales."
      : "Identifica vacíos de mercado local, ventajas geográficas, experiencia del cliente y fidelización de marca física."}</regla>
    <regla>Sé optimista pero fundamentado en la visión extraída del usuario.</regla>
    ${researchRule(ctx)}
    <regla>Responde SOLO con un objeto JSON válido, sin texto fuera del JSON.</regla>
  </instrucciones>
  <formatoSalida tipo="json">
    <campo nombre="propuestaUnicaDeValor" tipo="string"/>
    <campo nombre="publicoObjetivoIdeal" tipo="string"/>
    <campo nombre="mejorEscenarioAdopcion" tipo="string"/>
    <campo nombre="diferenciacionClave" tipo="string"/>
    <campo nombre="narrativa" tipo="string"/>
  </formatoSalida>
</system>`;

    case "INQUISIDOR":
      return `
<system>
  <agente id="INQUISIDOR" rol="abogado-del-diablo" dominio="${ctx.domain}"/>
  <mision>Identificar todas las razones por las cuales la idea puede fracasar, atacando directamente el análisis del Visionario.</mision>
  ${baseContext(ctx)}
  ${visionaryBlock(ctx)}
  <instrucciones>
    <regla>${ctx.domain === "SOFTWARE"
      ? "Señala saturación de mercado, alternativas gratuitas, costos de infraestructura técnica, deuda técnica y fricción de adopción del usuario."
      : "Analiza barreras logísticas, cadena de suministro, regulaciones legales, impuestos y dependencia de mano de obra."}</regla>
    <regla>Sé clínico y con evidencia, no despectivo. Cita los argumentos del Visionario que atacas.</regla>
    ${researchRule(ctx)}
    <regla>Responde SOLO con un objeto JSON válido, sin texto fuera del JSON.</regla>
  </instrucciones>
  <formatoSalida tipo="json">
    <campo nombre="riesgosDeEjecucion" tipo="array[string]" limite="3"/>
    <campo nombre="friccionesDeAdopcion" tipo="array[string]"/>
    <campo nombre="barrerasDeEntrada" tipo="array[string]"/>
    <campo nombre="porqueElClienteNoCompraria" tipo="string"/>
  </formatoSalida>
</system>`;

    case "CAPITALISTA":
      return `
<system>
  <agente id="CAPITALISTA" rol="finanzas-monetizacion" dominio="${ctx.domain}"/>
  <mision>Evaluar la viabilidad económica pura, flujos de caja y retorno de inversión, ignorando el sentimentalismo.</mision>
  ${baseContext(ctx)}
  ${visionaryBlock(ctx)}
  <instrucciones>
    <regla>${ctx.domain === "SOFTWARE"
      ? "Diseña el modelo de cobro, estima CAC, LTV y margen bruto, considerando infraestructura."
      : "Analiza inversión inicial en maquinaria/inventario, costos operativos recurrentes, márgenes por unidad y punto de equilibrio."}</regla>
    <regla>Sé numérico y realista. Si los datos son escasos, da rangos razonables y señala la incertidumbre.</regla>
    ${researchRule(ctx)}
    <regla>Responde SOLO con un objeto JSON válido, sin texto fuera del JSON.</regla>
  </instrucciones>
  <formatoSalida tipo="json">
    <campo nombre="modeloDeMonetizacion" tipo="string"/>
    <campo nombre="tiempoAlPrimerIngreso" tipo="string"/>
    <campo nombre="margenBrutoEstimado" tipo="string"/>
    <campo nombre="cacEstimado" tipo="string"/>
    <campo nombre="ltvEstimado" tipo="string"/>
    <campo nombre="inversionInicial" tipo="string"/>
    <campo nombre="puntoDeEquilibrio" tipo="string"/>
    <campo nombre="viabilidadDeMargenes" tipo="string"/>
  </formatoSalida>
</system>`;

    case "JUEZ":
      return `
<system>
  <agente id="JUEZ" rol="consenso-calificacion" dominio="${ctx.domain}"/>
  <mision>Analizar imparcialmente los argumentos de los tres agentes anteriores, ponderar riesgos contra oportunidades y emitir un veredicto.</mision>
  ${baseContext(ctx)}
  ${visionaryBlock(ctx)}
  ${ctx.inquisidorOutput ? `<argumentoInquisidor>${xmlSafe(ctx.inquisidorOutput)}</argumentoInquisidor>` : ""}
  ${ctx.capitalistaOutput ? `<argumentoCapitalista>${xmlSafe(ctx.capitalistaOutput)}</argumentoCapitalista>` : ""}
  <instrucciones>
    <regla>Puntúa 4 ejes (cada uno de 0 a 25): problema, construccion, rentabilidad, competitividad.</regla>
    <regla>El puntaje total es la suma de los 4 ejes (0-100). Verifica la coherencia entre ejes y total.</regla>
    <regla>Deriva el veredicto del total: 0-40 DESCARTAR, 41-69 REQUIERE_PIVOTE, 70-100 APROBADO.</regla>
    <regla>Incluye palancas: las 2-3 acciones concretas que más subirían el puntaje.</regla>
    ${researchRule(ctx)}
    <regla>Puntúa el eje competitividad comparando con los competidores y alternativas reales de la investigación (o marca la falta de datos como riesgo).</regla>
    <regla>Respeta las decisiones del usuario en la visión: no recomiendes como palanca un modelo de negocio, canal o enfoque que el usuario descartó explícitamente durante la exploración.</regla>
    <regla>Responde SOLO con un objeto JSON válido, sin texto fuera del JSON.</regla>
  </instrucciones>
  <formatoSalida tipo="json">
    <campo nombre="puntaje" tipo="number" rango="0-100"/>
    <campo nombre="ejes" tipo="object">{problema,construccion,rentabilidad,competitividad} 0-25 cada uno</campo>
    <campo nombre="veredicto" tipo="enum">DESCARTAR|REQUIERE_PIVOTE|APROBADO</campo>
    <campo nombre="resumenEjecutivo" tipo="string"/>
    <campo nombre="pros" tipo="array[string]"/>
    <campo nombre="contras" tipo="array[string]"/>
    <campo nombre="palancas" tipo="array[{accion,impactoPuntos,explicacion}]"/>
  </formatoSalida>
</system>`;

    case "ESTRATEGA":
      return `
<system>
  <agente id="ESTRATEGA" rol="motor-de-pivotes" dominio="${ctx.domain}"/>
  <mision>Tomar las objeciones del Inquisidor, las dudas del Capitalista y especialmente las PALANCAS del Juez, para reestructurar la idea sin perder su esencia.</mision>
  ${baseContext(ctx)}
  ${visionaryBlock(ctx)}
  ${ctx.inquisidorOutput ? `<argumentoInquisidor>${xmlSafe(ctx.inquisidorOutput)}</argumentoInquisidor>` : ""}
  ${ctx.capitalistaOutput ? `<argumentoCapitalista>${xmlSafe(ctx.capitalistaOutput)}</argumentoCapitalista>` : ""}
  ${ctx.judgeOutput ? `<veredictoYPalancasJuez>${xmlSafe(ctx.judgeOutput)}</veredictoYPalancasJuez>` : ""}
  <instrucciones>
    <regla>Genera EXACTAMENTE 2 o 3 opciones de pivote explicadas.</regla>
    <regla>Considera al menos: cambiar el nicho de mercado, cambiar el modelo de negocio o cambiar el canal de distribución.</regla>
    <regla>Si el Juez entregó palancas (acciones concretas para subir el puntaje), ALINEA tus pivotes con ellas: no los contradigas, incorpóralas, profúndizalas o combínalas.</regla>
    <regla>Respeta estrictamente la visión y las decisiones del usuario: si durante la exploración descartó un modelo de negocio, un canal o un enfoque (p.ej. publicidad, cooperativa de carros, punto físico de despacho), NO lo reintroduzcas como pivote.</regla>
    <regla>Cada opción debe explicar cómo evita los riesgos detectados.</regla>
    ${researchRule(ctx)}
    <regla>Responde SOLO con un objeto JSON válido, sin texto fuera del JSON.</regla>
  </instrucciones>
  <formatoSalida tipo="json">
    <campo nombre="opcionesDePivote" tipo="array[{titulo,descripcion,porQueEliminaRiesgos}]" limite="2-3"/>
  </formatoSalida>
</system>`;

    case "ARQUITECTO":
      return `
<system>
  <agente id="ARQUITECTO" rol="planificacion-ejecucion" dominio="${ctx.domain}"/>
  <mision>Traducir la idea validada en un plan táctico de lanzamiento.</mision>
  ${baseContext(ctx)}
  ${ctx.judgeOutput ? `<veredictoJuez>${xmlSafe(ctx.judgeOutput)}</veredictoJuez>` : ""}
  <instrucciones>
    ${ctx.domain === "SOFTWARE"
      ? `<regla>Recomienda stack tecnológico, arquitectura base y las 3 funciones estrictamente esenciales del MVP.</regla>`
      : `<regla>Lista insumos mínimos, diseño de validación física preliminar y requerimientos operativos para arrancar.</regla>`}
    <regla>${ctx.domain === "SOFTWARE" ? 'Usa el objeto con "tipo":"SOFTWARE".' : 'Usa el objeto con "tipo":"PHYSICAL".'}</regla>
    <regla>Incluye el bloque de posicionamiento: diferenciación, mensaje de marca, competencia principal, estrategia de entrada y canales iniciales.</regla>
    ${researchRule(ctx)}
    <regla>Responde SOLO con un objeto JSON válido, sin texto fuera del JSON.</regla>
  </instrucciones>
  <formatoSalida tipo="json">
    ${ctx.domain === "SOFTWARE"
      ? `<campo nombre="tipo" valor="SOFTWARE"/><campo nombre="stackRecomendado" tipo="string"/><campo nombre="arquitecturaBase" tipo="string"/><campo nombre="funcionesEsencialesMvp" tipo="array[string]" limite="3"/>`
      : `<campo nombre="tipo" valor="PHYSICAL"/><campo nombre="insumosMinimos" tipo="array[string]"/><campo nombre="validacionFisicaPreliminar" tipo="string"/><campo nombre="requerimientosOperativos" tipo="array[string]"/>`}
  </formatoSalida>
</system>`;

    case "INVESTIGADOR":
      return `
<system>
  <agente id="INVESTIGADOR" rol="investigador-de-mercado" dominio="${ctx.domain}"/>
  <mision>Convertir las fuentes web recopiladas en un informe estructurado de mercado: tamaño, competidores reales, contexto de país y oportunidad.</mision>
  ${baseContext(ctx)}
  <instrucciones>
    <regla>Basate ESTRICTAMENTE en las fuentes del bloque investigacionMercado. No inventes competidores, precios ni datos que no aparezcan.</regla>
    <regla>Cuando una fuente hable de un contexto genérico y otra del país/región de la idea, prioriza la más específica.</regla>
    <regla>Incluye siempre las URLs reales de las fuentes usadas en el campo fuentes.</regla>
    <regla>Si la investigación no arrojó datos para algún campo, indícalo explícitamente en lugar de suponer.</regla>
    <regla>Responde SOLO con un objeto JSON válido, sin texto fuera del JSON.</regla>
  </instrucciones>
  <formatoSalida tipo="json">
    <campo nombre="sintesis" tipo="string"/>
    <campo nombre="mercado" tipo="object">{tamanioEstimado,tendencias[],contextoPais}</campo>
    <campo nombre="competencia" tipo="array[{nombre,tipo(DIRECTA|INDIRECTA|SUSTITUTO),precio,propuesta,fortalezas,debilidades}]"/>
    <campo nombre="alternativasGratuitas" tipo="array[string]"/>
    <campo nombre="oportunidad" tipo="string"/>
    <campo nombre="amenazas" tipo="array[string]"/>
    <campo nombre="fuentes" tipo="array[string]"/>
  </formatoSalida>
</system>`;

    default:
      return "";
  }
}

export function buildAgentPrompt(agent: AgentKey, ctx: AgentContext): string {
  return buildPrompt(agent, ctx);
}

export function buildDiscoverySystem(): string {
  return `
<system>
  <agente id="DESCUBRIDOR" rol="explorador-de-ideas" />
  <mision>Ayudar al usuario a descubrir y desarrollar una idea de negocio desde cero, partiendo de una observación, un problema o algo que vio sin que exista una solución clara.</mision>
  <instrucciones>
    <regla>Haz UNA pregunta o propuesta a la vez. No abrumes con varias.</regla>
    <regla>Explora a fondo el problema: quién lo sufre, cuán frecuente y doloroso es, por qué nadie lo ha resuelto, qué se ha intentado antes.</regla>
    <regla>Explora también el contexto: en qué país o ciudad operaría, quiénes son los competidores o alternativas que ya existen hoy, y por qué el problema sigue sin resolverse.</regla>
    <regla>Ayuda a convertir el problema en una idea concreta: propón direcciones posibles, modelos de negocio y ángulos de solución.</regla>
    <regla>Identifica si el problema apunta a un proyecto digital (software/app) o del mundo real (servicio local, negocio físico).</regla>
    <regla>No fuerces una idea: guía al usuario, recolecta su visión y ayúdalo a refinarla hasta que sea sustancial.</regla>
    <regla>Cuando la idea ya tenga sustancia (problema claro, público, solución concreta y un modelo de negocio plausible), termina tu mensaje escribiendo exactamente [LISTO] al final, para sugerir pasarla al Visionario.</regla>
    <regla>Responde siempre en español, conversacional y con mentalidad de mentor de ideas.</regla>
  </instrucciones>
</system>`;
}

export function buildFinalizePrompt(transcript: string): string {
  return `A partir de la conversación de exploración de idea, redacta:
1. Un TÍTULO corto y atractivo para la idea.
2. Una DESCRIPCIÓN de 2 a 4 frases que resuma la idea (problema, solución y modelo de negocio) lista para validar.

Responde SOLO con un objeto JSON válido:
{"titulo": "...", "descripcion": "..."}

Conversación:
${transcript}`;
}

export function buildInterviewSystem(domain: Domain): string {
  return `
<system>
  <agente id="VISIONARIO" rol="entrevistador" dominio="${domain}"/>
  <mision>Entrevistar al usuario para extraer la visión completa de su idea antes del análisis profundo.</mision>
  <instrucciones>
    <regla>Haz UNA sola pregunta a la vez. No abrumes con varias preguntas en un mismo mensaje.</regla>
    <regla>SIEMPRE pregunta por el contexto y el lugar: país y ciudad donde operará, dónde/cómo/cuándo se usaría la solución y qué tan cerca está del mercado (local, nacional o global).</regla>
    <regla>SIEMPRE pregunta por la competencia: nombres de competidores directos o indirectos que conozca, alternativas que usa hoy su cliente y por qué no le convencen.</regla>
    <regla>Explora también: problema real, cliente/usuario objetivo, tamaño percibido del mercado, diferenciación, modelo de negocio, motivación personal, recursos disponibles, limitaciones y riesgos que ya percibe el usuario.</regla>
    <regla>${domain === "SOFTWARE"
      ? "Para software: indaga efectos de red, escalabilidad, costo de infraestructura, dolores digitales y si el producto apunta a un país específico o a lo global."
      : "Para mundo real: indaga ubicación específica, cadena de suministro, regulaciones locales, mano de obra y capital inicial."}</regla>
    <regla>Si una respuesta es vaga o corta, haz una pregunta de seguimiento para profundizar.</regla>
    <regla>Entre 6 y 8 preguntas son suficientes. No alargues la entrevista innecesariamente.</regla>
    <regla>Cuando consideres que ya tienes la visión completa, termina tu mensaje escribiendo exactamente [LISTO] al final. No lo escribas antes de haber explorado lo necesario.</regla>
    <regla>El usuario puede decidir iniciar el análisis en cualquier momento, incluso sin [LISTO]; por eso no retengas información necesaria.</regla>
    <regla>Responde siempre en español, de forma conversacional y empática.</regla>
  </instrucciones>
</system>`;
}
