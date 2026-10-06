/**
 * Clasificación de Black: la clase de una cavidad se deduce de las caras que
 * toca y de si la pieza es anterior o posterior. No se guarda: se calcula, así
 * no puede discrepar de lo dibujado.
 *
 *   I    fosas y fisuras: oclusal de un posterior
 *   II   proximal (mesial o distal) de un posterior
 *   III  proximal de un anterior, sin el borde incisal
 *   IV   proximal de un anterior, con el borde incisal
 *   V    tercio cervical: sólo vestibular o lingual
 *   VI   sólo el borde incisal
 */
export type ClaseBlack = "I" | "II" | "III" | "IV" | "V" | "VI"

export function claseDeBlack(anterior: boolean, caras: Iterable<string>): ClaseBlack | null {
  const tocadas = new Set(caras)
  const proximal = tocadas.has("M") || tocadas.has("D")

  if (anterior) {
    if (proximal) return tocadas.has("I") ? "IV" : "III"
    if (tocadas.has("I")) return "VI"
  } else {
    if (proximal) return "II"
    if (tocadas.has("O")) return "I"
  }
  return tocadas.has("V") || tocadas.has("L") ? "V" : null
}

/** El orden clínico al nombrar las caras de una restauración: MOD, no DMO. */
const ORDEN = ["M", "O", "I", "D", "V", "L"]

export function carasEnOrden(caras: Iterable<string>): string[] {
  return [...new Set(caras)].sort((a, b) => ORDEN.indexOf(a) - ORDEN.indexOf(b))
}
