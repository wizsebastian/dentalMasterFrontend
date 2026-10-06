import type { ReactNode } from "react"

export type Pestana<T extends string> = { id: T; etiqueta: string; cuenta?: number }

export function Pestanas<T extends string>({
  pestanas,
  activa,
  alCambiar,
  accion,
}: {
  pestanas: readonly Pestana<T>[]
  activa: T
  alCambiar: (id: T) => void
  /** Botón que acompaña a la barra, alineado a la derecha. */
  accion?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-linea">
      <nav className="-mb-px flex gap-1" role="tablist">
        {pestanas.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={activa === item.id}
            onClick={() => alCambiar(item.id)}
            className={`border-b-2 px-3 py-2 text-sm transition-colors ${
              activa === item.id
                ? "border-marca font-medium text-marca"
                : "border-transparent text-tinta-suave hover:text-tinta"
            }`}
          >
            {item.etiqueta}
            {item.cuenta !== undefined && (
              <span className="tabular ml-1.5 text-xs text-tinta-suave">{item.cuenta}</span>
            )}
          </button>
        ))}
      </nav>
      {accion && <div className="pb-2">{accion}</div>}
    </div>
  )
}
