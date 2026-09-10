/**
 * Cliente HTTP contra la API.
 *
 * Siempre rutas relativas bajo /api: en desarrollo las sirve el proxy de Vite y
 * en producción el mismo origen, así que no hay CORS ni URLs por entorno.
 */
import { leerTokens, limpiarSesion, guardarTokens } from "./sesion"

export class ApiError extends Error {
  readonly status: number
  readonly detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.name = "ApiError"
    this.status = status
    this.detail = detail
  }
}

/** El backend devuelve `detail` como texto, o como lista de errores de validación. */
async function extraerDetalle(respuesta: Response): Promise<string> {
  const cuerpo = await respuesta.json().catch(() => null)
  const detalle = cuerpo?.detail

  if (typeof detalle === "string") return detalle
  if (Array.isArray(detalle)) {
    return detalle
      .map((e) => {
        const campo = Array.isArray(e.loc) ? e.loc.slice(1).join(".") : ""
        return campo ? `${campo}: ${e.msg}` : e.msg
      })
      .join(" · ")
  }
  return respuesta.statusText || "Error inesperado"
}

let refrescoEnCurso: Promise<boolean> | null = null

/**
 * Renueva el access token con el de refresco.
 *
 * Se comparte una sola promesa entre llamadas concurrentes: si tres peticiones
 * reciben 401 a la vez, sólo se pide un token nuevo.
 */
async function refrescarSesion(): Promise<boolean> {
  if (refrescoEnCurso) return refrescoEnCurso

  refrescoEnCurso = (async () => {
    const tokens = leerTokens()
    if (!tokens) return false

    const respuesta = await fetch("/api/v1/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: tokens.refresh_token }),
    })

    if (!respuesta.ok) {
      limpiarSesion()
      return false
    }

    guardarTokens(await respuesta.json())
    return true
  })().finally(() => {
    refrescoEnCurso = null
  })

  return refrescoEnCurso
}

type Opciones = Omit<RequestInit, "body"> & { body?: unknown }

async function enviar(path: string, opciones: Opciones): Promise<Response> {
  const tokens = leerTokens()
  const { body, headers, ...resto } = opciones

  return fetch(path, {
    ...resto,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(tokens ? { Authorization: `Bearer ${tokens.access_token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

export async function apiFetch<T>(path: string, opciones: Opciones = {}): Promise<T> {
  let respuesta = await enviar(path, opciones)

  // Un 401 con sesión abierta suele ser el access token expirado: se renueva y
  // se reintenta una sola vez.
  if (respuesta.status === 401 && leerTokens()) {
    if (await refrescarSesion()) {
      respuesta = await enviar(path, opciones)
    }
  }

  if (!respuesta.ok) {
    if (respuesta.status === 401) limpiarSesion()
    throw new ApiError(respuesta.status, await extraerDetalle(respuesta))
  }

  if (respuesta.status === 204) return undefined as T
  return respuesta.json() as Promise<T>
}
