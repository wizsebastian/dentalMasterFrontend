/** Consultas del resumen del paciente y de sus seguros. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { apiFetch } from "../../api/client"
import type { Aseguradora, ResumenClinico, Seguro, SeguroEscribir } from "../../api/tipos"

const V1 = "/api/v1"

export function useResumen(pacienteId: number) {
  return useQuery({
    queryKey: ["paciente", pacienteId, "resumen"],
    queryFn: () => apiFetch<ResumenClinico>(`${V1}/pacientes/${pacienteId}/resumen`),
  })
}

export function useSeguros(pacienteId: number) {
  return useQuery({
    queryKey: ["paciente", pacienteId, "seguros"],
    queryFn: () => apiFetch<Seguro[]>(`${V1}/pacientes/${pacienteId}/seguros`),
  })
}

export function useAseguradoras() {
  return useQuery({
    queryKey: ["aseguradoras"],
    queryFn: () => apiFetch<Aseguradora[]>(`${V1}/aseguradoras`),
    staleTime: 5 * 60_000,
  })
}

export function useGuardarSeguro(pacienteId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, datos }: { id?: number; datos: SeguroEscribir }) =>
      id === undefined
        ? apiFetch<Seguro>(`${V1}/pacientes/${pacienteId}/seguros`, { method: "POST", body: datos })
        : apiFetch<Seguro>(`${V1}/seguros/${id}`, { method: "PUT", body: datos }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["paciente", pacienteId] }),
  })
}

export function useQuitarSeguro(pacienteId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`${V1}/seguros/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["paciente", pacienteId] }),
  })
}
