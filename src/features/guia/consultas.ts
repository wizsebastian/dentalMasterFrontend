/** Consultas de la guía interactiva. Todas van **sin sesión**: la guía es pública. */
import { useQuery } from "@tanstack/react-query"

import { apiFetch } from "../../api/client"
import type { GuiaEstado, GuiaSesion } from "../../api/tipos"

const V1 = "/api/v1/guia"

export function useSesionGuia(codigo: string) {
  return useQuery({
    queryKey: ["guia", codigo],
    queryFn: () => apiFetch<GuiaSesion>(`${V1}/sesiones/${encodeURIComponent(codigo)}`),
    retry: false,
    // La guía guarda lo que la persona hace: no hay otra fuente que la refresque.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}

export function crearSesionGuia(datos: { nombre: string; rol: string | null }) {
  return apiFetch<GuiaSesion>(`${V1}/sesiones`, { method: "POST", body: datos })
}

export function guardarPasoGuia(
  codigo: string,
  pasoId: string,
  datos: { estado: GuiaEstado; nota: string },
) {
  return apiFetch<GuiaSesion>(
    `${V1}/sesiones/${encodeURIComponent(codigo)}/pasos/${encodeURIComponent(pasoId)}`,
    { method: "PUT", body: datos },
  )
}

export function guardarGeneralGuia(codigo: string, texto: string) {
  return apiFetch<GuiaSesion>(`${V1}/sesiones/${encodeURIComponent(codigo)}/general`, {
    method: "PUT",
    body: { texto },
  })
}
