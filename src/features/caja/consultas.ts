/** Consultas de la cuenta del paciente y de la caja. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { apiFetch } from "../../api/client"
import type {
  Caja,
  CuentasPorCobrar,
  EstadoDeCuenta,
  Pago,
  PagoCrear,
  Recibo,
} from "../../api/tipos"

const V1 = "/api/v1"

export function useCuenta(pacienteId: number) {
  return useQuery({
    queryKey: ["paciente", pacienteId, "cuenta"],
    queryFn: () => apiFetch<EstadoDeCuenta>(`${V1}/pacientes/${pacienteId}/cuenta`),
  })
}

export function useRecibo(pagoId: number) {
  return useQuery({
    queryKey: ["recibo", pagoId],
    queryFn: () => apiFetch<Recibo>(`${V1}/pagos/${pagoId}`),
  })
}

export function useCuentasPorCobrar(buscar: string) {
  const parametros = new URLSearchParams()
  if (buscar.trim()) parametros.set("buscar", buscar.trim())

  return useQuery({
    queryKey: ["cuentas-por-cobrar", buscar.trim()],
    queryFn: () => apiFetch<CuentasPorCobrar>(`${V1}/cuentas-por-cobrar?${parametros}`),
    placeholderData: (previo) => previo,
  })
}

export function useCaja(desde: string, hasta: string) {
  return useQuery({
    queryKey: ["caja", desde, hasta],
    queryFn: () => apiFetch<Caja>(`${V1}/caja?desde=${desde}&hasta=${hasta}`),
    placeholderData: (previo) => previo,
  })
}

/** Mover dinero cambia el expediente, las cuentas por cobrar y la caja. */
function useMutacionDePago<Entrada>(
  pacienteId: number,
  enviar: (datos: Entrada) => Promise<Pago>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: enviar,
    onSuccess: () => {
      for (const clave of [["paciente", pacienteId], ["cuentas-por-cobrar"], ["caja"], ["recibo"]]) {
        queryClient.invalidateQueries({ queryKey: clave })
      }
    },
  })
}

export function useRegistrarPago(pacienteId: number) {
  return useMutacionDePago(pacienteId, (datos: PagoCrear) =>
    apiFetch<Pago>(`${V1}/pacientes/${pacienteId}/pagos`, { method: "POST", body: datos }),
  )
}

export function useCorregirPago(pacienteId: number) {
  return useMutacionDePago(
    pacienteId,
    ({ id, datos }: { id: number; datos: { concepto?: string | null; referencia?: string | null } }) =>
      apiFetch<Pago>(`${V1}/pagos/${id}`, { method: "PATCH", body: datos }),
  )
}

export function useAnularPago(pacienteId: number) {
  return useMutacionDePago(pacienteId, ({ id, motivo }: { id: number; motivo: string }) =>
    apiFetch<Pago>(`${V1}/pagos/${id}/anular`, { method: "POST", body: { motivo } }),
  )
}
