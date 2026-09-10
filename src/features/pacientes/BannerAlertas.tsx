import { TriangleAlert } from "lucide-react"

import type { Alerta } from "../../api/tipos"

/**
 * Alertas clínicas del paciente.
 *
 * Va arriba del expediente y antes de cualquier otra cosa: una alergia a la
 * penicilina o una terapia anticoagulante cambian el procedimiento, y el doctor
 * tiene que verlas sin buscarlas.
 */
export function BannerAlertas({ alertas }: { alertas: Alerta[] }) {
  if (alertas.length === 0) return null

  const condiciones = alertas.filter((a) => a.tipo === "condicion")
  const alergias = alertas.filter((a) => a.tipo === "alergia")

  return (
    <div
      role="alert"
      className="rounded-xl border border-linea-fuerte bg-superficie px-4 py-3"
    >
      <div className="flex gap-3">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-tinta" aria-hidden />
        <div className="min-w-0 text-sm">
          <p className="font-semibold">
            {alertas.length} {alertas.length === 1 ? "alerta clínica" : "alertas clínicas"}
          </p>

          <dl className="mt-2 space-y-1.5">
            {alergias.length > 0 && (
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                <dt className="font-medium">Alergias:</dt>
                <dd className="text-tinta-suave">
                  {alergias.map((a) => `${a.detalle} (${a.riesgo ?? "sin graduar"})`).join(" · ")}
                </dd>
              </div>
            )}
            {condiciones.length > 0 && (
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                <dt className="font-medium">Condiciones de riesgo alto:</dt>
                <dd className="text-tinta-suave">
                  {condiciones.map((c) => c.detalle).join(" · ")}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  )
}
