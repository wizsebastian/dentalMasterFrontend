/** Consultas de TanStack Query compartidas por las pantallas de pacientes. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { apiFetch } from "../../api/client"
import type {
  Alerta,
  Catalogos,
  Ficha,
  FichaGuardar,
  HallazgoCrear,
  Hallazgo,
  Odontograma,
  OdontogramaResumen,
  PacienteDetalle,
  PaginaPacientes,
} from "../../api/tipos"

const V1 = "/api/v1"

export function usePacientes(buscar: string, offset = 0, limite = 25) {
  const parametros = new URLSearchParams({ limite: String(limite), offset: String(offset) })
  if (buscar.trim()) parametros.set("buscar", buscar.trim())

  return useQuery({
    queryKey: ["pacientes", buscar.trim(), offset, limite],
    queryFn: () => apiFetch<PaginaPacientes>(`${V1}/pacientes?${parametros}`),
    placeholderData: (previo) => previo, // evita el parpadeo al teclear
  })
}

export function usePaciente(id: number) {
  return useQuery({
    queryKey: ["paciente", id],
    queryFn: () => apiFetch<PacienteDetalle>(`${V1}/pacientes/${id}`),
  })
}

export function useAlertas(id: number) {
  return useQuery({
    queryKey: ["paciente", id, "alertas"],
    queryFn: () => apiFetch<Alerta[]>(`${V1}/pacientes/${id}/alertas`),
  })
}

export function useFicha(id: number) {
  return useQuery({
    queryKey: ["paciente", id, "ficha"],
    queryFn: () => apiFetch<Ficha>(`${V1}/pacientes/${id}/ficha`),
    retry: false, // un 404 aquí significa "aún no tiene ficha", no un fallo
  })
}

export function useGuardarFicha(pacienteId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (datos: FichaGuardar) =>
      apiFetch<Ficha>(`${V1}/pacientes/${pacienteId}/ficha`, { method: "PUT", body: datos }),
    onSuccess: () => {
      // Las alertas se derivan de la ficha: cambiar una alergia las cambia.
      queryClient.invalidateQueries({ queryKey: ["paciente", pacienteId] })
    },
  })
}

/** Los catálogos no cambian durante la sesión: se piden una vez. */
export function useCatalogos() {
  return useQuery({
    queryKey: ["catalogos", "odontograma"],
    queryFn: () => apiFetch<Catalogos>(`${V1}/catalogos/odontograma`),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useOdontograma(pacienteId: number) {
  return useQuery({
    queryKey: ["paciente", pacienteId, "odontograma"],
    queryFn: () => apiFetch<Odontograma>(`${V1}/pacientes/${pacienteId}/odontograma`),
    retry: false,
  })
}

export function useVersiones(pacienteId: number) {
  return useQuery({
    queryKey: ["paciente", pacienteId, "odontograma", "versiones"],
    queryFn: () =>
      apiFetch<OdontogramaResumen[]>(`${V1}/pacientes/${pacienteId}/odontograma/versiones`),
  })
}

export function useVersionConcreta(odontogramaId: number | null) {
  return useQuery({
    queryKey: ["odontograma", odontogramaId],
    queryFn: () => apiFetch<Odontograma>(`${V1}/odontogramas/${odontogramaId}`),
    enabled: odontogramaId !== null,
  })
}

export function useCrearVersion(pacienteId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (datos: { observaciones?: string; copiar_hallazgos: boolean }) =>
      apiFetch<Odontograma>(`${V1}/pacientes/${pacienteId}/odontograma`, {
        method: "POST",
        body: datos,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["paciente", pacienteId] }),
  })
}

export function useRegistrarHallazgo(pacienteId: number, odontogramaId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (datos: HallazgoCrear) =>
      apiFetch<Hallazgo>(`${V1}/odontogramas/${odontogramaId}/hallazgos`, {
        method: "POST",
        body: datos,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["paciente", pacienteId, "odontograma"] }),
  })
}

export function useBorrarHallazgo(pacienteId: number, odontogramaId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (hallazgoId: number) =>
      apiFetch<void>(`${V1}/odontogramas/${odontogramaId}/hallazgos/${hallazgoId}`, {
        method: "DELETE",
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["paciente", pacienteId, "odontograma"] }),
  })
}
