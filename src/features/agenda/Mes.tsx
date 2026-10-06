import type { Cita } from "../../api/tipos"
import { hora } from "../../lib/formato"
import type { MapaEstados } from "./mapaEstados"
import { aFechaISO, diaCorto, mismoDia, sumarDias } from "./tiempo"

const VISIBLES = 3

/**
 * El mes de un vistazo: seis semanas, con las primeras citas de cada día.
 *
 * Sirve para ver cómo viene de cargado el mes y saltar a un día; agendar y
 * mover citas se hace en la semana o en el día.
 */
export function Mes({
  desde,
  mes,
  citas,
  estados,
  alElegirCita,
  alElegirDia,
}: {
  /** El lunes de la primera semana que se pinta. */
  desde: Date
  /** El mes al que pertenece la vista: lo de fuera se atenúa. */
  mes: number
  citas: Cita[]
  estados: MapaEstados
  alElegirCita: (cita: Cita) => void
  alElegirDia: (dia: Date) => void
}) {
  const hoy = new Date()
  const porDia = new Map<string, Cita[]>()
  for (const cita of citas) {
    const clave = aFechaISO(new Date(cita.inicio))
    porDia.set(clave, [...(porDia.get(clave) ?? []), cita])
  }
  const dias = Array.from({ length: 42 }, (_, i) => sumarDias(desde, i))

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[44rem]">
        <div className="grid grid-cols-7 border-b border-linea text-xs text-tinta-suave">
          {dias.slice(0, 7).map((dia) => (
            <div key={dia.getDay()} className="px-2 py-1.5 capitalize">
              {diaCorto(dia)}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {dias.map((dia) => {
            const delDia = porDia.get(aFechaISO(dia)) ?? []
            const vivas = delDia.filter((c) => estados.get(c.estado)?.ocupa_agenda !== false)
            const fuera = dia.getMonth() !== mes
            const esHoy = mismoDia(dia, hoy)
            return (
              <div
                key={aFechaISO(dia)}
                className={`min-h-28 border-b border-r border-linea p-1.5 [&:nth-child(7n)]:border-r-0 ${
                  fuera ? "bg-esmalte/60" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => alElegirDia(dia)}
                  aria-label={`Ver el día ${dia.getDate()}`}
                  className={`tabular rounded-md px-1.5 text-sm hover:bg-marca-tenue ${
                    esHoy ? "bg-marca font-semibold text-esmalte hover:bg-marca-viva" : ""
                  } ${fuera ? "text-tinta-suave" : ""}`}
                >
                  {dia.getDate()}
                </button>
                <ul className="mt-1 space-y-0.5">
                  {vivas.slice(0, VISIBLES).map((cita) => (
                    <li key={cita.id}>
                      <button
                        type="button"
                        onClick={() => alElegirCita(cita)}
                        className="flex w-full items-center gap-1.5 rounded px-1 text-left text-xs hover:bg-marca-tenue"
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: estados.get(cita.estado)?.color_hex }}
                          aria-hidden
                        />
                        <span className="tabular shrink-0 text-tinta-suave">{hora(cita.inicio)}</span>
                        <span className="truncate">{cita.paciente_nombre}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                {vivas.length > VISIBLES && (
                  <button
                    type="button"
                    onClick={() => alElegirDia(dia)}
                    className="mt-0.5 px-1 text-xs text-tinta-suave hover:text-marca"
                  >
                    +{vivas.length - VISIBLES} más
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
