import type { Diente, Hallazgo } from "../../api/tipos"
import { colocarArcada, LIENZO, posicionEtiqueta } from "./arcada"
import { DienteAnatomico } from "./DienteAnatomico"

type Props = {
  dientes: Diente[]
  hallazgos: Hallazgo[]
  ausentes?: number[]
  denticion?: "permanente" | "temporal"
  piezaSeleccionada?: number | null
  onElegirCara?: (codigoFdi: number, superficie: string | null) => void
}

/**
 * Odontograma en arcada: las piezas dispuestas en U, cada una con su silueta.
 *
 * Es la representación que usan las aplicaciones comerciales. A diferencia de
 * ellas, aquí cada diente conserva sus cinco caras marcables, porque el
 * contorno anatómico actúa de `clipPath` sobre las regiones de superficie.
 */
export function ArcadaDental({
  dientes,
  hallazgos,
  ausentes = [],
  denticion = "permanente",
  piezaSeleccionada,
  onElegirCara,
}: Props) {
  const porCodigo = new Map(dientes.map((d) => [d.codigo_fdi, d]))
  const colocadas = colocarArcada(denticion)
  const ausenteSet = new Set(ausentes)

  const porPieza = new Map<number, Hallazgo[]>()
  for (const hallazgo of hallazgos) {
    const lista = porPieza.get(hallazgo.codigo_fdi) ?? []
    lista.push(hallazgo)
    porPieza.set(hallazgo.codigo_fdi, lista)
  }

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${LIENZO.ancho} ${LIENZO.alto}`}
        className="mx-auto h-auto w-full max-w-2xl"
        role="img"
        aria-label="Odontograma en arcada"
      >
        {/* Ejes de cuadrante: separan derecha/izquierda y las dos arcadas */}
        <g stroke="var(--color-linea)" strokeWidth={1.5}>
          <line x1={LIENZO.ancho / 2} y1={LIENZO.alto * 0.34} x2={LIENZO.ancho / 2} y2={LIENZO.alto * 0.66} />
          <line x1={LIENZO.ancho * 0.2} y1={LIENZO.alto / 2} x2={LIENZO.ancho * 0.8} y2={LIENZO.alto / 2} />
        </g>

        {colocadas.map((pieza) => {
          const catalogo = porCodigo.get(pieza.codigoFdi)
          if (!catalogo) return null

          const etiqueta = posicionEtiqueta(pieza)

          return (
            <g key={pieza.codigoFdi}>
              <DienteAnatomico
                catalogo={catalogo}
                pieza={pieza}
                hallazgos={porPieza.get(pieza.codigoFdi) ?? []}
                ausente={ausenteSet.has(pieza.codigoFdi)}
                seleccionada={piezaSeleccionada === pieza.codigoFdi}
                onElegirCara={onElegirCara}
              />
              <text
                x={etiqueta.x}
                y={etiqueta.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="tabular font-mono"
                fontSize={17}
                fill={
                  piezaSeleccionada === pieza.codigoFdi
                    ? "var(--color-marca)"
                    : "var(--color-tinta-suave)"
                }
                fontWeight={piezaSeleccionada === pieza.codigoFdi ? 600 : 400}
              >
                {pieza.codigoFdi}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
