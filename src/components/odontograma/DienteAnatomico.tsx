import { useId } from "react"

import type { Diente as DienteCatalogo, Hallazgo } from "../../api/tipos"
import { CAJA, formaDe } from "./anatomia"
import { anchoDe, HOLGURA, TAMANO, type PiezaColocada } from "./arcada"

/**
 * Regiones de las cuatro caras laterales, como sectores que salen del centro
 * del diente hacia fuera.
 *
 * Se recortan contra la silueta con un `clipPath`, así que cada cara acaba
 * siendo una cuña completa del diente en lugar de una astilla en la esquina.
 * Eso es lo que permite tener forma anatómica **y** marcado por superficie: las
 * librerías de arcada publicadas sólo marcan la pieza entera.
 *
 * La mesa oclusal (o el borde incisal) va aparte: es el contorno encogido.
 */
const M = CAJA / 2
const F = CAJA * 1.4 // los sectores desbordan la caja; el clip los recorta

const REGIONES = {
  vestibular: `M${M} ${M} L${-F} ${-F} L${F} ${-F} Z`,
  lingual: `M${M} ${M} L${-F} ${F} L${F} ${F} Z`,
  izquierda: `M${M} ${M} L${-F} ${-F} L${-F} ${F} Z`,
  derecha: `M${M} ${M} L${F} ${-F} L${F} ${F} Z`,
}

const TEXTURA_POR_ESTADO: Record<string, "solido" | "rayado" | "tenue" | "oculto"> = {
  existente: "solido",
  completado: "solido",
  planificado: "rayado",
  en_proceso: "tenue",
  anulado: "oculto",
}

type Props = {
  catalogo: DienteCatalogo
  pieza: PiezaColocada
  hallazgos: Hallazgo[]
  ausente?: boolean
  seleccionada?: boolean
  onElegirCara?: (codigoFdi: number, superficie: string | null) => void
}

