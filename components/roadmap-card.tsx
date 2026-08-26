"use client";

import { Field, List } from "@/components/ui/field";
import { Hammer } from "lucide-react";

interface Roadmap {
  tipo: "SOFTWARE" | "PHYSICAL";
  stackRecomendado?: string;
  arquitecturaBase?: string;
  funcionesEsencialesMvp?: string[];
  insumosMinimos?: string[];
  validacionFisicaPreliminar?: string;
  requerimientosOperativos?: string[];
  posicionamiento?: {
    diferenciacion: string;
    mensajeDeMarca: string;
    competenciaPrincipal: string;
    estrategiaDeEntrada: string;
    canalesIniciales: string[];
    riesgoCompetitivo: string;
  };
}

export default function RoadmapCard({ roadmap }: { roadmap: Roadmap }) {
  const pos = roadmap.posicionamiento;
  return (
    <div className="card">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold tracking-tight">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
          <Hammer size={16} />
        </span>
        Hoja de ruta
      </h2>
      {roadmap.tipo === "SOFTWARE" ? (
        <div className="space-y-3">
          <Field label="Stack recomendado" value={roadmap.stackRecomendado} />
          <Field label="Arquitectura base" value={roadmap.arquitecturaBase} />
          <List label="Funciones esenciales del MVP" items={roadmap.funcionesEsencialesMvp} tone="accent" />
        </div>
      ) : (
        <div className="space-y-3">
          <List label="Insumos mínimos" items={roadmap.insumosMinimos} tone="accent" />
          <Field label="Validación física preliminar" value={roadmap.validacionFisicaPreliminar} />
          <List label="Requerimientos operativos" items={roadmap.requerimientosOperativos} tone="accent" />
        </div>
      )}

      {pos && (
        <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <h3 className="mb-3 text-sm font-semibold text-primary">Posicionamiento de mercado</h3>
          <div className="space-y-3">
            <Field label="Diferenciación" value={pos.diferenciacion} />
            <Field label="Mensaje de marca" value={pos.mensajeDeMarca} />
            <Field label="Competencia principal" value={pos.competenciaPrincipal} />
            <Field label="Estrategia de entrada" value={pos.estrategiaDeEntrada} />
            <List label="Canales iniciales" items={pos.canalesIniciales} tone="accent" />
            <Field label="Riesgo competitivo" value={pos.riesgoCompetitivo} />
          </div>
        </div>
      )}
    </div>
  );
}
