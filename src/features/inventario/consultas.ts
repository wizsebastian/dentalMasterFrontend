/** Consultas de gastos, inventario e informes. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { apiFetch } from "../../api/client"
import type {
  Gasto,
  GastoCrear,
  Gastos,
  Insumo,
  InsumoActualizar,
  InsumoCrear,
  Inventario,
  Movimiento,
  MovimientoCrear,
  Nombre,
  RecetaInsumo,
  Resumen,
} from "../../api/tipos"

const V1 = "/api/v1"

function useMutacion<Entrada, Salida>(enviar: (d: Entrada) => Promise<Salida>, claves: string[]) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: enviar,
    onSuccess: () => {
      for (const clave of claves) queryClient.invalidateQueries({ queryKey: [clave] })
    },
  })
}

// --- Gastos --------------------------------------------------------------------

export type FiltrosGastos = { desde: string; hasta: string; tipo: string; categoriaId: string; buscar: string }

export function useGastos(filtros: FiltrosGastos) {
  const parametros = new URLSearchParams({ desde: filtros.desde, hasta: filtros.hasta })
  if (filtros.tipo) parametros.set("tipo", filtros.tipo)
  if (filtros.categoriaId) parametros.set("categoria_id", filtros.categoriaId)
  if (filtros.buscar.trim()) parametros.set("buscar", filtros.buscar.trim())

  return useQuery({
    queryKey: ["gastos", filtros],
    queryFn: () => apiFetch<Gastos>(`${V1}/gastos?${parametros}`),
    placeholderData: (previo) => previo,
  })
}

export function useCategoriasDeGasto() {
  return useQuery({
    queryKey: ["categorias-gasto"],
    queryFn: () => apiFetch<Nombre[]>(`${V1}/categorias-gasto`),
  })
}

export function useCrearCategoriaDeGasto() {
  return useMutacion(
    (nombre: string) =>
      apiFetch<Nombre>(`${V1}/categorias-gasto`, { method: "POST", body: { nombre } }),
    ["categorias-gasto"],
  )
}

// Un gasto con compras mueve el almacén; todo gasto cambia los informes.
const TRAS_GASTO = ["gastos", "insumos", "informes"]

export function useRegistrarGasto() {
  return useMutacion(
    (datos: GastoCrear) => apiFetch<Gasto>(`${V1}/gastos`, { method: "POST", body: datos }),
    TRAS_GASTO,
  )
}

export function useAnularGasto() {
  return useMutacion(
    ({ id, motivo }: { id: number; motivo: string }) =>
      apiFetch<Gasto>(`${V1}/gastos/${id}/anular`, { method: "POST", body: { motivo } }),
    TRAS_GASTO,
  )
}

// --- Insumos -------------------------------------------------------------------

export function useInventario(incluirInactivos = false) {
  return useQuery({
    queryKey: ["insumos", incluirInactivos],
    queryFn: () => apiFetch<Inventario>(`${V1}/insumos?incluir_inactivos=${incluirInactivos}`),
  })
}

export function useCategoriasDeInsumo() {
  return useQuery({
    queryKey: ["categorias-insumo"],
    queryFn: () => apiFetch<Nombre[]>(`${V1}/categorias-insumo`),
  })
}

export function useGuardarInsumo() {
  return useMutacion(
    ({ id, datos }: { id?: number; datos: InsumoCrear | InsumoActualizar }) =>
      id === undefined
        ? apiFetch<Insumo>(`${V1}/insumos`, { method: "POST", body: datos })
        : apiFetch<Insumo>(`${V1}/insumos/${id}`, { method: "PATCH", body: datos }),
    ["insumos"],
  )
}

export function useMoverInsumo() {
  return useMutacion(
    ({ id, datos }: { id: number; datos: MovimientoCrear }) =>
      apiFetch<Insumo>(`${V1}/insumos/${id}/movimientos`, { method: "POST", body: datos }),
    ["insumos", "kardex"],
  )
}

export function useKardex(insumoId: number | null) {
  return useQuery({
    queryKey: ["kardex", insumoId],
    queryFn: () => apiFetch<Movimiento[]>(`${V1}/insumos/${insumoId}/movimientos`),
    enabled: insumoId !== null,
  })
}

// --- Receta de un servicio -----------------------------------------------------

export function useRecetaDeServicio(servicioId: number | null) {
  return useQuery({
    queryKey: ["receta-servicio", servicioId],
    queryFn: () => apiFetch<RecetaInsumo[]>(`${V1}/servicios/${servicioId}/insumos`),
    enabled: servicioId !== null,
  })
}

export function useGuardarReceta(servicioId: number) {
  return useMutacion(
    (renglones: { insumo_id: number; cantidad: string }[]) =>
      apiFetch<RecetaInsumo[]>(`${V1}/servicios/${servicioId}/insumos`, {
        method: "PUT",
        body: renglones,
      }),
    ["receta-servicio"],
  )
}

// --- Informes ------------------------------------------------------------------

export function useResumen(desde: string, hasta: string) {
  return useQuery({
    queryKey: ["informes", desde, hasta],
    queryFn: () => apiFetch<Resumen>(`${V1}/informes/resumen?desde=${desde}&hasta=${hasta}`),
    placeholderData: (previo) => previo,
  })
}
