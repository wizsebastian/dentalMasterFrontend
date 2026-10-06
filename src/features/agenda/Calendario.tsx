import { useEffect, useMemo, useState, type MouseEvent } from "react"

import type { Cita } from "../../api/tipos"
import { hora } from "../../lib/formato"
import type { MapaEstados } from "./mapaEstados"
import {
  HORA_FIN,
  HORA_INICIO,
  MINUTOS_REJILLA,
  minutosDesdeApertura,
  mismoDia,
} from "./tiempo"

/** Píxeles por minuto: una cita de 30 minutos mide 36 px, lo justo para dos líneas. */
const PPM = 1.2
const ALTO = MINUTOS_REJILLA * PPM
const HORAS = Array.from({ length: HORA_FIN - HORA_INICIO + 1 }, (_, i) => HORA_INICIO + i)

export type Columna = {
  id: string
  titulo: string
  subtitulo?: string
  /** Día al que pertenece la columna: decide dónde cae un clic y la línea de «ahora». */
  dia: Date
  citas: Cita[]
  /** Lo que se prellena al agendar desde esta columna. */
  doctorId?: number
  unidadId?: number
}

type Colocada = { cita: Cita; carril: number; carriles: number }

/**
 * Reparte en carriles las citas que coinciden en el tiempo.
 *
 * Sólo pasa con los sobrecupos y con las canceladas, que siguen dibujándose:
 * cada grupo de citas encadenadas se divide el ancho de la columna.
 */
function colocar(citas: Cita[]): Colocada[] {
  const ordenadas = [...citas].sort((a, b) => a.inicio.localeCompare(b.inicio))
  const resultado: Colocada[] = []
  let grupo: Colocada[] = []
  let finDelGrupo = ""
  let finDeCarril: string[] = []

  function cerrar() {
    for (const colocada of grupo) colocada.carriles = finDeCarril.length
    resultado.push(...grupo)
    grupo = []
    finDeCarril = []
  }

  for (const cita of ordenadas) {
    if (grupo.length > 0 && cita.inicio >= finDelGrupo) cerrar()
    let carril = finDeCarril.findIndex((fin) => fin <= cita.inicio)
    if (carril === -1) carril = finDeCarril.length
    finDeCarril[carril] = cita.fin
    grupo.push({ cita, carril, carriles: 1 })
    if (cita.fin > finDelGrupo) finDelGrupo = cita.fin
  }
  cerrar()
  return resultado
}

/** Minuto actual, para la línea de «ahora». Se refresca solo. */
function useAhora(): Date {
  const [ahora, setAhora] = useState(() => new Date())
  useEffect(() => {
    const reloj = setInterval(() => setAhora(new Date()), 60_000)
    return () => clearInterval(reloj)
  }, [])
  return ahora
}

/**
 * Rejilla horaria. Sirve igual para la semana (una columna por día) que para el
 * día (una columna por doctor o por sillón): sólo cambia qué es cada columna.
 *
 * El color de un bloque es el **estado** de la cita, con el tono que da la API.
 */
