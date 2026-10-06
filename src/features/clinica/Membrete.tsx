import type { ReactNode } from "react"

import { fecha, hora, telefono } from "../../lib/formato"
import { useClinicaConLogo } from "./consultas"

/**
 * El membrete de todo impreso: logo y datos de la clínica a la izquierda, y a la
 * derecha qué documento es. Sale siempre de los datos de la clínica
 * (Configuración → Clínica), así que cambiarlos cambia todos los impresos.
 *
 * `soloPapel` lo oculta en pantalla: el informe o la agenda ya tienen su
 * cabecera de pantalla, y el membrete es lo que se añade al imprimir.
 */
export function Membrete({
  titulo,
  detalle,
  generado = false,
  soloPapel = false,
  className = "",
  children,
}: {
  titulo?: string
  detalle?: ReactNode
  /** «Generado el … a las …», para los listados e informes. */
  generado?: boolean
  soloPapel?: boolean
  className?: string
  /** Lo que va bajo el título, a la derecha: número de documento, NCF… */
  children?: ReactNode
}) {
  const { clinica, logo } = useClinicaConLogo()

  const direccion = [clinica?.direccion, clinica?.ciudad].filter(Boolean).join(", ")
  const contacto = [
    clinica?.telefono && `Tel. ${telefono(clinica.telefono)}`,
    clinica?.whatsapp && `WhatsApp ${telefono(clinica.whatsapp)}`,
    clinica?.email,
    clinica?.web,
  ].filter(Boolean)

  return (
    <header
      className={`${soloPapel ? "solo-imprimir" : ""} mb-4 flex items-start justify-between gap-6 border-b-2 border-black pb-3 ${className}`}
    >
      <div className="flex min-w-0 items-start gap-3">
        {logo && <img src={logo} alt="" className="h-16 max-w-40 shrink-0 object-contain" />}
        <div className="min-w-0 text-xs leading-snug">
          <p className="text-base font-semibold">{clinica?.nombre}</p>
          {clinica?.rnc && <p className="tabular">RNC {clinica.rnc}</p>}
          {direccion && <p>{direccion}</p>}
          {contacto.length > 0 && <p className="tabular">{contacto.join(" · ")}</p>}
        </div>
      </div>

      {(titulo || detalle || generado || children) && (
        <div className="shrink-0 text-right">
          {titulo && <h1 className="text-lg font-semibold">{titulo}</h1>}
          {detalle && <div className="text-sm">{detalle}</div>}
          {children}
          {generado && (
            <p className="text-xs">
              Generado el {fecha(new Date())} a las {hora(new Date())}
            </p>
          )}
        </div>
      )}
    </header>
  )
}

/** La versión compacta, centrada, para el ticket de 80 mm. */
export function MembreteTicket() {
  const { clinica, logo } = useClinicaConLogo()

  return (
    <header className="text-center">
      {logo && <img src={logo} alt="" className="mx-auto mb-1 h-12 max-w-full object-contain" />}
      <p className="text-sm font-semibold uppercase">{clinica?.nombre}</p>
      {clinica?.rnc && <p>RNC {clinica.rnc}</p>}
      {clinica?.direccion && <p>{clinica.direccion}</p>}
      {clinica?.telefono && <p>Tel. {telefono(clinica.telefono)}</p>}
      {clinica?.whatsapp && <p>WhatsApp {telefono(clinica.whatsapp)}</p>}
    </header>
  )
}
