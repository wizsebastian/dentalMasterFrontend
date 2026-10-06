/** Consultas de comprobantes fiscales (NCF) y del cierre de caja. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { apiFetch } from "../../api/client"
import type {
  CajaDelDia,
  CierreCaja,
  Factura,
  FacturaCrear,
  FacturaImprimible,
  FacturasDelPaciente,
  SecuenciaNcf,
  SecuenciaNcfCrear,
} from "../../api/tipos"

const V1 = "/api/v1"

export function useFacturas(pacienteId: number) {
  return useQuery({
    queryKey: ["paciente", pacienteId, "facturas"],
    queryFn: () => apiFetch<FacturasDelPaciente>(`${V1}/pacientes/${pacienteId}/facturas`),
  })
}

export function useFactura(facturaId: number) {
  return useQuery({
    queryKey: ["factura", facturaId],
    queryFn: () => apiFetch<FacturaImprimible>(`${V1}/facturas/${facturaId}`),
  })
}

export function useEmitirFactura(pacienteId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (datos: FacturaCrear) =>
      apiFetch<FacturaImprimible>(`${V1}/pacientes/${pacienteId}/facturas`, {
        method: "POST",
        body: datos,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paciente", pacienteId, "facturas"] })
      queryClient.invalidateQueries({ queryKey: ["secuencias-ncf"] })
    },
  })
}

export function useAnularFactura() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) =>
      apiFetch<Factura>(`${V1}/facturas/${id}/anular`, { method: "POST", body: { motivo } }),
    onSuccess: (factura) => {
      queryClient.invalidateQueries({ queryKey: ["paciente", factura.paciente_id, "facturas"] })
      queryClient.invalidateQueries({ queryKey: ["factura", factura.id] })
    },
  })
}

export function useSecuencias() {
  return useQuery({
    queryKey: ["secuencias-ncf"],
    queryFn: () => apiFetch<SecuenciaNcf[]>(`${V1}/secuencias-ncf`),
  })
}

export function useCrearSecuencia() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (datos: SecuenciaNcfCrear) =>
      apiFetch<SecuenciaNcf>(`${V1}/secuencias-ncf`, { method: "POST", body: datos }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["secuencias-ncf"] }),
  })
}

export function useCajaDelDia(fecha: string) {
  return useQuery({
    // Cuelga de "caja": cobrar o anular un pago la refresca.
    queryKey: ["caja", "dia", fecha],
    queryFn: () => apiFetch<CajaDelDia>(`${V1}/caja/dia?fecha=${fecha}`),
  })
}

export function useCerrarCaja() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (datos: { fecha: string; efectivo_contado: string; notas?: string }) =>
      apiFetch<CierreCaja>(`${V1}/caja/cierres`, { method: "POST", body: datos }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["caja"] }),
  })
}

export function useReabrirCaja() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (cierreId: number) =>
      apiFetch<void>(`${V1}/caja/cierres/${cierreId}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["caja"] }),
  })
}
