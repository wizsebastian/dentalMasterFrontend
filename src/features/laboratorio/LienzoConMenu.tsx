import { useCallback, useEffect, useState } from "react"
import { OdontogramChartSurface, OdontogramProvider } from "react-advanced-odontogram"
import "react-advanced-odontogram/style.css"

import { MenuNotaciones } from "./MenuNotaciones"
import { useSeleccionPiezas } from "./useSeleccionPiezas"

/**
 * El lienzo de la librería, sin su interfaz.
 *
 * `OdontogramProvider` sólo renderiza el envoltorio alrededor de sus hijos, así
 * que montando únicamente `OdontogramChartSurface` desaparecen el panel derecho
 * y la cabecera con la marca de la librería. No hay nada oculto con CSS: es que
 * no se renderiza.
 *
 * Encima va nuestro menú, que aplica las notaciones de la ficha con la API
 * imperativa del motor.
 */
export function LienzoConMenu() {
  const seleccion = useSeleccionPiezas()
  const [acumular, setAcumular] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  // En modo acumulativo cada clic suma, sin pedir CMD. Se interviene en fase de
  // captura para añadir el modificador antes de que la librería lea el evento.
  useEffect(() => {
    if (!acumular) return

    function alPulsar(e: MouseEvent) {
      if (e.metaKey || e.ctrlKey) return
      const pieza = (e.target as HTMLElement)?.closest?.('.tooth-tile[role="option"]')
      if (!pieza) return

      e.stopPropagation()
      e.preventDefault()
      pieza.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true, metaKey: true, ctrlKey: true }),
      )
    }

    document.addEventListener("click", alPulsar, true)
    return () => document.removeEventListener("click", alPulsar, true)
  }, [acumular])

  const alAplicar = useCallback((mensaje: string) => {
    setAviso(mensaje)
    const t = setTimeout(() => setAviso(null), 2600)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="relative">
      <OdontogramProvider language="es" numberingSystem="FDI" darkMode={false} enableNotes>
        <OdontogramChartSurface />
      </OdontogramProvider>

      <MenuNotaciones
        seleccion={seleccion}
        acumular={acumular}
        onAcumular={setAcumular}
        onAplicado={alAplicar}
      />

      {seleccion.piezas.length === 0 && (
        <p className="border-t border-linea px-1 pt-4 text-sm text-tinta-suave">
          Haz clic en una pieza para registrar. Para varias, mantén CMD o usa «Añadir».
        </p>
      )}

      {aviso && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-tinta px-3 py-2 text-sm text-esmalte shadow-lg"
        >
          {aviso}
        </div>
      )}
    </div>
  )
}
