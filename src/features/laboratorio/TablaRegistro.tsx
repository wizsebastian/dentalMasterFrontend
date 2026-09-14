import { Trash2 } from "lucide-react"

import { Vacio } from "../../components/ui"
import type { Anotacion } from "./useRegistro"

type Props = {
  anotaciones: Anotacion[]
  onQuitar: (anotacion: Anotacion) => void
}

/**
 * Lo marcado en el odontograma, para poder quitar lo que no haga falta.
 *
 * Quitar una fila no la borra sólo de la lista: deshace la notación en el
 * lienzo llamando a su inversa sobre las mismas piezas.
 */
export function TablaRegistro({ anotaciones, onQuitar }: Props) {
  if (anotaciones.length === 0) {
    return (
      <Vacio
        titulo="Todavía no has marcado nada"
        descripcion="Lo que registres en el odontograma aparecerá aquí, y podrás quitarlo."
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-linea text-left text-tinta-suave">
          <tr>
            <th className="px-3 py-2 font-medium">Piezas</th>
            <th className="px-3 py-2 font-medium">Notación</th>
            <th className="px-3 py-2 font-medium">Dónde</th>
            <th className="px-3 py-2 font-medium">Hora</th>
            <th className="w-10 px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {anotaciones.map((a) => (
            <tr key={a.id} className="border-b border-linea last:border-0">
              <td className="px-3 py-2">
                <span className="flex flex-wrap gap-1">
                  {a.piezas.map((p) => (
                    <span
                      key={p}
                      className="tabular rounded bg-esmalte px-1.5 py-0.5 font-mono text-[11px]"
                    >
                      {p}
                    </span>
                  ))}
                </span>
              </td>

              <td className="px-3 py-2">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: a.notacion.color === "rojo" ? "#C62828" : "#1565C0" }}
                    aria-hidden
                  />
                  {a.notacion.etiqueta}
                  {a.etiquetaValor && (
                    <span className="text-tinta-suave">· {a.etiquetaValor}</span>
                  )}
                </span>
              </td>

              <td className="px-3 py-2 text-tinta-suave">
                {a.cara ? (
                  <>
                    cara <span className="font-mono">{a.cara}</span>
                  </>
                ) : (
                  "pieza completa"
                )}
              </td>

              <td className="tabular px-3 py-2 font-mono text-[11px] text-tinta-suave">
                {a.cuando}
              </td>

              <td className="px-3 py-2">
                <button
                  type="button"
                  onClick={() => onQuitar(a)}
                  title="Quitarlo del odontograma"
                  aria-label={`Quitar ${a.notacion.etiqueta} de ${a.piezas.join(", ")}`}
                  className="rounded p-1 text-tinta-suave transition-colors hover:bg-esmalte hover:text-tinta"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
