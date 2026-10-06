import { HeartPulse, ShieldAlert, TriangleAlert } from "lucide-react"

import type { Alerta } from "../../api/tipos"

/** Qué tan grave es: la severidad de una alergia o el riesgo de una condición. */
function gravedad(alerta: Alerta): "alta" | "media" {
  const nivel = (alerta.riesgo ?? "").toLowerCase()
  return nivel === "severa" || nivel === "alto" ? "alta" : "media"
}

const ROTULO: Record<string, string> = {
  severa: "severa",
  moderada: "moderada",
  leve: "leve",
  alto: "riesgo alto",
  medio: "riesgo medio",
  bajo: "riesgo bajo",
}

function Etiqueta({ alerta }: { alerta: Alerta }) {
  const alta = gravedad(alerta) === "alta"
  const Icono = alerta.tipo === "alergia" ? ShieldAlert : HeartPulse
  return (
    <li
      className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-sm font-medium ${
        alta
          ? "border-error bg-superficie text-error"
          : "border-aviso bg-superficie text-aviso"
      }`}
    >
      <Icono className="h-4 w-4 shrink-0" aria-hidden />
      <span className="text-tinta">{alerta.detalle}</span>
      <span className="text-xs font-semibold uppercase tracking-wide">
        {ROTULO[(alerta.riesgo ?? "").toLowerCase()] ?? "sin graduar"}
      </span>
    </li>
  )
}

/**
 * Alertas clínicas del paciente.
 *
 * Va arriba del expediente y antes de cualquier otra cosa: una alergia a la
 * penicilina o una terapia anticoagulante cambian el procedimiento, y el doctor
 * tiene que verlas sin buscarlas. Por eso llevan color e icono propios: rojo lo
 * grave, ámbar lo moderado, y un icono distinto para alergia y condición.
 */
export function BannerAlertas({ alertas }: { alertas: Alerta[] }) {
  if (alertas.length === 0) return null

  const condiciones = alertas.filter((a) => a.tipo === "condicion")
  const alergias = alertas.filter((a) => a.tipo === "alergia")
  const hayGrave = alertas.some((a) => gravedad(a) === "alta")

  return (
    <div
      role="alert"
      className={`rounded-xl border border-l-8 px-4 py-3 ${
        hayGrave ? "border-error bg-error-tenue" : "border-aviso bg-aviso-tenue"
      }`}
    >
      <div className="flex gap-3">
        <TriangleAlert
          className={`mt-0.5 h-5 w-5 shrink-0 ${hayGrave ? "text-error" : "text-aviso"}`}
          aria-hidden
        />
        <div className="min-w-0 text-sm">
          <p className="font-semibold">
            {alertas.length} {alertas.length === 1 ? "alerta clínica" : "alertas clínicas"}
          </p>

          <dl className="mt-2 space-y-2">
            {alergias.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <dt className="font-medium">Alergias</dt>
                <dd>
                  <ul className="flex flex-wrap gap-1.5">
                    {alergias.map((a) => (
                      <Etiqueta key={`${a.tipo}-${a.detalle}`} alerta={a} />
                    ))}
                  </ul>
                </dd>
              </div>
            )}
            {condiciones.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <dt className="font-medium">Condiciones de riesgo</dt>
                <dd>
                  <ul className="flex flex-wrap gap-1.5">
                    {condiciones.map((c) => (
                      <Etiqueta key={`${c.tipo}-${c.detalle}`} alerta={c} />
                    ))}
                  </ul>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  )
}
