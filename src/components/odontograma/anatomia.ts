/**
 * Siluetas de diente en vista oclusal, para el odontograma en arcada.
 *
 * Cada pieza se dibuja mirando su superficie masticatoria, que es la convención
 * de los odontogramas en arcada (Zendenta, Open Dental y compañía). Son cuatro
 * formas —incisivo, canino, premolar y molar— sobre una caja de 100×100 con el
 * mismo criterio en todas:
 *
 *     vestibular arriba · lingual abajo · mesial a la derecha · distal a la izquierda
 *
 * La rotación de la arcada se encarga de llevarlas a su sitio; ver `arcada.ts`.
 */

export const CAJA = 100

export type FormaDental = {
  /** Contorno cerrado. Sirve de silueta y de clipPath para las caras. */
  contorno: string
  /** Surcos y fisuras: trazos decorativos que dan lectura anatómica. */
  surcos: string[]
  /** Ancho y alto relativos, para que un molar no mida lo mismo que un incisivo. */
  escala: [number, number]
  /** Cuánto se encoge el contorno para formar la mesa oclusal / incisal. */
  centro: number
}

/**
 * Incisivo: triángulo redondeado, borde incisal ancho hacia vestibular y
 * cíngulo estrechándose hacia lingual.
 */
const INCISIVO: FormaDental = {
  contorno:
    "M22 16 Q50 6 78 16 Q84 34 74 58 Q62 84 50 90 Q38 84 26 58 Q16 34 22 16 Z",
  surcos: ["M30 26 Q50 19 70 26"],
  escala: [0.66, 0.88],
  centro: 0.42,
}

/** Canino: más estrecho y con la cúspide marcada hacia lingual. */
const CANINO: FormaDental = {
  contorno:
    "M26 18 Q50 6 74 18 Q82 38 70 62 Q58 88 50 94 Q42 88 30 62 Q18 38 26 18 Z",
  surcos: ["M34 28 Q50 20 66 28"],
  escala: [0.7, 0.98],
  centro: 0.4,
}

/** Premolar: casi cuadrado, con el surco central mesiodistal. */
const PREMOLAR: FormaDental = {
  contorno:
    "M22 20 Q50 10 78 20 Q90 50 78 80 Q50 90 22 80 Q10 50 22 20 Z",
  surcos: ["M26 50 Q50 59 74 50"],
  escala: [0.84, 0.86],
  centro: 0.5,
}

/** Molar: el más ancho, con la fisura en Y de las cuatro cúspides. */
const MOLAR: FormaDental = {
  contorno:
    "M18 18 Q50 8 82 18 Q92 34 90 52 Q88 72 80 84 Q50 94 20 84 Q12 72 10 52 Q8 34 18 18 Z",
  surcos: ["M50 20 L50 48", "M50 48 L30 74", "M50 48 L70 76"],
  escala: [1, 0.96],
  centro: 0.52,
}

const POR_GRUPO: Record<string, FormaDental> = {
  incisivo: INCISIVO,
  canino: CANINO,
  premolar: PREMOLAR,
  molar: MOLAR,
}

export function formaDe(grupo: string): FormaDental {
  return POR_GRUPO[grupo] ?? MOLAR
}
