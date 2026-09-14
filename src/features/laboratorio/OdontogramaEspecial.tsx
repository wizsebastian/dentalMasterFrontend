import { Suspense, lazy } from "react"

import { Logo } from "../../components/brand"
import { Tarjeta, VolverAtras } from "../../components/ui"
import { CargandoOdontograma } from "./CargandoOdontograma"

// La librería es sólo de cliente y pesa 2,8 MB: se carga aparte para no
// arrastrarla al bundle de las pantallas clínicas.
const LienzoConMenu = lazy(async () => ({
  default: (await import("./LienzoConMenu")).LienzoConMenu,
}))

/**
 * Odontograma con el motor de `react-advanced-odontogram` y nuestra interfaz.
 *
 * De la librería se conserva el lienzo y el motor; su panel derecho de diez
 * tarjetas y su cabecera no se renderizan. Las notaciones son las de la ficha
 * de la clínica, aplicadas desde un menú que aparece junto a la selección.
 */
export function OdontogramaEspecial() {
  return (
    <div className="min-h-dvh px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-linea pb-5">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="rounded-lg border border-linea-fuerte px-2.5 py-1 text-xs text-tinta-suave">
              Banco de pruebas · no toca ningún paciente
            </span>
            <VolverAtras />
          </div>
        </header>

        <h1 className="mt-8 text-2xl font-semibold tracking-tight">Odontograma</h1>
        <p className="mt-2 max-w-[68ch] leading-relaxed text-tinta-suave">
          Selecciona una o varias piezas y aparecerá el menú con las notaciones de la ficha,
          agrupadas como en el papel: rojo lo que hay que hacer, azul lo que ya está hecho.
        </p>

        <Tarjeta className="mt-6 p-4">
          <Suspense fallback={<CargandoOdontograma que="el odontograma" />}>
            <LienzoConMenu />
          </Suspense>
        </Tarjeta>
      </div>
    </div>
  )
}
