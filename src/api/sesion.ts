/**
 * Persistencia de la sesión.
 *
 * Los tokens viven en localStorage: es una aplicación de escritorio de clínica,
 * con equipos compartidos por turno, y cerrar la pestaña no debe obligar a
 * volver a entrar a mitad de una consulta.
 *
 * Es además un almacén al que la interfaz se suscribe: cuando la sesión se
 * abre o se cierra —al pulsar «Salir», o porque el servidor rechazó el token—
 * la pantalla se entera sin recargar.
 */
import type { Tokens } from "./tipos"

const CLAVE = "dentalmaster.sesion"

const oyentes = new Set<() => void>()

function avisar(): void {
  for (const oyente of oyentes) oyente()
}

/** Para `useSyncExternalStore`: llama al oyente cada vez que cambia la sesión. */
export function suscribirSesion(oyente: () => void): () => void {
  oyentes.add(oyente)
  // Otra pestaña del mismo equipo también puede abrir o cerrar la sesión.
  const alCambiar = (evento: StorageEvent) => {
    if (evento.key === CLAVE || evento.key === null) oyente()
  }
  window.addEventListener("storage", alCambiar)
  return () => {
    oyentes.delete(oyente)
    window.removeEventListener("storage", alCambiar)
  }
}

export function haySesion(): boolean {
  return localStorage.getItem(CLAVE) !== null
}

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
  avisar()
}

export function limpiarSesion(): void {
  localStorage.removeItem(CLAVE)
  avisar()
}
