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
  /** Errores de validación por campo (`precios.0.precio` → mensaje). */
  readonly campos: Record<string, string>

  constructor(status: number, detail: string, campos: Record<string, string> = {}) {
    super(detail)
    this.name = "ApiError"
    this.status = status
    this.detail = detail
    this.campos = campos
  }
}

/** Quita el prefijo que Pydantic antepone a los mensajes de un validador propio. */
function limpiar(mensaje: string): string {
  return mensaje.replace(/^Value error, /, "")
}

/**
 * El backend devuelve `detail` como texto, o como lista de errores de
 * validación. En el segundo caso se conserva además el campo de cada error,
 * para que el formulario lo pinte junto a su control.
 */
async function extraerError(respuesta: Response): Promise<ApiError> {
  const cuerpo = await respuesta.json().catch(() => null)
  const detalle = cuerpo?.detail

  if (typeof detalle === "string") return new ApiError(respuesta.status, detalle)

  if (Array.isArray(detalle)) {
    const campos: Record<string, string> = {}
    const lineas = detalle.map((e) => {
      const campo = Array.isArray(e.loc) ? e.loc.slice(1).join(".") : ""
      const mensaje = limpiar(String(e.msg))
      if (campo && !(campo in campos)) campos[campo] = mensaje
      return campo ? `${campo}: ${mensaje}` : mensaje
    })
    return new ApiError(respuesta.status, lineas.join(" · "), campos)
  }

  return new ApiError(respuesta.status, respuesta.statusText || "Error inesperado")
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
  // Un FormData (subida de archivos) viaja tal cual: el navegador pone el
  // Content-Type con su frontera.
  const esFormulario = body instanceof FormData

  return fetch(path, {
    ...resto,
    headers: {
      ...(body === undefined || esFormulario ? {} : { "Content-Type": "application/json" }),
      ...(tokens ? { Authorization: `Bearer ${tokens.access_token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : esFormulario ? body : JSON.stringify(body),
  })
}

async function pedir(path: string, opciones: Opciones): Promise<Response> {
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
    throw await extraerError(respuesta)
  }
  return respuesta
}

export async function apiFetch<T>(path: string, opciones: Opciones = {}): Promise<T> {
  const respuesta = await pedir(path, opciones)
  if (respuesta.status === 204) return undefined as T
  return respuesta.json() as Promise<T>
}

/**
 * Los bytes de un archivo. Las fotos y los exámenes exigen sesión, así que no
 * sirven como `src` directo: se piden con el token y se muestran desde memoria.
 */
export async function apiBlob(path: string): Promise<Blob> {
  return (await pedir(path, {})).blob()
}
