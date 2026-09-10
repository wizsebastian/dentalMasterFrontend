/**
 * Persistencia de la sesión.
 *
 * Los tokens viven en localStorage: es una aplicación de escritorio de clínica,
 * con equipos compartidos por turno, y cerrar la pestaña no debe obligar a
 * volver a entrar a mitad de una consulta.
 */
import type { Tokens } from "./tipos"

const CLAVE = "dentalmaster.sesion"

export function leerTokens(): Tokens | null {
  const guardado = localStorage.getItem(CLAVE)
  if (!guardado) return null

  try {
    return JSON.parse(guardado) as Tokens
  } catch {
    localStorage.removeItem(CLAVE)
    return null
  }
}

export function guardarTokens(tokens: Tokens): void {
  localStorage.setItem(CLAVE, JSON.stringify(tokens))
}

export function limpiarSesion(): void {
  localStorage.removeItem(CLAVE)
}