export function Calendario({
  columnas,
  estados,
  alElegirCita,
  alElegirHueco,
}: {
  columnas: Columna[]
  estados: MapaEstados
  alElegirCita: (cita: Cita) => void
  /** Clic en un hueco libre: agenda ahí. Sin él, la rejilla es de sólo lectura. */
  alElegirHueco?: (inicio: Date, columna: Columna) => void
}) {
  const ahora = useAhora()
  const colocadas = useMemo(() => columnas.map((c) => colocar(c.citas)), [columnas])

  function alPulsarColumna(evento: MouseEvent<HTMLDivElement>, columna: Columna) {
    if (!alElegirHueco || evento.target !== evento.currentTarget) return
    const y = evento.clientY - evento.currentTarget.getBoundingClientRect().top
    // Se redondea al cuarto de hora anterior: nadie agenda a las 10:07.
    const minutos = Math.floor(y / PPM / 15) * 15
    const inicio = new Date(columna.dia)
    inicio.setHours(HORA_INICIO, minutos, 0, 0)
    alElegirHueco(inicio, columna)
  }

  const plantilla = { gridTemplateColumns: `3.5rem repeat(${columnas.length}, minmax(7rem, 1fr))` }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max lg:min-w-0">
        <div className="grid border-b border-linea" style={plantilla}>
          <div />
          {columnas.map((columna) => {
            const hoy = mismoDia(columna.dia, ahora) && columnas.length > 1 && !columna.doctorId && !columna.unidadId
            return (
              <div
                key={columna.id}
                className={`border-l border-linea px-2 py-2 text-center text-sm ${hoy ? "bg-marca-tenue" : ""}`}
              >
                <span className={hoy ? "font-semibold text-marca" : "font-medium"}>
                  {columna.titulo}
                </span>
                {columna.subtitulo && (
                  <span className="block text-xs text-tinta-suave">{columna.subtitulo}</span>
                )}
              </div>
            )
          })}
        </div>

        <div className="grid" style={plantilla}>
          <div className="relative" style={{ height: ALTO }} aria-hidden>
            {HORAS.slice(0, -1).map((h) => (
              <span
                key={h}
                className="tabular absolute right-2 -translate-y-1/2 text-xs text-tinta-suave"
                style={{ top: (h - HORA_INICIO) * 60 * PPM }}
              >
                {h > HORA_INICIO && (h <= 12 ? `${h} ${h === 12 ? "p. m." : "a. m."}` : `${h - 12} p. m.`)}
              </span>
            ))}
          </div>

          {columnas.map((columna, i) => {
            const esHoy = mismoDia(columna.dia, ahora)
            const minutoActual = minutosDesdeApertura(ahora)

            return (
              <div
                key={columna.id}
                onClick={(e) => alPulsarColumna(e, columna)}
                className={`relative border-l border-linea ${alElegirHueco ? "cursor-cell" : ""}`}
                style={{
                  height: ALTO,
                  // Una raya por hora y otra, más tenue, por media hora.
                  backgroundImage:
                    "linear-gradient(to bottom, var(--color-linea) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--color-linea) 45%, transparent) 1px, transparent 1px)",
                  backgroundSize: `100% ${60 * PPM}px, 100% ${30 * PPM}px`,
                }}
              >
                {esHoy && minutoActual >= 0 && minutoActual <= MINUTOS_REJILLA && (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-marca"
                    style={{ top: minutoActual * PPM }}
                    aria-hidden
                  />
                )}

                {colocadas[i].map(({ cita, carril, carriles }) => {
                  const inicio = new Date(cita.inicio)
                  const fin = new Date(cita.fin)
                  const arriba = Math.max(minutosDesdeApertura(inicio), 0)
                  const abajo = Math.min(minutosDesdeApertura(fin), MINUTOS_REJILLA)
                  if (abajo <= 0 || arriba >= MINUTOS_REJILLA) return null

                  const estado = estados.get(cita.estado)
                  const color = estado?.color_hex ?? "var(--color-tinta-suave)"
                  const liberada = estado ? !estado.ocupa_agenda : false

                  return (
                    <button
                      key={cita.id}
                      type="button"
                      onClick={() => alElegirCita(cita)}
                      title={`${hora(cita.inicio)} – ${hora(cita.fin)} · ${cita.paciente_nombre} · ${estado?.etiqueta ?? cita.estado}`}
                      className={`absolute overflow-hidden rounded-md border-l-[3px] px-1.5 py-0.5 text-left text-xs
                        leading-tight transition-shadow hover:z-20 hover:shadow-md ${liberada ? "opacity-55" : ""}`}
                      style={{
                        top: arriba * PPM + 1,
                        height: Math.max((abajo - arriba) * PPM - 2, 20),
                        left: `calc(${(carril / carriles) * 100}% + 2px)`,
                        width: `calc(${100 / carriles}% - 4px)`,
                        borderLeftColor: color,
                        backgroundColor: `color-mix(in srgb, ${color} 10%, var(--color-superficie))`,
                      }}
                    >
                      <span className={`block truncate font-medium ${liberada ? "line-through" : ""}`}>
                        {cita.paciente_nombre}
                      </span>
                      <span className="tabular block truncate text-tinta-suave">
                        {hora(cita.inicio)}
                        {cita.sobrecupo && " · sobrecupo"}
                        {cita.servicio_nombre && ` · ${cita.servicio_nombre}`}
                      </span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
