import { Suspense, lazy } from "react"

import { Cargando, Logo } from "../../components/brand"
import { Tarjeta, VolverAtras } from "../../components/ui"

// La librería es sólo de cliente y pesa: se carga aparte para no arrastrarla
// al bundle de las pantallas clínicas.
const Odontograma = lazy(async () => {
  const modulo = await import("react-advanced-odontogram")
  await import("react-advanced-odontogram/style.css")
  return { default: modulo.OdontogramShell }
})

/**
 * Banco de pruebas de `react-advanced-odontogram`.
 *
 * Trae de serie lo que costaría meses: caries multisuperficie con ICDAS,
 * endodoncia, prótesis, periodontograma completo y exportación FHIR R4.
 *
 * A cambio impone su propio modelo de datos y su propia interfaz. Lo que hay
 * que averiguar aquí es si su estado exportado puede traducirse a
 * `odontograma_hallazgo` sin perder información, porque el esquema ya está
 * cerrado y verificado.
 */
export function OdontogramaEspecial() {
  return (
    <div className="min-h-dvh px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-linea pb-5">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="rounded-lg border border-linea-fuerte px-2.5 py-1 text-xs text-tinta-suave">
              Banco de pruebas · no toca ningún paciente
            </span>
            <VolverAtras />
          </div>
        </header>

        <h1 className="mt-8 text-2xl font-semibold tracking-tight">
          Odontograma con librería
        </h1>
        <p className="mt-2 max-w-[68ch] leading-relaxed text-tinta-suave">
          <code className="font-mono text-sm">react-advanced-odontogram</code> en español y
          notación FDI. Trae caries multisuperficie, endodoncia, prótesis, periodontograma y
          exportación HL7 FHIR. Compáralo con{" "}
          <a href="/odontogram" className="text-marca underline">
            la arcada propia
          </a>{" "}
          antes de decidir cuál se lleva al expediente.
        </p>

        <Tarjeta className="mt-6 overflow-hidden p-2">
          <Suspense
            fallback={
              <div className="grid place-items-center py-24">
                <Cargando size="lg" label="Cargando el odontograma" />
              </div>
            }
          >
            <Odontograma language="es" numberingSystem="FDI" darkMode={false} enableNotes />
          </Suspense>
        </Tarjeta>
      </div>
    </div>
  )
}
