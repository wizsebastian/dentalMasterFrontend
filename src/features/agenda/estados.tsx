import type { Cita, ValorEstadoCita } from "../../api/tipos"
import {
  Insignia,
  SelectorFiltro,
} from "../../components/ui"
import type { MapaEstados } from "./mapaEstados"

/** El estado de una cita, con la etiqueta y el color que da la API. */
export function InsigniaEstado({ estado, estados }: { estado: ValorEstadoCita; estados: MapaEstados }) {
  const dato = estados.get(estado)
  return <Insignia color={dato?.color_hex}>{dato?.etiqueta ?? estado}</Insignia>
}

/**
 * Cambio de estado en la propia fila.
 *
 * Sólo ofrece los estados a los que la cita puede pasar, que los dice la API
 * (`cita.siguientes`): la interfaz no repite la tabla de transiciones.
 */
export function SelectorEstado({
  cita,
  estados,
  alCambiar,
  deshabilitado = false,
}: {
  cita: Cita
  estados: MapaEstados
  alCambiar: (estado: ValorEstadoCita) => void
  deshabilitado?: boolean
}) {
  const actual = estados.get(cita.estado)

  if (cita.siguientes.length === 0 || deshabilitado) {
    return <InsigniaEstado estado={cita.estado} estados={estados} />
  }

  return (
    <SelectorFiltro
      value={cita.estado}
      onChange={(e) => alCambiar(e.target.value as ValorEstadoCita)}
      aria-label={`Estado de la cita de ${cita.paciente_nombre}`}
      claseCaja="rounded-md border px-1.5 py-0.5 text-xs font-medium"
      estiloCaja={
        actual
          ? {
              color: actual.color_hex,
              borderColor: `color-mix(in srgb, ${actual.color_hex} 35%, transparent)`,
              backgroundColor: `color-mix(in srgb, ${actual.color_hex} 8%, transparent)`,
            }
          : undefined
      }
    >
      <option value={cita.estado}>{actual?.etiqueta ?? cita.estado}</option>
      {cita.siguientes.map((valor) => (
        <option key={valor} value={valor}>
          → {estados.get(valor)?.etiqueta ?? valor}
        </option>
      ))}
    </SelectorFiltro>
  )
}
