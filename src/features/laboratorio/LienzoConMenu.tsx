import { useCallback, useEffect, useState } from "react"
import { OdontogramChartSurface, OdontogramProvider, clearSelection } from "react-advanced-odontogram"
import "react-advanced-odontogram/style.css"

import { MenuNotaciones } from "./MenuNotaciones"
import { TablaRegistro } from "./TablaRegistro"
import { useRegistro, type Anotacion } from "./useRegistro"
import { useSeleccionPiezas } from "./useSeleccionPiezas"

/**
 * Selecciona unas piezas concretas, ejecuta algo sobre ellas y devuelve la
 * selección a como estaba.
 *
 * Los setters del motor actúan sobre «la selección actual», así que para
 * deshacer una notación en otras piezas hay que seleccionarlas primero. Se
 * restaura después para no mover el sitio donde estaba trabajando el doctor.
 */
function sobrePiezas(piezas: number[], hacer: () => void, restaurar: number[]) {
  const pulsar = (n: number, sumar: boolean) =>
    document
      .querySelector<HTMLElement>(`.tooth-tile[role="option"][data-tooth="${n}"]`)
      ?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true, metaKey: sumar, ctrlKey: sumar }),
      )

  clearSelection()
  piezas.forEach((n, i) => pulsar(n, i > 0))
  hacer()

  clearSelection()
  restaurar.forEach((n, i) => pulsar(n, i > 0))
}

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
  const { anotaciones, registrar, olvidar } = useRegistro()
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

  const alAplicar = useCallback(
    (entrada: Omit<Anotacion, "id" | "cuando">) => {
      registrar(entrada)
      const donde = entrada.cara ? ` · cara ${entrada.cara}` : ""
      const sobre =
        entrada.piezas.length === 1 ? `pieza ${entrada.piezas[0]}` : `${entrada.piezas.length} piezas`
      setAviso(`${entrada.notacion.etiqueta}${donde} en ${sobre}`)
    },
    [registrar],
  )

  // Quitar una fila deshace la notación en el lienzo, no sólo en la lista.
  const alQuitar = useCallback(
    (a: Anotacion) => {
      sobrePiezas(a.piezas, () => a.notacion.quitar(a.cara ?? a.valor), seleccion.piezas)
      olvidar(a.id)
      setAviso(`Quitado: ${a.notacion.etiqueta} de ${a.piezas.join(", ")}`)
    },
    [olvidar, seleccion.piezas],
  )

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 2800)
    return () => clearTimeout(t)
  }, [aviso])

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

      <div className="mt-5 border-t border-linea pt-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
          <h2 className="text-sm font-semibold">Marcado en esta ficha</h2>
          <span className="text-xs text-tinta-suave">
            {anotaciones.length === 0
              ? "Haz clic en una pieza; para varias, mantén CMD o usa «Añadir»"
              : `${anotaciones.length} ${anotaciones.length === 1 ? "anotación" : "anotaciones"} · la papelera la quita del odontograma`}
          </span>
        </div>
        <div className="mt-3">
          <TablaRegistro anotaciones={anotaciones} onQuitar={alQuitar} />
        </div>
      </div>

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
