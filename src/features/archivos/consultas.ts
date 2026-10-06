/** Consultas de archivos: fotos de consulta, exámenes y comprobantes. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { apiBlob, apiFetch } from "../../api/client"
import type { Archivo, ArchivoClinico, TipoArchivo } from "../../api/tipos"

const V1 = "/api/v1"

/** Clave de las consultas que guardan una URL de objeto: hay que liberarlas. */
export const CLAVE_CONTENIDO = "archivo"

export function useArchivos(pacienteId: number) {
  return useQuery({
    queryKey: ["paciente", pacienteId, "archivos"],
    queryFn: () => apiFetch<ArchivoClinico[]>(`${V1}/pacientes/${pacienteId}/archivos`),
  })
}

/**
 * El contenido de un archivo como URL local.
 *
 * Los archivos exigen sesión, así que no valen como `src` directo: se piden con
 * el token y se muestran desde memoria. La URL vive en la caché de consultas y
 * se libera cuando la caché la descarta (ver `main.tsx`).
 */
export function useContenido(archivoId: number | null | undefined) {
  const { data, isPending, error } = useQuery({
    queryKey: [CLAVE_CONTENIDO, archivoId],
    queryFn: async () => URL.createObjectURL(await apiBlob(`${V1}/archivos/${archivoId}`)),
    enabled: archivoId != null,
    // El contenido de un id no cambia nunca.
    staleTime: Infinity,
  })
  return { url: data ?? null, cargando: archivoId != null && isPending, error }
}

export type Subida = {
  archivo: File
  tipo?: TipoArchivo
  titulo?: string
  consulta_id?: number
  codigo_fdi?: number | null
  tomado_en?: string
}

function formulario(campos: Record<string, unknown>): FormData {
  const cuerpo = new FormData()
  for (const [clave, valor] of Object.entries(campos)) {
    if (valor === undefined || valor === null || valor === "") continue
    cuerpo.append(clave, valor instanceof File ? valor : String(valor))
  }
  return cuerpo
}

export function useSubirArchivo(pacienteId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (subida: Subida) =>
      apiFetch<ArchivoClinico>(`${V1}/pacientes/${pacienteId}/archivos`, {
        method: "POST",
        body: formulario(subida),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["paciente", pacienteId] }),
  })
}

export function useActualizarArchivo(pacienteId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      datos,
    }: {
      id: number
      datos: { tipo?: TipoArchivo; titulo?: string | null; codigo_fdi?: number | null; tomado_en?: string | null }
    }) => apiFetch<ArchivoClinico>(`${V1}/archivos-clinicos/${id}`, { method: "PATCH", body: datos }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["paciente", pacienteId, "archivos"] }),
  })
}

export function useQuitarArchivo(pacienteId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<void>(`${V1}/archivos-clinicos/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["paciente", pacienteId] }),
  })
}

/** Comprobante de un pago o de un gasto: uno por registro, se sustituye. */
export function useComprobante(de: "pagos" | "gastos", id: number) {
  const queryClient = useQueryClient()
  const refrescar = () => {
    const claves = de === "pagos" ? ["paciente", "caja", "recibo"] : ["gastos"]
    for (const clave of claves) queryClient.invalidateQueries({ queryKey: [clave] })
  }
  const adjuntar = useMutation({
    mutationFn: (archivo: File) =>
      apiFetch<Archivo>(`${V1}/${de}/${id}/comprobante`, {
        method: "PUT",
        body: formulario({ archivo }),
      }),
    onSuccess: refrescar,
  })
  const quitar = useMutation({
    mutationFn: () => apiFetch<void>(`${V1}/${de}/${id}/comprobante`, { method: "DELETE" }),
    onSuccess: refrescar,
  })
  return { adjuntar, quitar }
}
