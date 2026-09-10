import { useId } from "react"

import type { Diente as DienteCatalogo, Hallazgo } from "../../api/tipos"
import { CENTRO, LADO, carasLaterales, posicionCara } from "./geometria"

/**
 * Cómo se pinta cada estado del hallazgo.
 *
 * El color siempre sale de `condicion_dental.color_hex`; el estado sólo decide
 * la textura, de modo que un mismo diagnóstico se reconoce esté propuesto o ya
 * ejecutado.
 */
type Textura = "solido" | "rayado" | "tenue" | "oculto"

const TEXTURA_POR_ESTADO: Record<string, Textura> = {
  existente: "solido",
  completado: "solido",
  planificado: "rayado",
  en_proceso: "tenue",
  anulado: "oculto",
}

type DienteProps = {
  catalogo: DienteCatalogo
  hallazgos: Hallazgo[]
  ausente?: boolean
  seleccionado?: boolean
  soloLectura?: boolean
  onElegirCara?: (codigoFdi: number, superficie: string | null) => void
}

export function Diente({
  catalogo,
  hallazgos,
  ausente = false,
  seleccionado = false,
  soloLectura = false,
  onElegirCara,
}: DienteProps) {
  const patronId = useId().replace(/:/g, "")

  const deSuperficie = hallazgos.filter((h) => h.superficie !== null)
  const dePieza = hallazgos.filter(
    (h) => h.superficie === null && TEXTURA_POR_ESTADO[h.estado] !== "oculto",
  )

  // Cuando una cara acumula varios hallazgos hay que decidir cuál se pinta.
  //
  // Lo planificado no ha ocurrido, así que nunca tapa un hallazgo real: una
  // caries con una resina propuesta encima sigue siendo una caries. Entre los
  // que sí ocurrieron gana el más reciente, que es el estado vigente de la cara
  // (una resina completada después resuelve la caries que había).
  function prioridad(hallazgo: Hallazgo): [number, string] {
    return [hallazgo.estado === "planificado" ? 0 : 1, hallazgo.fecha]
  }

  const porCara = new Map<string, Hallazgo>()
  for (const hallazgo of deSuperficie) {
    if (TEXTURA_POR_ESTADO[hallazgo.estado] === "oculto") continue

    const previo = porCara.get(hallazgo.superficie!)
    if (!previo || prioridad(hallazgo) > prioridad(previo)) {
      porCara.set(hallazgo.superficie!, hallazgo)
    }
  }

  // Una cara con algo real encima y además algo propuesto lleva una marca, para
  // que el plan no quede invisible en el lienzo.
  const conPlanOculto = new Set(
    deSuperficie
      .filter((h) => h.estado === "planificado" && porCara.get(h.superficie!)?.id !== h.id)
      .map((h) => h.superficie!),
  )

  const caras = [
    ...carasLaterales(catalogo.cuadrante),
    { codigo: catalogo.centro_oclusal, path: null },
  ]

  function relleno(hallazgo: Hallazgo | undefined): string {
    if (!hallazgo) return "var(--color-superficie)"
    return TEXTURA_POR_ESTADO[hallazgo.estado] === "rayado"
      ? `url(#${patronId}-${hallazgo.condicion_dental_id})`
      : hallazgo.color_hex
  }

  function opacidad(hallazgo: Hallazgo | undefined): number {
    return hallazgo && TEXTURA_POR_ESTADO[hallazgo.estado] === "tenue" ? 0.5 : 1
  }

  const interactivo = !soloLectura && onElegirCara !== undefined
  const rayados = [...porCara.values(), ...dePieza].filter(
    (h) => TEXTURA_POR_ESTADO[h.estado] === "rayado",
  )

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        viewBox={`-3 -3 ${LADO + 6} ${LADO + 6}`}
        className="h-[52px] w-[52px] overflow-visible"
        role="group"
        aria-label={`Pieza ${catalogo.codigo_fdi}, ${catalogo.nombre}`}
      >
        <defs>
          {rayados.map((h) => (
            <pattern
              key={h.condicion_dental_id}
              id={`${patronId}-${h.condicion_dental_id}`}
              width="5"
              height="5"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="5" height="5" fill="var(--color-superficie)" />
              <line x1="0" y1="0" x2="0" y2="5" stroke={h.color_hex} strokeWidth="2.2" />
            </pattern>
          ))}
        </defs>

        {caras.map((cara) => {
          const hallazgo = porCara.get(cara.codigo)
          const etiqueta = hallazgo
            ? `${cara.codigo}: ${hallazgo.condicion_nombre} (${hallazgo.estado})`
            : `Cara ${cara.codigo}`

          const comun = {
            fill: relleno(hallazgo),
            fillOpacity: opacidad(hallazgo),
            stroke: "var(--color-tinta-suave)",
            strokeWidth: 1.1,
            onClick: interactivo ? () => onElegirCara(catalogo.codigo_fdi, cara.codigo) : undefined,
            className: interactivo ? "cursor-pointer hover:fill-marca-tenue" : undefined,
          }

          return cara.path ? (
            <path key={cara.codigo} d={cara.path} {...comun}>
              <title>{etiqueta}</title>
            </path>
          ) : (
            <rect
              key={cara.codigo}
              x={CENTRO.x}
              y={CENTRO.y}
              width={CENTRO.ancho}
              height={CENTRO.alto}
              {...comun}
            >
              <title>{etiqueta}</title>
            </rect>
          )
        })}

        {/* Punto en la esquina de la cara que tiene trabajo propuesto pendiente. */}
        {[...conPlanOculto].map((codigo) => {
          const plan = deSuperficie.find(
            (h) => h.superficie === codigo && h.estado === "planificado",
          )!
          const esCentro = codigo === catalogo.centro_oclusal
          return (
            <circle
              key={`plan-${codigo}`}
              cx={esCentro ? LADO / 2 : posicionCara(codigo, catalogo.cuadrante).x}
              cy={esCentro ? LADO / 2 : posicionCara(codigo, catalogo.cuadrante).y}
              r={2.6}
              fill={plan.color_hex}
              stroke="var(--color-superficie)"
              strokeWidth={1}
              pointerEvents="none"
            >
              <title>{`${plan.condicion_nombre} (planificado)`}</title>
            </circle>
          )
        })}

        {/* Hallazgos de pieza completa: un anillo por cada uno, hacia fuera. */}
        {dePieza.map((hallazgo, indice) => (
          <rect
            key={hallazgo.id}
            x={-1.5 - indice * 2.5}
            y={-1.5 - indice * 2.5}
            width={LADO + 3 + indice * 5}
            height={LADO + 3 + indice * 5}
            fill="none"
            stroke={hallazgo.color_hex}
            strokeWidth={2.2}
            strokeDasharray={
              TEXTURA_POR_ESTADO[hallazgo.estado] === "rayado" ? "3 2.5" : undefined
            }
            pointerEvents="none"
          >
            <title>{`${hallazgo.condicion_nombre} (${hallazgo.estado})`}</title>
          </rect>
        ))}

        {ausente && (
          <g stroke="var(--color-tinta-suave)" strokeWidth={2} pointerEvents="none">
            <line x1={4} y1={4} x2={LADO - 4} y2={LADO - 4} />
            <line x1={LADO - 4} y1={4} x2={4} y2={LADO - 4} />
          </g>
        )}
      </svg>

      <button
        type="button"
        onClick={interactivo ? () => onElegirCara(catalogo.codigo_fdi, null) : undefined}
        disabled={!interactivo}
        title={`${catalogo.nombre} · registrar sobre la pieza completa`}
        className={`tabular rounded px-1 font-mono text-[11px] leading-tight transition-colors
          ${seleccionado ? "bg-marca text-esmalte" : "text-tinta-suave"}
          ${interactivo ? "hover:bg-marca-tenue hover:text-marca" : "cursor-default"}`}
      >
        {catalogo.codigo_fdi}
      </button>
    </div>
  )
}
