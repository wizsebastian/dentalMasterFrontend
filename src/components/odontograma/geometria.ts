/**
 * Geometría de una pieza dental dibujada como cinco caras.
 *
 * El diente se representa como un cuadrado dividido en cuatro trapecios que
 * rodean un centro cuadrado, que es la convención del odontograma en papel:
 *
 *        ┌───────────────┐
 *        │ \     V     / │      V  vestibular   (arriba)
 *        │   ┌───────┐   │      L  lingual      (abajo)
 *        │ M │ O / I │ D │      M  mesial       (hacia la línea media)
 *        │   └───────┘   │      D  distal       (lejos de la línea media)
 *        │ /     L     \ │      O  oclusal / I incisal (centro)
 *        └───────────────┘
 *
 * Mesial y distal cambian de lado según el cuadrante: mesial siempre apunta a
 * la línea media de la cara, así que en los cuadrantes de la derecha del
 * paciente (1 y 4) queda a la derecha del dibujo, y a la izquierda en los otros.
 */

export const LADO = 40
const MARGEN = 11 // ancho del trapecio; el resto es el centro

const A = 0
const B = MARGEN
const C = LADO - MARGEN
const D = LADO

/** Trapecio superior, inferior, izquierdo y derecho de la casilla. */
const TRAPECIOS = {
  arriba: `M${A} ${A} L${D} ${A} L${C} ${B} L${B} ${B} Z`,
  abajo: `M${A} ${D} L${B} ${C} L${C} ${C} L${D} ${D} Z`,
  izquierda: `M${A} ${A} L${B} ${B} L${B} ${C} L${A} ${D} Z`,
  derecha: `M${D} ${A} L${D} ${D} L${C} ${C} L${C} ${B} Z`,
} as const

export const CENTRO = { x: B, y: B, ancho: C - B, alto: C - B }

export type CaraDibujada = {
  /** Código de superficie del catálogo: M, D, V, L, O o I. */
  codigo: string
  path: string
}

/**
 * Devuelve las cuatro caras laterales de una pieza, ya orientadas.
 *
 * `cuadrante` es el primer dígito del código FDI (1–8). Los cuadrantes 1, 4, 5
 * y 8 son el lado derecho del paciente.
 */
export function carasLaterales(cuadrante: number): CaraDibujada[] {
  const esLadoDerecho = [1, 4, 5, 8].includes(cuadrante)
  const esArcadaSuperior = [1, 2, 5, 6].includes(cuadrante)

  return [
    // En la arcada superior, vestibular queda arriba del dibujo; en la inferior,
    // abajo. Así el esquema se lee como se mira la boca de frente.
    { codigo: "V", path: esArcadaSuperior ? TRAPECIOS.arriba : TRAPECIOS.abajo },
    { codigo: "L", path: esArcadaSuperior ? TRAPECIOS.abajo : TRAPECIOS.arriba },
    { codigo: "M", path: esLadoDerecho ? TRAPECIOS.derecha : TRAPECIOS.izquierda },
    { codigo: "D", path: esLadoDerecho ? TRAPECIOS.izquierda : TRAPECIOS.derecha },
  ]
}

/**
 * Orden de las piezas en cada fila del odontograma.
 *
 * Se ve la boca de frente: arriba a la izquierda del observador está el
 * cuadrante 1 (derecha del paciente), en orden descendente 18…11.
 */
export const FILAS_PERMANENTE = {
  superior: [
    [18, 17, 16, 15, 14, 13, 12, 11],
    [21, 22, 23, 24, 25, 26, 27, 28],
  ],
  inferior: [
    [48, 47, 46, 45, 44, 43, 42, 41],
    [31, 32, 33, 34, 35, 36, 37, 38],
  ],
} as const

export const FILAS_TEMPORAL = {
  superior: [
    [55, 54, 53, 52, 51],
    [61, 62, 63, 64, 65],
  ],
  inferior: [
    [85, 84, 83, 82, 81],
    [71, 72, 73, 74, 75],
  ],
} as const

/** Punto medio aproximado de cada cara lateral, para colocar marcas encima. */
export function posicionCara(codigo: string, cuadrante: number): { x: number; y: number } {
  const caras = carasLaterales(cuadrante)
  const indice = caras.findIndex((c) => c.codigo === codigo)
  const centro = LADO / 2
  const borde = MARGEN / 2

  // El orden que devuelve carasLaterales es V, L, M, D; cada una ocupa un lado.
  const posiciones = [
    { x: centro, y: borde }, // arriba
    { x: centro, y: LADO - borde }, // abajo
    { x: borde, y: centro }, // izquierda
    { x: LADO - borde, y: centro }, // derecha
  ]

  const orientacion = [
    [1, 2, 5, 6].includes(cuadrante) ? 0 : 1, // V
    [1, 2, 5, 6].includes(cuadrante) ? 1 : 0, // L
    [1, 4, 5, 8].includes(cuadrante) ? 3 : 2, // M
    [1, 4, 5, 8].includes(cuadrante) ? 2 : 3, // D
  ]

  return indice === -1 ? { x: centro, y: centro } : posiciones[orientacion[indice]]
}
