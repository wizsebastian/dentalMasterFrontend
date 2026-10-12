import { useCallback, useEffect, useRef, useState } from "react"

import type { GuiaEstado } from "../../api/tipos"
import { guardarGeneralGuia, guardarPasoGuia } from "./consultas"

export type Respuesta = { estado: GuiaEstado; nota: string }
export type EstadoGuardado = "guardado" | "guardando" | "pendiente"

const GENERAL = "__general"
const ESPERA_MS = 600

type Pendiente = Record<string, Respuesta | string>

const claveRespaldo = (codigo: string) => `dentalmaster.guia.pendiente.${codigo}`

export function leerRespaldo(codigo: string): Pendiente {
  try {
    return JSON.parse(localStorage.getItem(claveRespaldo(codigo)) ?? "{}") as Pendiente
  } catch {
    return {}
  }
}

function escribirRespaldo(codigo: string, pendiente: Pendiente) {
  try {
    if (Object.keys(pendiente).length === 0) localStorage.removeItem(claveRespaldo(codigo))
    else localStorage.setItem(claveRespaldo(codigo), JSON.stringify(pendiente))
  } catch {
    /* sin almacenamiento: se guarda igual en la API */
  }
}

/**
 * Guarda lo que la persona marca y escribe, sin botón de guardar.
 *
 * Cada cambio se apunta primero en `localStorage` (por si se corta la red o se
 * cierra la pestaña), se envía tras una pausa corta y sólo se descarta del
 * respaldo cuando la API confirma. Lo pendiente se reintenta al volver la red
 * y al abrir la guía de nuevo.
 */
export function useGuardado(codigo: string) {
  const [estado, setEstado] = useState<EstadoGuardado>("guardado")
  const pendiente = useRef<Pendiente>({})
  const temporizadores = useRef(new Map<string, number>())
  const enVuelo = useRef(0)

  const enviar = useCallback(
    async (clave: string) => {
      const valor = pendiente.current[clave]
      if (valor === undefined) return
      enVuelo.current += 1
      setEstado("guardando")
      try {
        if (clave === GENERAL) await guardarGeneralGuia(codigo, valor as string)
        else await guardarPasoGuia(codigo, clave, valor as Respuesta)
        // Si cambió mientras viajaba, se queda: saldrá en el siguiente envío.
        if (pendiente.current[clave] === valor) delete pendiente.current[clave]
        escribirRespaldo(codigo, pendiente.current)
      } catch {
        setEstado("pendiente")
      } finally {
        enVuelo.current -= 1
        if (enVuelo.current === 0 && Object.keys(pendiente.current).length === 0) {
          setEstado("guardado")
        }
      }
    },
    [codigo],
  )

  const reintentar = useCallback(() => {
    for (const clave of Object.keys(pendiente.current)) void enviar(clave)
  }, [enviar])

  const programar = useCallback(
    (clave: string, valor: Respuesta | string, espera = ESPERA_MS) => {
      pendiente.current[clave] = valor
      escribirRespaldo(codigo, pendiente.current)
      setEstado("guardando")
      window.clearTimeout(temporizadores.current.get(clave))
      temporizadores.current.set(
        clave,
        window.setTimeout(() => void enviar(clave), espera),
      )
    },
    [codigo, enviar],
  )

  useEffect(() => {
    const alVolver = () => reintentar()
    window.addEventListener("online", alVolver)
    // Al abrir la guía, lo que quedó sin enviar en una sesión anterior sale de inmediato.
    pendiente.current = { ...leerRespaldo(codigo), ...pendiente.current }
    if (Object.keys(pendiente.current).length > 0) reintentar()
    const lista = temporizadores.current
    return () => {
      window.removeEventListener("online", alVolver)
      lista.forEach((t) => window.clearTimeout(t))
    }
  }, [codigo, reintentar])

  return {
    estado,
    reintentar,
    guardarPaso: (pasoId: string, r: Respuesta, espera?: number) => programar(pasoId, r, espera),
    guardarGeneral: (texto: string) => programar(GENERAL, texto),
  }
}

export { GENERAL }
