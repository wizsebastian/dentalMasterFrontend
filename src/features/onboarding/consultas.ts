/** Consultas de la guía de primeros pasos. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { apiFetch } from "../../api/client"
import type { Onboarding } from "../../api/tipos"
import { useAuth } from "../auth/contexto"

const V1 = "/api/v1"
const CLAVE = ["onboarding"]

/**
 * Cómo va la configuración. Se vuelve a pedir tras cualquier alta o cambio (la
 * caché de mutaciones de `main.tsx` invalida esta clave), de modo que un paso se
 * marca como hecho en cuanto el cliente hace el trabajo real.
 */
export function useOnboarding() {
  const { usuario } = useAuth()
  return useQuery({
    queryKey: CLAVE,
    queryFn: () => apiFetch<Onboarding>(`${V1}/onboarding`),
    enabled: Boolean(usuario),
    staleTime: 5_000,
  })
}

export function useRevisarCatalogo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch<Onboarding>(`${V1}/onboarding/revisar-catalogo`, { method: "POST" }),
    onSuccess: (estado) => queryClient.setQueryData(CLAVE, estado),
  })
}

export function useCerrarGuia() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch<Onboarding>(`${V1}/onboarding/cerrar`, { method: "POST" }),
    onSuccess: (estado) => queryClient.setQueryData(CLAVE, estado),
  })
}
