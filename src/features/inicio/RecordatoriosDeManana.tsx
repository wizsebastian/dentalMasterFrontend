import { useMemo } from "react"
import { Check, MessageCircle } from "lucide-react"

import { Tarjeta } from "../../components/ui"
import { doctor, hora } from "../../lib/formato"
import { useCitas, useClinica, useEstadosCita, useMarcarRecordatorio } from "../agenda/consultas"
import { mapaDeEstados } from "../agenda/mapaEstados"
import { inicioDelDia, sumarDias } from "../agenda/tiempo"
import { enlaceRecordatorio } from "../agenda/whatsapp"

/**
 * La cola de recordatorios: a quién avisar hoy de su cita de mañana.
 *
 * Cada botón abre WhatsApp con el mensaje ya escrito y marca la cita como
 * avisada. No es un envío automático —eso exige contratar un proveedor y
 * decidir que los datos del paciente salgan a un tercero—, pero deja el aviso a
 * un clic por paciente y sin olvidar a nadie.
 */
export function RecordatoriosDeManana() {
  const manana = useMemo(() => sumarDias(inicioDelDia(new Date()), 1), [])
  const pasado = useMemo(() => sumarDias(manana, 1), [manana])
  const { data: citas } = useCitas(manana, pasado)
  const { data: estados } = useEstadosCita()
  const { data: clinica } = useClinica()
  const recordar = useMarcarRecordatorio()

  const mapa = useMemo(() => mapaDeEstados(estados), [estados])
  const vivas = (citas ?? []).filter((c) => mapa.get(c.estado)?.ocupa_agenda !== false)
  if (vivas.length === 0) return null

  const pendientes = vivas.filter((c) => !c.recordatorio_enviado_en)

  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold">
        Citas de mañana
        <span className="tabular ml-2 font-normal text-tinta-suave">
          {pendientes.length === 0
            ? "todos avisados"
            : `${pendientes.length} de ${vivas.length} sin avisar`}
        </span>
      </h2>
      <Tarjeta className="mt-2 overflow-hidden">
        <ul>
          {vivas.map((cita) => {
            const enlace = enlaceRecordatorio(cita, clinica)
            const avisado = Boolean(cita.recordatorio_enviado_en)
            return (
              <li
                key={cita.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-linea px-4 py-2 text-sm last:border-0"
              >
                <span>
                  <span className="tabular text-tinta-suave">{hora(cita.inicio)}</span>
                  <span className="ml-3 font-medium">{cita.paciente_nombre}</span>
                  <span className="ml-3 text-tinta-suave">
                    {[cita.servicio_nombre, doctor(cita.doctor_nombre)].filter(Boolean).join(" · ")}
                  </span>
                </span>
                {enlace ? (
                  <a
                    href={enlace}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => recordar.mutate(cita.id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${
                      avisado
                        ? "border-linea text-tinta-suave hover:border-linea-fuerte"
                        : "border-tinta hover:bg-marca-tenue"
                    }`}
                  >
                    {avisado ? (
                      <Check className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {avisado ? "Avisado · reenviar" : "Avisar por WhatsApp"}
                  </a>
                ) : (
                  <span className="text-xs text-tinta-suave">Sin teléfono para WhatsApp</span>
                )}
              </li>
            )
          })}
        </ul>
      </Tarjeta>
    </section>
  )
}