export function DienteAnatomico({
  catalogo,
  pieza,
  hallazgos,
  ausente = false,
  seleccionada = false,
  onElegirCara,
}: Props) {
  const id = useId().replace(/:/g, "")
  const forma = formaDe(catalogo.grupo)

  // Mesial siempre apunta a la línea media; de qué lado del dibujo cae depende
  // del cuadrante, y ya lo resolvió el reparto de la arcada.
  const caras: { codigo: string; path: string; esCentro?: boolean }[] = [
    { codigo: "V", path: REGIONES.vestibular },
    { codigo: "L", path: REGIONES.lingual },
    {
      codigo: "M",
      path: pieza.mesialADerecha ? REGIONES.derecha : REGIONES.izquierda,
    },
    {
      codigo: "D",
      path: pieza.mesialADerecha ? REGIONES.izquierda : REGIONES.derecha,
    },
    { codigo: catalogo.centro_oclusal, path: forma.contorno, esCentro: true },
  ]

  const visibles = hallazgos.filter((h) => TEXTURA_POR_ESTADO[h.estado] !== "oculto")
  const dePieza = visibles.filter((h) => h.superficie === null)

  // Lo planificado nunca tapa lo real: misma regla que el odontograma en rejilla.
  const porCara = new Map<string, Hallazgo>()
  for (const h of visibles.filter((h) => h.superficie !== null)) {
    const previo = porCara.get(h.superficie!)
    const rango = (x: Hallazgo): [number, string] => [x.estado === "planificado" ? 0 : 1, x.fecha]
    if (!previo || rango(h) > rango(previo)) porCara.set(h.superficie!, h)
  }

  const rayados = [...porCara.values()].filter((h) => TEXTURA_POR_ESTADO[h.estado] === "rayado")

  return (
    <g
      transform={
        `translate(${pieza.x} ${pieza.y}) rotate(${pieza.rotacion}) ` +
        // El ancho dibujado usa la misma medida con que se repartió la arcada:
        // si difirieran, las piezas volverían a solaparse.
        `scale(${(TAMANO / CAJA) * anchoDe(catalogo.codigo_fdi) * HOLGURA} ` +
        `${(TAMANO / CAJA) * forma.escala[1]}) ` +
        `translate(${-M} ${-M})`
      }
      role="group"
      aria-label={`Pieza ${catalogo.codigo_fdi}, ${catalogo.nombre}`}
    >
      <defs>
        <clipPath id={`${id}-silueta`}>
          <path d={forma.contorno} />
        </clipPath>
        {rayados.map((h) => (
          <pattern
            key={h.condicion_dental_id}
            id={`${id}-${h.condicion_dental_id}`}
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="10" height="10" fill="var(--color-superficie)" />
            <line x1="0" y1="0" x2="0" y2="10" stroke={h.color_hex} strokeWidth="4.5" />
          </pattern>
        ))}
      </defs>

      {/* Fondo de la pieza */}
      <path d={forma.contorno} fill="var(--color-superficie)" />

      {/* Las caras, recortadas contra la silueta */}
      <g clipPath={`url(#${id}-silueta)`}>
        {caras.map((cara) => {
          const hallazgo = porCara.get(cara.codigo)
          const textura = hallazgo ? TEXTURA_POR_ESTADO[hallazgo.estado] : null

          return (
            <path
              key={cara.codigo}
              d={cara.path}
              transform={
                cara.esCentro
                  ? `translate(${M} ${M}) scale(${forma.centro}) translate(${-M} ${-M})`
                  : undefined
              }
              fill={
                !hallazgo
                  ? "transparent"
                  : textura === "rayado"
                    ? `url(#${id}-${hallazgo.condicion_dental_id})`
                    : hallazgo.color_hex
              }
              fillOpacity={textura === "tenue" ? 0.5 : 1}
              stroke="var(--color-linea-fuerte)"
              strokeWidth={1}
              strokeOpacity={0.7}
              className={onElegirCara ? "cursor-pointer hover:fill-marca-tenue" : undefined}
              onClick={onElegirCara ? () => onElegirCara(catalogo.codigo_fdi, cara.codigo) : undefined}
            >
              <title>
                {hallazgo
                  ? `${cara.codigo}: ${hallazgo.condicion_nombre} (${hallazgo.estado})`
                  : `Cara ${cara.codigo}`}
              </title>
            </path>
          )
        })}

        {/* Surcos: van encima del relleno pero dentro de la silueta */}
        {forma.surcos.map((surco) => (
          <path
            key={surco}
            d={surco}
            fill="none"
            stroke="var(--color-tinta-suave)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeOpacity={0.55}
            pointerEvents="none"
          />
        ))}
      </g>

      {/* Contorno por encima de todo */}
      <path
        d={forma.contorno}
        fill="none"
        stroke={seleccionada ? "var(--color-marca)" : "var(--color-tinta-suave)"}
        strokeWidth={seleccionada ? 3.5 : 1.8}
        onClick={onElegirCara ? () => onElegirCara(catalogo.codigo_fdi, null) : undefined}
        className={onElegirCara ? "cursor-pointer" : undefined}
      />

      {/* Hallazgos de pieza completa: anillos siguiendo la silueta */}
      {dePieza.map((hallazgo, indice) => (
        <path
          key={hallazgo.id}
          d={forma.contorno}
          fill="none"
          stroke={hallazgo.color_hex}
          strokeWidth={3}
          strokeDasharray={
            TEXTURA_POR_ESTADO[hallazgo.estado] === "rayado" ? "7 5" : undefined
          }
          transform={`translate(${CAJA / 2} ${CAJA / 2}) scale(${1.1 + indice * 0.16}) translate(${-CAJA / 2} ${-CAJA / 2})`}
          pointerEvents="none"
        >
          <title>{`${hallazgo.condicion_nombre} (${hallazgo.estado})`}</title>
        </path>
      ))}

      {ausente && (
        <g stroke="var(--color-tinta-suave)" strokeWidth={5} pointerEvents="none" strokeLinecap="round">
          <line x1={24} y1={24} x2={CAJA - 24} y2={CAJA - 24} />
          <line x1={CAJA - 24} y1={24} x2={24} y2={CAJA - 24} />
        </g>
      )}
    </g>
  )
}
