/** Consultas del historial clínico: planes de tratamiento, consultas y líneas. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { apiFetch } from "../../api/client"
import type {
  Consulta,
  ConsultaActualizar,
  ConsultaCrear,
  Historial,
  ItemActualizar,
  ItemEscribir,
  Plan,
  PlanActualizar,
  PlanCrear,
} from "../../api/tipos"

const V1 = "/api/v1"

export function useHistorial(pacienteId: number) {
  return useQuery({
    queryKey: ["paciente", pacienteId, "historial"],
    queryFn: () => apiFetch<Historial>(`${V1}/pacientes/${pacienteId}/historial`),
  })
}

export function usePlan(planId: number) {
  return useQuery({
    queryKey: ["plan", planId],
    queryFn: () => apiFetch<Plan>(`${V1}/planes/${planId}`),
  })
}

/**
 * Toda escritura invalida el expediente entero: una línea ejecutada cambia el
 * historial, el odontograma y el estado de cuenta a la vez.
 */
function useMutacion<Entrada, Salida>(
  pacienteId: number,
  enviar: (datos: Entrada) => Promise<Salida>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: enviar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paciente", pacienteId] })
      queryClient.invalidateQueries({ queryKey: ["plan"] })
    },
  })
}

export function useGuardarConsulta(pacienteId: number) {
  return useMutacion(
    pacienteId,
    ({ id, datos }: { id?: number; datos: ConsultaCrear | ConsultaActualizar }) =>
      id === undefined
        ? apiFetch<Consulta>(`${V1}/pacientes/${pacienteId}/consultas`, {
            method: "POST",
            body: datos,
          })
        : apiFetch<Consulta>(`${V1}/consultas/${id}`, { method: "PATCH", body: datos }),
  )
}

export function useBorrarConsulta(pacienteId: number) {
  return useMutacion(pacienteId, (id: number) =>
    apiFetch<void>(`${V1}/consultas/${id}`, { method: "DELETE" }),
  )
}

export function useGuardarPlan(pacienteId: number) {
  return useMutacion(
    pacienteId,
    ({ id, datos }: { id?: number; datos: PlanCrear | PlanActualizar }) =>
      id === undefined
        ? apiFetch<Plan>(`${V1}/pacientes/${pacienteId}/planes`, { method: "POST", body: datos })
        : apiFetch<Plan>(`${V1}/planes/${id}`, { method: "PATCH", body: datos }),
  )
}

export function useBorrarPlan(pacienteId: number) {
  return useMutacion(pacienteId, (id: number) =>
    apiFetch<void>(`${V1}/planes/${id}`, { method: "DELETE" }),
  )
}

export function useCrearItem(pacienteId: number, planId: number) {
  return useMutacion(pacienteId, (datos: ItemEscribir) =>
    apiFetch<Plan>(`${V1}/planes/${planId}/items`, { method: "POST", body: datos }),
  )
}

export function useActualizarItem(pacienteId: number, planId: number) {
  return useMutacion(pacienteId, ({ itemId, datos }: { itemId: number; datos: ItemActualizar }) =>
    apiFetch<Plan>(`${V1}/planes/${planId}/items/${itemId}`, { method: "PATCH", body: datos }),
  )
}

export function useBorrarItem(pacienteId: number, planId: number) {
  return useMutacion(pacienteId, (itemId: number) =>
    apiFetch<Plan>(`${V1}/planes/${planId}/items/${itemId}`, { method: "DELETE" }),
  )
}
