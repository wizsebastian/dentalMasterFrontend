/**
 * Colocación de las piezas a lo largo de la arcada.
 *
 * Las posiciones salen de una elipse más alta que ancha: así los molares quedan
 * casi en columna a los lados y los anteriores describen la curva, que es como
 * se ve una arcada real. Cada pieza se rota para que su cara vestibular apunte
 * siempre hacia fuera.
 *
 * Los arcos no recorren los 180° completos: se detienen antes de la horizontal
 * para que arriba y abajo queden separados y no formen un óvalo cerrado.
 */

export const CENTRO = { x: 330, y: 420 }
const RADIO = { x: 198, y: 250 }

/** Grados que se recortan en cada extremo para abrir la arcada por los lados. */
const APERTURA = 6
/** Distancia que se aparta cada arcada del eje horizontal. */
const SEPARACION = 30

/** Lado del dibujo local de cada diente, antes de escalar por grupo. */
export const TAMANO = 62

/** Holgura entre piezas contiguas, para que no lleguen a tocarse. */
export const HOLGURA = 0.9

export type PiezaColocada = {
  codigoFdi: number
  x: number
  y: number
  /** Grados. 0 deja la cara vestibular hacia arriba. */
  rotacion: number
  /** Si mesial cae a la derecha del dibujo una vez aplicada la rotación. */
  mesialADerecha: boolean
}

const SUPERIOR = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const INFERIOR = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]
const SUPERIOR_TEMPORAL = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65]
const INFERIOR_TEMPORAL = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75]

/**
 * Ancho relativo de cada pieza según su posición en el cuadrante.
 *
 * Repartir las 16 piezas a intervalos de ángulo iguales las hace solaparse: un
 * molar es casi el doble de ancho que un incisivo lateral. El reparto se hace
 * por longitud de arco proporcional a estos anchos.
 */
const ANCHO_POR_POSICION = [0.62, 0.58, 0.66, 0.78, 0.78, 1, 1, 0.96]

export function anchoDe(codigoFdi: number): number {
  return ANCHO_POR_POSICION[(codigoFdi % 10) - 1] ?? 1
}

/** Tabla de longitud de arco de la elipse, para repartir por distancia real. */
function tablaDeArco(desde: number, hasta: number, muestras = 400) {
  const tabla: { grados: number; recorrido: number }[] = []
  let recorrido = 0
  let previo: [number, number] | null = null

  for (let i = 0; i <= muestras; i++) {
    const grados = desde + ((hasta - desde) * i) / muestras
    const rad = (grados * Math.PI) / 180
    const punto: [number, number] = [RADIO.x * Math.cos(rad), RADIO.y * Math.sin(rad)]

    if (previo) recorrido += Math.hypot(punto[0] - previo[0], punto[1] - previo[1])
    tabla.push({ grados, recorrido })
    previo = punto
  }

  return tabla
}

/** Grados correspondientes a un recorrido dado sobre el arco. */
function gradosEn(tabla: ReturnType<typeof tablaDeArco>, recorrido: number): number {
  const encontrado = tabla.findIndex((p) => p.recorrido >= recorrido)
  if (encontrado <= 0) return tabla[0].grados

  const antes = tabla[encontrado - 1]
  const despues = tabla[encontrado]
  const tramo = despues.recorrido - antes.recorrido || 1
  const t = (recorrido - antes.recorrido) / tramo

  return antes.grados + (despues.grados - antes.grados) * t
}

function repartir(
  piezas: readonly number[],
  desde: number,
  hasta: number,
  desplazamientoY: number,
): PiezaColocada[] {
  const tabla = tablaDeArco(desde, hasta)
  const total = tabla[tabla.length - 1].recorrido

  const anchos = piezas.map(anchoDe)
  const sumaAnchos = anchos.reduce((a, b) => a + b, 0)
  const unidad = total / sumaAnchos

  let acumulado = 0

  return piezas.map((codigoFdi, indice) => {
    // Cada pieza se centra en su propio tramo de arco.
    const recorrido = acumulado + (anchos[indice] * unidad) / 2
    acumulado += anchos[indice] * unidad

    const grados = gradosEn(tabla, recorrido)
    const radianes = (grados * Math.PI) / 180
    const cuadrante = Math.floor(codigoFdi / 10)

    return {
      codigoFdi,
      x: CENTRO.x + RADIO.x * Math.cos(radianes),
      y: CENTRO.y - RADIO.y * Math.sin(radianes) + desplazamientoY,
      // Con la vestibular hacia arriba en el dibujo local, girar (90 - ángulo)
      // la deja siempre apuntando hacia fuera de la arcada.
      rotacion: 90 - grados,
      // Tras esa rotación mesial queda a la derecha en los cuadrantes 1 y 3
      // (y sus equivalentes temporales): la arcada inferior gira casi 180°, lo
      // que invierte el lado por sí solo.
      mesialADerecha: [1, 3, 5, 7].includes(cuadrante),
    }
  })
}

export function colocarArcada(denticion: "permanente" | "temporal"): PiezaColocada[] {
  const temporal = denticion === "temporal"

  return [
    ...repartir(
      temporal ? SUPERIOR_TEMPORAL : SUPERIOR,
      180 - APERTURA,
      APERTURA,
      -SEPARACION,
    ),
    ...repartir(
      temporal ? INFERIOR_TEMPORAL : INFERIOR,
      180 + APERTURA,
      360 - APERTURA,
      SEPARACION,
    ),
  ]
}

/** Lienzo con margen suficiente para los números de las piezas. */
const MARGEN = TAMANO * 1.7
export const LIENZO = {
  ancho: CENTRO.x * 2,
  alto: CENTRO.y + RADIO.y + SEPARACION + MARGEN,
}

/**
 * Posición del número FDI: por fuera de la pieza siguiendo el radio, para que
 * nunca se monte sobre el diente ni sobre su vecino.
 */
export function posicionEtiqueta(pieza: PiezaColocada) {
  const dx = pieza.x - CENTRO.x
  const dy = pieza.y - CENTRO.y
  const distancia = Math.hypot(dx, dy) || 1

  const fuera = TAMANO * 0.85

  return {
    x: pieza.x + (dx / distancia) * fuera,
    y: pieza.y + (dy / distancia) * fuera,
  }
}
