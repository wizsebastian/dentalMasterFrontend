/** Consultas de documentos, plantillas, firmas y recetas. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { apiFetch } from "../../api/client"
import type {
  Borrador,
  Documento,
  DocumentoCrear,
  DocumentoParaFirmar,
  DocumentosDelPaciente,
  Plantilla,
  Receta,
  RecetaCrear,
} from "../../api/tipos"

const V1 = "/api/v1"

export function usePlantillas(incluirInactivas = false) {
  return useQuery({
    queryKey: ["plantillas", incluirInactivas],
    queryFn: () => apiFetch<Plantilla[]>(`${V1}/plantillas?incluir_inactivas=${incluirInactivas}`),
  })
}

export function useGuardarPlantilla() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: { titulo?: string; cuerpo?: string; activo?: boolean } }) =>
      apiFetch<Plantilla>(`${V1}/plantillas/${id}`, { method: "PATCH", body: datos }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["plantillas"] }),
  })
}

export function useDocumentos(pacienteId: number) {
  return useQuery({
    queryKey: ["paciente", pacienteId, "documentos"],
    queryFn: () => apiFetch<DocumentosDelPaciente>(`${V1}/pacientes/${pacienteId}/documentos`),
  })
}

export function useDocumento(documentoId: number) {
  return useQuery({
    queryKey: ["documento", documentoId],
    queryFn: () => apiFetch<Documento>(`${V1}/documentos/${documentoId}`),
  })
}

/** La plantilla ya combinada con los datos del paciente. Se pide al elegirla. */
export function pedirBorrador(pacienteId: number, plantillaId: number, planId?: number | null) {
  const parametros = new URLSearchParams({ plantilla_id: String(plantillaId) })
  if (planId) parametros.set("plan_id", String(planId))
  return apiFetch<Borrador>(`${V1}/pacientes/${pacienteId}/documentos/borrador?${parametros}`)
}

function useMutacion<Entrada, Salida>(pacienteId: number, enviar: (d: Entrada) => Promise<Salida>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: enviar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paciente", pacienteId, "documentos"] })
      queryClient.invalidateQueries({ queryKey: ["documento"] })
    },
  })
}

export function useEmitirDocumento(pacienteId: number) {
  return useMutacion(pacienteId, (datos: DocumentoCrear) =>
    apiFetch<Documento>(`${V1}/pacientes/${pacienteId}/documentos`, { method: "POST", body: datos }),
  )
}

export function useAnularDocumento(pacienteId: number) {
  return useMutacion(pacienteId, ({ id, motivo }: { id: number; motivo: string }) =>
    apiFetch<Documento>(`${V1}/documentos/${id}/anular`, { method: "POST", body: { motivo } }),
  )
}

export function useRecetar(pacienteId: number) {
  return useMutacion(pacienteId, (datos: RecetaCrear) =>
    apiFetch<Receta>(`${V1}/pacientes/${pacienteId}/recetas`, { method: "POST", body: datos }),
  )
}

export function pedirEnlaceDeFirma(documentoId: number) {
  return apiFetch<{ token: string; minutos: number }>(`${V1}/documentos/${documentoId}/enlace-firma`, {
    method: "POST",
  })
}

// --- Sin sesión: la página de firma ------------------------------------------

export function useDocumentoParaFirmar(token: string) {
  return useQuery({
    queryKey: ["firma", token],
    queryFn: () => apiFetch<DocumentoParaFirmar>(`${V1}/firma/${token}`),
    retry: false,
  })
}

export function enviarFirma(
  token: string,
  datos: { firmante_nombre: string; firmante_rol: string; firmante_documento: string | null; trazo: number[][][] },
) {
  return apiFetch<void>(`${V1}/firma/${token}`, { method: "POST", body: datos })
}
