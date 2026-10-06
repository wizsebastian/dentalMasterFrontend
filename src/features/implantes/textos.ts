import type { ValorEstadoImplante } from "../../api/tipos"

export const ESTADO_IMPLANTE: Record<ValorEstadoImplante, string> = {
  planificado: "Planificado",
  colocado: "Colocado",
  oseointegrado: "Oseointegrado",
  cargado: "Cargado",
  fallido: "Fallido",
  explantado: "Explantado",
}

export const TIPOS_EVENTO = [
  { id: "control", etiqueta: "Control" },
  { id: "segunda_fase", etiqueta: "Segunda fase" },
  { id: "carga", etiqueta: "Carga protésica" },
  { id: "complicacion", etiqueta: "Complicación" },
  { id: "retiro", etiqueta: "Retiro del implante" },
  { id: "colocacion", etiqueta: "Colocación" },
] as const

export type TipoEvento = (typeof TIPOS_EVENTO)[number]["id"]

export function tipoEvento(valor: string): string {
  return TIPOS_EVENTO.find((t) => t.id === valor)?.etiqueta ?? valor
}

/** `Ø 4.1 × 10 mm`, con lo que se sepa. */
export function medidas(diametro: string | null | undefined, longitud: string | null | undefined): string {
  const partes = [diametro && `Ø ${Number(diametro)}`, longitud && `${Number(longitud)} mm`].filter(Boolean)
  return partes.join(" × ")
}
