import { useEffect, useRef, useState } from "react"
import { Plus, X } from "lucide-react"

import { CARAS, NOTACIONES, PENDIENTES, type Notacion } from "./notaciones"
import type { Seleccion } from "./useSeleccionPiezas"

const ANCHO = 300
const MARGEN = 14

/**
 * Coloca el menú **al lado** de la selección, no encima.
 *
 * Debajo era lo natural, pero tapaba media arcada: justo las piezas que se
 * están comparando. Se prueba a la derecha, luego a la izquierda, y sólo si no
 * cabe en ninguna se recurre a debajo.
 */
function situar(caja: DOMRect, alto: number) {
  const derecha = caja.right + MARGEN
  const izquierda = caja.left - ANCHO - MARGEN

  const left =
    derecha + ANCHO + MARGEN < window.innerWidth
      ? derecha
      : izquierda > MARGEN
        ? izquierda
        : Math.min(
            Math.max(MARGEN, caja.left + caja.width / 2 - ANCHO / 2),
            window.innerWidth - ANCHO - MARGEN,
          )

  // Centrado con la selección, sin salirse por arriba ni por abajo.
  const top = Math.min(
    Math.max(MARGEN, caja.top + caja.height / 2 - alto / 2),
    Math.max(MARGEN, window.innerHeight - alto - MARGEN),
  )

  return { top, left }
}

type Props = {
  seleccion: Seleccion & { quitar: (pieza: number) => void }
  /** Modo acumulativo: cada clic suma una pieza, sin usar CMD. */
  acumular: boolean
  onAcumular: (activo: boolean) => void
  /** Qué se aplicó, para que quede registrado y se pueda quitar. */
  onAplicado: (entrada: {
    piezas: number[]
    notacion: Notacion
    cara?: string
    valor?: string
    etiquetaValor?: string
  }) => void
}

export function MenuNotaciones({ seleccion, acumular, onAcumular, onAplicado }: Props) {
  const { piezas, caja, quitar } = seleccion
  const ref = useRef<HTMLDivElement>(null)
  const [alto, setAlto] = useState(420)
  const [cara, setCara] = useState("O")

  useEffect(() => {
    if (ref.current) setAlto(ref.current.offsetHeight)
  }, [piezas.length])

  if (piezas.length === 0 || !caja) return null

  const { top, left } = situar(caja, alto)

  function aplicar(n: Notacion, valor?: string) {
    n.aplicar(n.ambito === "cara" ? cara : valor)
    onAplicado({
      piezas: [...piezas],
      notacion: n,
      cara: n.ambito === "cara" ? cara : undefined,
      valor,
      etiquetaValor: n.valores?.find((v) => v.valor === valor)?.etiqueta,
    })
  }

  const porColor = (color: Notacion["color"]) => NOTACIONES.filter((n) => n.color === color)

  function grupo(titulo: string, nota: string, color: Notacion["color"]) {
    const tinte = color === "rojo" ? "#C62828" : "#1565C0"

    return (
      <div className="border-t border-linea px-3 py-2">
        <div className="flex items-baseline gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: tinte }} aria-hidden />
          <h4 className="text-[11px] font-semibold">{titulo}</h4>
          <span className="text-[10px] text-tinta-suave">{nota}</span>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {porColor(color).map((n) =>
            n.valores ? (
              <span key={n.id} className="inline-flex overflow-hidden rounded-md border border-linea-fuerte">
                <span className="bg-esmalte px-2 py-1 text-[11px] text-tinta-suave">{n.etiqueta}</span>
                {n.valores.map((v) => (
                  <button
                    key={v.valor}
                    type="button"
                    onClick={() => aplicar(n, v.valor)}
                    title={n.marca}
                    className="border-l border-linea px-2 py-1 text-[11px] hover:bg-marca-tenue hover:text-marca"
                  >
                    {v.etiqueta}
                  </button>
                ))}
              </span>
            ) : (
              <button
                key={n.id}
                type="button"
                onClick={() => aplicar(n)}
                title={n.marca}
                className="rounded-md border border-linea-fuerte px-2 py-1 text-[11px] transition-colors hover:border-marca hover:bg-marca-tenue hover:text-marca"
              >
                {n.etiqueta}
              </button>
            ),
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Notaciones para la selección"
      style={{ position: "fixed", top, left, width: ANCHO, zIndex: 50 }}
      className="rounded-xl border border-linea-fuerte bg-superficie shadow-lg"
    >
      {/* Piezas seleccionadas, cada una con su aspa */}
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2.5">
        {piezas.map((p) => (
          <span
            key={p}
            className="tabular inline-flex items-center gap-1 rounded-md bg-marca px-1.5 py-0.5 font-mono text-[11px] text-esmalte"
          >
            {p}
            <button
              type="button"
              onClick={() => quitar(p)}
              aria-label={`Quitar la pieza ${p}`}
              className="opacity-70 hover:opacity-100"
            >
              <X className="h-3 w-3" aria-hidden />
            </button>
          </span>
        ))}

        <button
          type="button"
          onClick={() => onAcumular(!acumular)}
          aria-pressed={acumular}
          title="Sumar piezas con un clic, sin usar CMD"
          className={`ml-auto inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] transition-colors
            ${acumular ? "border-marca bg-marca-tenue text-marca" : "border-linea-fuerte text-tinta-suave"}`}
        >
          <Plus className="h-3 w-3" aria-hidden />
          {acumular ? "Sumando" : "Añadir"}
        </button>
      </div>

      {/* Cara, sólo relevante para las notaciones de superficie */}
      <div className="flex items-center gap-1.5 border-t border-linea px-3 py-2">
        <span className="text-[11px] text-tinta-suave">Cara</span>
        {CARAS.map((c) => (
          <button
            key={c.codigo}
            type="button"
            onClick={() => setCara(c.codigo)}
            aria-pressed={cara === c.codigo}
            title={c.nombre}
            className={`h-6 w-6 rounded-md border font-mono text-[11px] transition-colors
              ${cara === c.codigo ? "border-marca bg-marca text-esmalte" : "border-linea-fuerte hover:border-marca"}`}
          >
            {c.codigo}
          </button>
        ))}
      </div>

      {grupo("Por hacer", "rojo en la ficha", "rojo")}
      {grupo("Hecho", "azul en la ficha", "azul")}

      {/* Plegadas: ocupaban un tercio del menú sin poder usarse. Visibles, pero
          sin robar sitio a lo que sí funciona. */}
      <details className="border-t border-linea px-3 py-2">
        <summary className="cursor-pointer text-[11px] text-tinta-suave">
          {PENDIENTES.length} notaciones de la ficha aún no disponibles
        </summary>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {PENDIENTES.map((p) => (
            <span
              key={p}
              className="rounded-md border border-dashed border-linea-fuerte px-1.5 py-0.5 text-[11px] text-tinta-suave"
            >
              {p}
            </span>
          ))}
        </div>
      </details>
    </div>
  )
}
