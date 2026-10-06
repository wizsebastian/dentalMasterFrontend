import type { Linea, PlanItem, ValorEstadoPlan } from "../../api/tipos"

/** Cómo se nombra cada estado del plan en pantalla. */
export const ESTADO_PLAN: Record<ValorEstadoPlan, string> = {
  borrador: "Abierto",
  presentado: "Presupuesto entregado",
  aceptado: "Aceptado",
  rechazado: "Rechazado",
  en_ejecucion: "En curso",
  finalizado: "Finalizado",
}

/** El verbo de cada cambio de estado que se hace a mano. */
export const ACCION_PLAN: Record<ValorEstadoPlan, string> = {
  borrador: "Volver a abierto",
  presentado: "Marcar presupuesto entregado",
  aceptado: "Aceptado por el paciente",
  rechazado: "Rechazado por el paciente",
  en_ejecucion: "Reabrir",
  finalizado: "Finalizar plan",
}

/** `16 · MO`, o nada si el servicio no va sobre una pieza. */
export function pieza(linea: Pick<Linea | PlanItem, "codigo_fdi" | "superficies">): string {
  if (linea.codigo_fdi === null || linea.codigo_fdi === undefined) return ""
  return linea.superficies ? `${linea.codigo_fdi} · ${linea.superficies}` : String(linea.codigo_fdi)
}

/** Lo que se pide a un `<input>` de importe: `1500`, `1500.5`, `1500,50`. */
export const IMPORTE = /^\d+([.,]\d{1,2})?$/

export function aNumero(texto: string): number {
  return Number(texto.replace(",", "."))
}
