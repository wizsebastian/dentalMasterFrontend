/**
 * Texto para comparar: sin tildes ni mayúsculas, de modo que «gomez» encuentre
 * «Gómez». Es lo que usa todo filtro que corre en el navegador; en el servidor
 * lo hace `unaccent` (`app/services/busqueda.py`).
 */
export function plano(texto: string): string {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
}
