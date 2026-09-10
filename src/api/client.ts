/**
 * Cliente HTTP contra la API.
 *
 * Siempre rutas relativas bajo /api: en desarrollo las sirve el proxy de Vite y
 * en producción el mismo origen, así que no hay CORS ni URLs por entorno.
 */

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const respuesta = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  })

  if (!respuesta.ok) {
    const detalle = await respuesta.json().catch(() => null)
    throw new ApiError(respuesta.status, detalle?.detail ?? respuesta.statusText)
  }

  return respuesta.json() as Promise<T>
}
