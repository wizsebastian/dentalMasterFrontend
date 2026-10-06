import { useId, useState, type KeyboardEvent, type ReactNode } from "react"
import { Search } from "lucide-react"

export type Opcion = { id: number | string; titulo: string; detalle?: ReactNode }

/**
 * Caja de búsqueda con lista de resultados.
 *
 * Quien la usa trae las opciones (normalmente de una consulta que depende del
 * texto); aquí sólo vive el teclado: flechas para moverse, Enter para elegir.
 */
export function Combobox({
  etiqueta,
  texto,
  alEscribir,
  opciones,
  alElegir,
  cargando = false,
  placeholder,
  vacio = "Sin resultados",
  autoFocus = false,
}: {
  etiqueta: string
  texto: string
  alEscribir: (texto: string) => void
  opciones: Opcion[]
  alElegir: (opcion: Opcion) => void
  cargando?: boolean
  placeholder?: string
  vacio?: string
  autoFocus?: boolean
}) {
  const lista = useId()
  const [activa, setActiva] = useState(0)
  const indice = Math.min(activa, Math.max(opciones.length - 1, 0))

  function alTeclear(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiva(Math.min(indice + 1, opciones.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiva(Math.max(indice - 1, 0))
    } else if (e.key === "Enter" && opciones[indice]) {
      e.preventDefault()
      alElegir(opciones[indice])
    }
  }

  return (
    <div>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-suave"
          aria-hidden
        />
        <input
          type="search"
          role="combobox"
          aria-label={etiqueta}
          aria-expanded={opciones.length > 0}
          aria-controls={lista}
          aria-activedescendant={opciones[indice] ? `${lista}-${opciones[indice].id}` : undefined}
          autoFocus={autoFocus}
          value={texto}
          onChange={(e) => {
            alEscribir(e.target.value)
            setActiva(0)
          }}
          onKeyDown={alTeclear}
          placeholder={placeholder}
          className="block w-full rounded-lg border border-linea-fuerte bg-superficie py-2 pl-9 pr-3 text-sm placeholder:text-tinta-suave/60"
        />
      </div>

      <ul id={lista} role="listbox" aria-label={etiqueta} className="mt-2 max-h-80 overflow-y-auto">
        {opciones.map((opcion, i) => (
          <li
            key={opcion.id}
            id={`${lista}-${opcion.id}`}
            role="option"
            aria-selected={i === indice}
            onMouseEnter={() => setActiva(i)}
            onClick={() => alElegir(opcion)}
            className={`cursor-pointer rounded-lg px-3 py-2 text-sm ${i === indice ? "bg-marca-tenue" : ""}`}
          >
            <span className="font-medium">{opcion.titulo}</span>
            {opcion.detalle && <span className="ml-2 text-tinta-suave">{opcion.detalle}</span>}
          </li>
        ))}
      </ul>

      {texto.trim() && opciones.length === 0 && (
        <p className="px-3 py-2 text-sm text-tinta-suave">{cargando ? "Buscando…" : vacio}</p>
      )}
    </div>
  )
}
