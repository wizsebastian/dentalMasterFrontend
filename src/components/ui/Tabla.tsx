import type { ReactNode } from "react"

export type Columna<F> = {
  id: string
  titulo: string
  celda: (fila: F) => ReactNode
  /** Cifras y acciones van a la derecha. */
  alinear?: "izquierda" | "derecha"
  className?: string
}

/** Tabla de datos. La paginación es un componente aparte: no todas la llevan. */
export function Tabla<F>({
  columnas,
  filas,
  clave,
  atenuada = false,
  claseFila,
}: {
  columnas: Columna<F>[]
  filas: F[]
  clave: (fila: F) => string | number
  /** Mientras llega la página siguiente se atenúa la actual en vez de vaciarla. */
  atenuada?: boolean
  claseFila?: (fila: F) => string | undefined
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-linea text-left text-tinta-suave">
          <tr>
            {columnas.map((columna) => (
              <th
                key={columna.id}
                scope="col"
                className={`px-4 py-2.5 font-medium ${columna.alinear === "derecha" ? "text-right" : ""}`}
              >
                {columna.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={atenuada ? "opacity-60 transition-opacity" : undefined}>
          {filas.map((fila) => (
            <tr
              key={clave(fila)}
              className={`border-b border-linea last:border-0 hover:bg-esmalte ${claseFila?.(fila) ?? ""}`}
            >
              {columnas.map((columna) => (
                <td
                  key={columna.id}
                  className={`px-4 py-2.5 ${columna.alinear === "derecha" ? "text-right" : ""} ${columna.className ?? ""}`}
                >
                  {columna.celda(fila)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Paginacion({
  offset,
  limite,
  total,
  alCambiar,
}: {
  offset: number
  limite: number
  total: number
  alCambiar: (offset: number) => void
}) {
  if (total <= limite) return null

  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <span className="tabular text-tinta-suave">
        {offset + 1}–{Math.min(offset + limite, total)} de {total}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => alCambiar(Math.max(0, offset - limite))}
          disabled={offset === 0}
          className="rounded-lg border border-linea-fuerte px-3 py-1.5 disabled:opacity-40"
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={() => alCambiar(offset + limite)}
          disabled={offset + limite >= total}
          className="rounded-lg border border-linea-fuerte px-3 py-1.5 disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}
