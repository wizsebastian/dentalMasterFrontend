import { Check, ChevronRight, Lock } from "lucide-react"
import { Link, Navigate, useNavigate } from "react-router-dom"

import { ApiError } from "../../api/client"
import { Aviso, Boton, ErrorCarga, Insignia, useAviso } from "../../components/ui"
import { useAuth } from "../auth/contexto"
import { AnilloProgreso } from "./AnilloProgreso"
import { CheckAnimado } from "./CheckAnimado"
import { useAvance } from "./avance"
import { useCerrarGuia, useOnboarding } from "./consultas"
import { PASOS } from "./pasos"

/**
 * La vista de arranque: lo que el cliente ve al entrar por primera vez a una
 * clínica vacía. Seis tarjetas que entran en cascada, un anillo que avanza y la
 * tarea en turno respirando.
 */
export function PantallaBienvenida() {
  const avisar = useAviso()
  const navegar = useNavigate()
  const { puede } = useAuth()
  const { data: guia, error } = useOnboarding()
  const cerrar = useCerrarGuia()
  const avance = useAvance(guia)

  if (!puede()) return <Navigate to="/inicio" replace />
  if (error) return <ErrorCarga error={error} />
  if (!guia) return null

  const hechos = new Map(guia.pasos.map((p) => [p.id, p.hecho]))
  const obligatorios = new Set(guia.pasos.filter((p) => p.obligatorio).map((p) => p.id))
  const turno = PASOS[avance.turno]

  async function terminar() {
    try {
      await cerrar.mutateAsync()
      navegar("/bienvenida/listo")
    } catch (e) {
      avisar(e instanceof ApiError ? e.detail : "No se pudo cerrar la guía")
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="guia-sube flex flex-wrap items-center gap-6">
        <AnilloProgreso hechos={guia.hechos} total={guia.total} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-marca">Primeros pasos</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {guia.hechos === 0 ? "Bienvenido a DentalMaster" : "Vas muy bien"}
          </h1>
          <p className="mt-2 text-tinta-suave">
            {guia.listo
              ? "Lo mínimo está listo. Puedes terminar ya, o seguir con lo que falta."
              : "Vamos a dejar tu clínica lista antes de empezar a trabajar. Son seis pasos cortos; los dos primeros son obligatorios y no se pueden saltar."}
          </p>
        </div>
      </header>

      <ol className="mt-8 space-y-3">
        {PASOS.map((paso, i) => {
          const hecho = hechos.get(paso.id) ?? false
          const enTurno = turno?.id === paso.id
          const Icono = paso.icono
          const cerrado = avance.cerrado(paso.id)
          const clase = `group flex items-center gap-4 rounded-xl border bg-superficie p-4 transition-colors ${
            enTurno ? "guia-turno border-marca" : "border-linea"
          }`
          return (
            <li key={paso.id} className="guia-sube" style={{ animationDelay: `${120 + i * 70}ms` }}>
              {cerrado ? (
                <div aria-disabled="true" className={`${clase} cursor-not-allowed opacity-50`}>
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                    hecho ? "" : "bg-marca-tenue text-marca"
                  }`}
                >
                  {hecho ? (
                    <CheckAnimado tamano={36} />
                  ) : cerrado ? (
                    <Lock className="h-5 w-5" aria-hidden />
                  ) : (
                    <Icono className="h-5 w-5" aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className={`font-medium ${hecho ? "text-tinta-suave" : ""}`}>
                      {i + 1}. {paso.titulo}
                    </span>
                    <Insignia>{obligatorios.has(paso.id) ? "Obligatorio" : "Opcional"}</Insignia>
                  </span>
                  <span className="block text-sm text-tinta-suave">{paso.resumen}</span>
                </span>
                {enTurno ? (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-marca px-3 py-1.5 text-sm font-medium text-esmalte">
                    {guia.hechos === 0 ? "Empezar" : "Continuar"}
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </span>
                ) : cerrado ? (
                  <span className="text-sm text-tinta-suave">Primero el paso anterior</span>
                ) : (
                  <span className="text-sm text-tinta-suave group-hover:text-marca">
                    {hecho ? "Revisar" : "Abrir"}
                  </span>
                )}
                </div>
              ) : (
                <Link to={`/bienvenida/${paso.id}`} className={`${clase} hover:border-marca`}>
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                    hecho ? "" : "bg-marca-tenue text-marca"
                  }`}
                >
                  {hecho ? (
                    <CheckAnimado tamano={36} />
                  ) : cerrado ? (
                    <Lock className="h-5 w-5" aria-hidden />
                  ) : (
                    <Icono className="h-5 w-5" aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className={`font-medium ${hecho ? "text-tinta-suave" : ""}`}>
                      {i + 1}. {paso.titulo}
                    </span>
                    <Insignia>{obligatorios.has(paso.id) ? "Obligatorio" : "Opcional"}</Insignia>
                  </span>
                  <span className="block text-sm text-tinta-suave">{paso.resumen}</span>
                </span>
                {enTurno ? (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-marca px-3 py-1.5 text-sm font-medium text-esmalte">
                    {guia.hechos === 0 ? "Empezar" : "Continuar"}
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </span>
                ) : cerrado ? (
                  <span className="text-sm text-tinta-suave">Primero el paso anterior</span>
                ) : (
                  <span className="text-sm text-tinta-suave group-hover:text-marca">
                    {hecho ? "Revisar" : "Abrir"}
                  </span>
                )}
                </Link>
              )}
            </li>
          )
        })}
      </ol>

      {!guia.listo && (
        <Aviso tono="info" className="guia-sube mt-6">
          Para entrar a trabajar necesitas los datos de la clínica y tu primer doctor.
        </Aviso>
      )}

      <div className="guia-sube mt-8 flex justify-end" style={{ animationDelay: "560ms" }}>
        <Boton disabled={!guia.listo || cerrar.isPending} onClick={terminar}>
          <Check className="h-4 w-4" aria-hidden />
          Terminar configuración
        </Boton>
      </div>
    </div>
  )
}
