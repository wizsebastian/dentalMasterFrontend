import type { EstadoCita, ValorEstadoCita } from "../../api/tipos"

export type MapaEstados = Map<ValorEstadoCita, EstadoCita>

export function mapaDeEstados(estados: EstadoCita[] | undefined): MapaEstados {
  return new Map((estados ?? []).map((e) => [e.valor, e]))
}
