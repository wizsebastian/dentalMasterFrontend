import { aFechaISO } from "../agenda/tiempo"
import { esteAnio, esteMes, mesPasado, mismoTramo, type Tramo } from "./tramos"

const ENTRADA = "mt-1 rounded-lg border border-linea-fuerte bg-superficie px-3 py-1.5 text-sm"

/** Desde y hasta, con los tramos que se piden siempre a un clic. */
export function SelectorTramo({ tramo, alCambiar }: { tramo: Tramo; alCambiar: (tramo: Tramo) => void }) {
  const hoy = aFechaISO(new Date())
  const atajos = [
    { etiqueta: "Este mes", tramo: esteMes() },
    { etiqueta: "Mes pasado", tramo: mesPasado() },
    { etiqueta: "Este año", tramo: esteAnio() },
  ]

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="text-sm">
        <span className="block text-xs text-tinta-suave">Desde</span>
        <input
          type="date"
          value={tramo.desde}
          max={hoy}
          onChange={(e) => e.target.value && alCambiar({ ...tramo, desde: e.target.value })}
          className={ENTRADA}
        />
      </label>
      <label className="text-sm">
        <span className="block text-xs text-tinta-suave">Hasta</span>
        <input
          type="date"
          value={tramo.hasta}
          max={hoy}
          onChange={(e) => e.target.value && alCambiar({ ...tramo, hasta: e.target.value })}
          className={ENTRADA}
        />
      </label>
      <div className="flex flex-wrap gap-1.5">
        {atajos.map((atajo) => {
          const activo = mismoTramo(atajo.tramo, tramo)
          return (
            <button
              key={atajo.etiqueta}
              type="button"
              aria-pressed={activo}
              onClick={() => alCambiar(atajo.tramo)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                activo
                  ? "border-marca bg-marca-tenue font-medium text-marca"
                  : "border-linea-fuerte text-tinta-suave hover:text-tinta"
              }`}
            >
              {atajo.etiqueta}
            </button>
          )
        })}
      </div>
    </div>
  )
}
