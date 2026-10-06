/** Consultas de implantes: registro, seguimiento y búsqueda por lote. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { apiFetch } from "../../api/client"
import type {
  EventoImplanteCrear,
  Implante,
  ImplanteConPaciente,
  ImplanteCrear,
  SistemaImplante,
} from "../../api/tipos"

const V1 = "/api/v1"

export function useImplantes(pacienteId: number) {
  return useQuery({
    queryKey: ["paciente", pacienteId, "implantes"],
    queryFn: () => apiFetch<Implante[]>(`${V1}/pacientes/${pacienteId}/implantes`),
  })
}

export function useSistemas() {
  return useQuery({
    queryKey: ["sistemas-implante"],
    queryFn: () => apiFetch<SistemaImplante[]>(`${V1}/sistemas-implante`),
    staleTime: 5 * 60_000,
  })
}

export function useCrearSistema() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (datos: { marca: string; linea: string }) =>
      apiFetch<SistemaImplante>(`${V1}/sistemas-implante`, { method: "POST", body: datos }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sistemas-implante"] }),
  })
}

/** Un implante toca el historial (la línea queda con lote), el resumen y su lista. */
export function useRegistrarImplante(pacienteId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (datos: ImplanteCrear) =>
      apiFetch<Implante>(`${V1}/pacientes/${pacienteId}/implantes`, { method: "POST", body: datos }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["paciente", pacienteId] }),
  })
}

export function useRegistrarEvento(pacienteId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ implanteId, datos }: { implanteId: number; datos: EventoImplanteCrear }) =>
      apiFetch<Implante>(`${V1}/implantes/${implanteId}/eventos`, { method: "POST", body: datos }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["paciente", pacienteId] }),
  })
}

export function useImplantesDeLote(lote: string) {
  const buscado = lote.trim()
  return useQuery({
    queryKey: ["implantes", "lote", buscado],
    queryFn: () =>
      apiFetch<ImplanteConPaciente[]>(`${V1}/implantes?lote=${encodeURIComponent(buscado)}`),
    enabled: buscado.length >= 2,
  })
}
