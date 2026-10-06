/** Consultas de la agenda. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { apiFetch } from "../../api/client"
import type {
  Cita,
  CitaActualizar,
  CitaCrear,
  CitaDetalle,
  Clinica,
  EstadoCita,
  ValorEstadoCita,
} from "../../api/tipos"

const V1 = "/api/v1"

export type FiltrosCitas = { doctorId?: number | null; unidadId?: number | null }

/** Citas de un tramo de calendario. `hasta` es exclusivo. */
export function useCitas(desde: Date, hasta: Date, filtros: FiltrosCitas = {}) {
  const parametros = new URLSearchParams({
    desde: desde.toISOString(),
    hasta: hasta.toISOString(),
  })
  if (filtros.doctorId) parametros.set("doctor_id", String(filtros.doctorId))
  if (filtros.unidadId) parametros.set("unidad_id", String(filtros.unidadId))

  return useQuery({
    queryKey: ["citas", desde.toISOString(), hasta.toISOString(), filtros.doctorId ?? null, filtros.unidadId ?? null],
    queryFn: () => apiFetch<Cita[]>(`${V1}/citas?${parametros}`),
    placeholderData: (previo) => previo, // al cambiar de semana no se vacía la rejilla
    // La agenda la mueven varias personas a la vez: se refresca sola.
    refetchInterval: 60_000,
  })
}

export function useCitasDePaciente(pacienteId: number) {
  return useQuery({
    queryKey: ["citas", "paciente", pacienteId],
    queryFn: () => apiFetch<Cita[]>(`${V1}/citas?paciente_id=${pacienteId}`),
  })
}

export function useCita(id: number | null) {
  return useQuery({
    queryKey: ["citas", "detalle", id],
    queryFn: () => apiFetch<CitaDetalle>(`${V1}/citas/${id}`),
    enabled: id !== null,
  })
}

/** Toda escritura invalida la agenda entera: una cita movida cambia dos semanas. */
function useMutacionCita<Entrada>(enviar: (datos: Entrada) => Promise<Cita>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: enviar,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["citas"] }),
  })
}

export function useCrearCita() {
  return useMutacionCita((datos: CitaCrear) =>
    apiFetch<Cita>(`${V1}/citas`, { method: "POST", body: datos }),
  )
}

export function useActualizarCita() {
  return useMutacionCita(({ id, datos }: { id: number; datos: CitaActualizar }) =>
    apiFetch<Cita>(`${V1}/citas/${id}`, { method: "PATCH", body: datos }),
  )
}

export function useCambiarEstado() {
  return useMutacionCita(
    ({ id, estado, motivo }: { id: number; estado: ValorEstadoCita; motivo?: string }) =>
      apiFetch<Cita>(`${V1}/citas/${id}/estado`, { method: "POST", body: { estado, motivo } }),
  )
}

export function useMarcarRecordatorio() {
  return useMutacionCita((id: number) =>
    apiFetch<Cita>(`${V1}/citas/${id}/recordatorio`, { method: "POST" }),
  )
}

/** Los seis estados con su etiqueta y su color: no cambian durante la sesión. */
export function useEstadosCita() {
  return useQuery({
    queryKey: ["catalogos", "estados-cita"],
    queryFn: () => apiFetch<EstadoCita[]>(`${V1}/catalogos/estados-cita`),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useClinica() {
  return useQuery({
    queryKey: ["catalogos", "clinica"],
    queryFn: () => apiFetch<Clinica>(`${V1}/catalogos/clinica`),
    staleTime: Infinity,
  })
}
