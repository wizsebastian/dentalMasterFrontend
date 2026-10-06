import { useSyncExternalStore } from "react"

import type { Onboarding } from "../../api/tipos"
import { PASOS } from "./pasos"

/**
 * Los pasos se hacen uno a uno: el siguiente queda cerrado hasta que el
 * anterior está hecho o, si es opcional, se deja a propósito («Omitir este
 * paso»). Lo omitido se recuerda en este navegador; lo hecho sale de los datos.
 */
const CLAVE = "dentalmaster.guia.omitidos"
const oyentes = new Set<() => void>()
let cache: string | null = null
let omitidos: string[] = []

function leer(): string[] {
  let crudo: string | null = null
  try {
    crudo = localStorage.getItem(CLAVE)
  } catch {
    // sin almacenamiento: se queda lo que haya en memoria
    return omitidos
  }
  if (crudo !== cache) {
    cache = crudo
    try {
      omitidos = crudo ? (JSON.parse(crudo) as string[]) : []
    } catch {
      omitidos = []
    }
  }
  return omitidos
}

export function omitirPaso(id: string): void {
  const nuevos = [...new Set([...leer(), id])]
  omitidos = nuevos
  try {
    localStorage.setItem(CLAVE, JSON.stringify(nuevos))
    cache = localStorage.getItem(CLAVE)
  } catch {
    // se queda en memoria
  }
  for (const oyente of oyentes) oyente()
}

function suscribir(oyente: () => void): () => void {
  oyentes.add(oyente)
  return () => oyentes.delete(oyente)
}

export interface Avance {
  /** Índice del primer paso que aún no está hecho ni omitido (el que toca). */
  turno: number
  /** Un paso está cerrado mientras algún anterior siga pendiente. */
  cerrado: (id: string) => boolean
}

export function useAvance(guia: Onboarding | undefined): Avance {
  const omitidosAhora = useSyncExternalStore(suscribir, leer)
  const hechos = new Set(guia?.pasos.filter((p) => p.hecho).map((p) => p.id))
  const idx = PASOS.findIndex((p) => !hechos.has(p.id) && !omitidosAhora.includes(p.id))
  const turno = idx === -1 ? PASOS.length : idx
  return {
    turno,
    cerrado: (id) => PASOS.findIndex((p) => p.id === id) > turno,
  }
}
