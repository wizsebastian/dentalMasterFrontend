import { useCallback, useEffect, useState } from "react"
import { onStateChange } from "react-advanced-odontogram"

/**
 * Lee del DOM qué piezas están seleccionadas en el lienzo de la librería.
 *
 * La librería no exporta ningún getter para esto —su propio código llama a la
 * selección «module-private state»—, pero el lienzo es una listbox accesible:
 * cada pieza es un `role="option"` con `data-tooth` y `aria-selected`. Eso es
 * contrato de accesibilidad, no detalle interno, y además da la caja con la que
 * anclar el menú.
 *
 * Ojo: hay **dos** tiles por pieza, la vista facial y la oclusal. Sólo la facial
 * lleva `role="option"`, así que filtrar por rol evita contar cada diente dos
 * veces.
 */

const PIEZA = '.tooth-tile[role="option"]'
const SELECCIONADA = `${PIEZA}[aria-selected="true"]`

export type Seleccion = {
  /** Códigos FDI seleccionados, en orden ascendente. */
  piezas: number[]
  /** Caja que envuelve a todas las seleccionadas, en coordenadas de ventana. */
  caja: DOMRect | null
}

const VACIA: Seleccion = { piezas: [], caja: null }

function medir(): Seleccion {
  const nodos = Array.from(document.querySelectorAll<HTMLElement>(SELECCIONADA))
  if (nodos.length === 0) return VACIA

  const piezas = nodos
    .map((n) => Number(n.dataset.tooth))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b)

  const cajas = nodos.map((n) => n.getBoundingClientRect())
  const izq = Math.min(...cajas.map((c) => c.left))
  const der = Math.max(...cajas.map((c) => c.right))
  const arr = Math.min(...cajas.map((c) => c.top))
  const aba = Math.max(...cajas.map((c) => c.bottom))

  return { piezas, caja: new DOMRect(izq, arr, der - izq, aba - arr) }
}

function mismasPiezas(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((n, i) => n === b[i])
}

export function useSeleccionPiezas(): Seleccion & { quitar: (pieza: number) => void } {
  const [seleccion, setSeleccion] = useState<Seleccion>(VACIA)

  useEffect(() => {
    const raiz = document.querySelector(".odontogram-root") ?? document.body

    // `onStateChange` avisa de las ediciones, no de la selección; el observer
    // cubre el clic. Se usan los dos porque cada uno ve lo que el otro no.
    function refrescar() {
      setSeleccion((previa) => {
        const nueva = medir()
        return mismasPiezas(previa.piezas, nueva.piezas) && previa.caja ? previa : nueva
      })
    }

    const observer = new MutationObserver(refrescar)
    observer.observe(raiz, {
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-selected", "class"],
    })

    const off = onStateChange(refrescar)
    // El lienzo se mueve al hacer scroll: la caja hay que recalcularla.
    window.addEventListener("scroll", refrescar, true)
    window.addEventListener("resize", refrescar)
    refrescar()

    return () => {
      observer.disconnect()
      off()
      window.removeEventListener("scroll", refrescar, true)
      window.removeEventListener("resize", refrescar)
    }
  }, [])

  /** Deselecciona una pieza simulando el CMD+clic que la librería entiende. */
  const quitar = useCallback((pieza: number) => {
    const nodo = document.querySelector<HTMLElement>(
      `${PIEZA}[data-tooth="${pieza}"][aria-selected="true"]`,
    )
    nodo?.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true, metaKey: true, ctrlKey: true }),
    )
  }, [])

  return { ...seleccion, quitar }
}
