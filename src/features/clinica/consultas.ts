/** Consultas de los datos de la clínica: lo que llevan los impresos y los mensajes. */
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { apiFetch } from "../../api/client"
import type { Clinica } from "../../api/tipos"
import { useClinica } from "../agenda/consultas"
import { useContenido } from "../archivos/consultas"

const V1 = "/api/v1"
const CLAVE = ["catalogos", "clinica"]

export type DatosClinica = {
  nombre?: string
  rnc?: string | null
  direccion?: string | null
  ciudad?: string | null
  telefono?: string | null
  whatsapp?: string | null
  email?: string | null
  web?: string | null
}

export function useGuardarClinica() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (datos: DatosClinica) =>
      apiFetch<Clinica>(`${V1}/catalogos/clinica`, { method: "PATCH", body: datos }),
    onSuccess: (clinica) => queryClient.setQueryData(CLAVE, clinica),
  })
}

export function useSubirLogo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (archivo: File) => {
      const cuerpo = new FormData()
      cuerpo.append("archivo", archivo)
      return apiFetch<Clinica>(`${V1}/catalogos/clinica/logo`, { method: "PUT", body: cuerpo })
    },
    onSuccess: (clinica) => queryClient.setQueryData(CLAVE, clinica),
  })
}

export function useQuitarLogo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch<void>(`${V1}/catalogos/clinica/logo`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE }),
  })
}

/** La clínica y su logo, ya como URL lista para un `<img>` (o `null` si no hay). */
export function useClinicaConLogo() {
  const { data: clinica } = useClinica()
  const { url: logo } = useContenido(clinica?.logo_archivo_id)
  return { clinica, logo: clinica?.logo_archivo_id ? logo : null }
}
