import { useRef, useState, type PointerEvent } from "react"

export type Trazos = number[][][]

const ANCHO = 600
const ALTO = 200

/** Los trazos como una ruta SVG: sirve para firmar y para enseñar lo firmado. */
function ruta(trazos: Trazos): string {
  return trazos
    .filter((trazo) => trazo.length > 0)
    .map((trazo) => trazo.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" "))
    .join(" ")
}

/** Una firma ya guardada, de sólo lectura. */
export function FirmaDibujada({ trazos, className = "" }: { trazos: Trazos; className?: string }) {
  return (
    <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className={className} role="img" aria-label="Firma">
      <path
        d={ruta(trazos)}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Lienzo para firmar con el dedo, un lápiz o el ratón.
 *
 * Guarda los puntos, no una imagen: el trazo se puede volver a dibujar a
 * cualquier tamaño y ocupa unos pocos kilobytes.
 */
export function LienzoFirma({
  trazos,
  alCambiar,
}: {
  trazos: Trazos
  alCambiar: (trazos: Trazos) => void
}) {
  const lienzo = useRef<SVGSVGElement>(null)
  const [dibujando, setDibujando] = useState(false)

  function punto(evento: PointerEvent): [number, number] {
    const caja = lienzo.current!.getBoundingClientRect()
    return [
      Math.round(((evento.clientX - caja.left) / caja.width) * ANCHO),
      Math.round(((evento.clientY - caja.top) / caja.height) * ALTO),
    ]
  }

  return (
    <svg
      ref={lienzo}
      viewBox={`0 0 ${ANCHO} ${ALTO}`}
      role="img"
      aria-label="Zona para firmar"
      // Sin esto, en una pantalla táctil el dedo desplaza la página en vez de firmar.
      className="w-full touch-none rounded-lg border border-linea-fuerte bg-superficie"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        setDibujando(true)
        alCambiar([...trazos, [punto(e)]])
      }}
      onPointerMove={(e) => {
        if (!dibujando) return
        const ultimo = trazos[trazos.length - 1] ?? []
        alCambiar([...trazos.slice(0, -1), [...ultimo, punto(e)]])
      }}
      onPointerUp={() => setDibujando(false)}
      onPointerCancel={() => setDibujando(false)}
    >
      <line x1={40} y1={ALTO - 40} x2={ANCHO - 40} y2={ALTO - 40} stroke="var(--color-linea-fuerte)" />
      <path
        d={ruta(trazos)}
        fill="none"
        stroke="var(--color-tinta)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
