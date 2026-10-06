import { useState } from "react"
import { Check, MousePointerClick, X } from "lucide-react"

import type { CondicionDental, EstadoHallazgo } from "../../api/tipos"

const ESTADOS: { valor: EstadoHallazgo; etiqueta: string }[] = [
  { valor: "existente", etiqueta: "Existente" },
  { valor: "planificado", etiqueta: "Planificado" },
  { valor: "en_proceso", etiqueta: "En proceso" },
  { valor: "completado", etiqueta: "Completado" },
]

/**
 * Las 35 condiciones no caben a la vista sin estorbar. Se reparten en pestañas:
 * lo que se encuentra (hallazgos) y lo que se hace, por tipo de tratamiento.
 */
const CATEGORIAS: { id: string; etiqueta: string; incluye: (c: CondicionDental) => boolean }[] = [
  { id: "hallazgos", etiqueta: "Hallazgos", incluye: (c) => c.patologico },
  {
    id: "restauracion",
    etiqueta: "Restauraciones",
    incluye: (c) => !c.patologico && c.ambito === "superficie",
  },
  { id: "endodoncia", etiqueta: "Endodoncia", incluye: (c) => !c.patologico && c.ambito === "raiz" },
  {
    id: "protesis",
    etiqueta: "Prótesis e implantes",
    incluye: (c) => !c.patologico && c.ambito === "protesico",
  },
  {
    id: "otros",
    etiqueta: "Otros",
    incluye: (c) => !c.patologico && (c.ambito === "diente" || c.ambito === "periodontal"),
  },
]

type PaletaProps = {
  condiciones: CondicionDental[]
  condicionElegida: CondicionDental | null
  estadoElegido: EstadoHallazgo
  onElegirCondicion: (condicion: CondicionDental | null) => void
  onElegirEstado: (estado: EstadoHallazgo) => void
}

const CHIP = "rounded-lg border px-2.5 py-1 text-xs transition-colors"
// Lo elegido se ve de lejos: relleno de marca, no sólo un borde.
const ACTIVO = "border-marca bg-marca text-esmalte"
const INACTIVO = "border-linea hover:border-linea-fuerte"

/** Selector de qué se va a registrar al hacer clic en una cara. */
export function PaletaCondiciones({
  condiciones,
  condicionElegida,
  estadoElegido,
  onElegirCondicion,
  onElegirEstado,
}: PaletaProps) {
  const categorias = CATEGORIAS.map((categoria) => ({
    ...categoria,
    lista: condiciones.filter(categoria.incluye),
  })).filter((categoria) => categoria.lista.length > 0)

  const [abierta, setAbierta] = useState(categorias[0]?.id)
  const actual = categorias.find((c) => c.id === abierta) ?? categorias[0]

  function elegirCategoria(id: string) {
    setAbierta(id)
    // Un hallazgo se anota como existente; un tratamiento, como hecho.
    onElegirEstado(id === "hallazgos" ? "existente" : "completado")
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Tipo de condición" className="flex flex-wrap gap-1.5">
          {categorias.map((categoria) => (
            <button
              key={categoria.id}
              type="button"
              role="tab"
              aria-selected={categoria.id === actual?.id}
              onClick={() => elegirCategoria(categoria.id)}
              className={`${CHIP} font-medium ${categoria.id === actual?.id ? ACTIVO : INACTIVO}`}
            >
              {categoria.etiqueta}
              <span className="tabular ml-1.5 text-tinta-suave">{categoria.lista.length}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-tinta-suave">Se registra como</span>
          {ESTADOS.map((estado) => (
            <button
              key={estado.valor}
              type="button"
              onClick={() => onElegirEstado(estado.valor)}
              aria-pressed={estadoElegido === estado.valor}
              className={`${CHIP} ${estadoElegido === estado.valor ? ACTIVO : INACTIVO}`}
            >
              {estado.etiqueta}
            </button>
          ))}
        </div>
      </div>

      <div role="tabpanel" className="flex flex-wrap gap-1.5">
        {(actual?.lista ?? []).map((condicion) => {
          const activa = condicionElegida?.id === condicion.id
          return (
            <button
              key={condicion.id}
              type="button"
              onClick={() => onElegirCondicion(activa ? null : condicion)}
              aria-pressed={activa}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs
                transition-colors ${activa ? `${ACTIVO} font-semibold` : INACTIVO}`}
            >
              {activa ? (
                <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
              ) : (
                <span
                  className="h-3 w-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: condicion.color_hex }}
                  aria-hidden
                />
              )}
              {condicion.nombre}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const NOMBRE_ESTADO: Record<EstadoHallazgo, string> = {
  existente: "Existente",
  planificado: "Planificado",
  en_proceso: "En proceso",
  completado: "Completado",
  anulado: "Anulado",
}

/**
 * Lo que se va a registrar al pulsar el dibujo, dicho con todas las letras: la
 * condición con su color, el estado y a dónde hay que pulsar. Está siempre sobre
 * el dibujo, porque «qué pincel tengo» es lo que más se olvida.
 */
export function BarraPincel({
  condicion,
  estado,
  alSoltar,
}: {
  condicion: CondicionDental | null
  estado: EstadoHallazgo
  alSoltar: () => void
}) {
  if (!condicion) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-linea-fuerte px-3 py-2.5 text-sm text-tinta-suave">
        <MousePointerClick className="h-5 w-5 shrink-0" aria-hidden />
        <span>
          <b className="text-tinta">Elige una condición</b> de la lista para empezar a marcar el
          odontograma.
        </span>
      </div>
    )
  }

  const deCara = condicion.ambito === "superficie"
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border-2 border-marca bg-marca-tenue px-3 py-2.5 text-sm"
    >
      <span className="flex items-center gap-2">
        <span
          className="h-6 w-6 shrink-0 rounded-md border border-black/10"
          style={{ backgroundColor: condicion.color_hex }}
          aria-hidden
        />
        <span>
          Pincel: <b>{condicion.nombre}</b> · {NOMBRE_ESTADO[estado]}
        </span>
      </span>
      <span className="text-tinta-suave">
        {deCara
          ? "Pulsa una cara del diente. Si la cara ya la tiene, se quita."
          : "Pulsa cualquier parte del diente: se registra en la pieza completa. Si ya la tiene, se quita."}
      </span>
      <button
        type="button"
        onClick={alSoltar}
        className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-tinta-suave hover:bg-superficie hover:text-tinta"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
        Soltar pincel
      </button>
    </div>
  )
}
