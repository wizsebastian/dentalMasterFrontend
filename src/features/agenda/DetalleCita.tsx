import { useState } from "react"
import { CalendarClock, MessageCircle, Pencil } from "lucide-react"
import { Link } from "react-router-dom"

import { ApiError } from "../../api/client"
import type { Cita, ValorEstadoCita } from "../../api/tipos"
import { Cargando } from "../../components/brand"
import { Aviso, Boton, Dialogo, Insignia, useAviso } from "../../components/ui"
import { doctor, fecha, fechaLarga, hora, telefono } from "../../lib/formato"
import { useAuth } from "../auth/contexto"
import {
  useCambiarEstado,
  useCita,
  useClinica,
  useEstadosCita,
  useMarcarRecordatorio,
} from "./consultas"
import { InsigniaEstado } from "./estados"
import { mapaDeEstados } from "./mapaEstados"
import { minutosEntre } from "./tiempo"
import { enlaceRecordatorio } from "./whatsapp"

const EVENTO: Record<string, string> = {
  creada: "Agendada",
  reprogramada: "Reprogramada",
  estado: "Cambio de estado",
  recordatorio: "Recordatorio enviado",
}

/** Verbo de cada paso, como lo diría quien atiende el mostrador. */
const ACCION: Partial<Record<ValorEstadoCita, string>> = {
  agendada: "Volver a pendiente",
  confirmada: "Confirmar",
  en_sala: "Llegó: pasar a sala",
  atendida: "Marcar atendida",
  cancelada: "Cancelar cita",
  no_asistio: "No asistió",
}

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-tinta-suave">{etiqueta}</dt>
      <dd className="mt-0.5 text-sm">{children}</dd>
    </div>
  )
}

/** Todo lo que se hace con una cita ya agendada: verla, moverla de estado, avisar, editar. */
export function DetalleCita({
  citaId,
  alCerrar,
  alEditar,
}: {
  citaId: number | null
  alCerrar: () => void
  alEditar: (cita: Cita) => void
}) {
  const { data: cita } = useCita(citaId)

  return (
    <Dialogo
      abierto={citaId !== null}
      alCerrar={alCerrar}
      titulo={cita?.paciente_nombre ?? "Cita"}
      descripcion={cita ? `${fechaLarga(cita.inicio)} · ${hora(cita.inicio)}` : undefined}
      ancho="md"
    >
      {cita ? (
        <Contenido cita={cita} alCerrar={alCerrar} alEditar={alEditar} />
      ) : (
        <div className="grid place-items-center py-10 text-marca">
          <Cargando label="Cargando la cita" />
        </div>
      )}
    </Dialogo>
  )
}

function Contenido({
  cita,
  alCerrar,
  alEditar,
}: {
  cita: NonNullable<ReturnType<typeof useCita>["data"]>
  alCerrar: () => void
  alEditar: (cita: Cita) => void
}) {
  const avisar = useAviso()
  const { puede } = useAuth()
  const { data: estados } = useEstadosCita()
  const { data: clinica } = useClinica()
  const cambiar = useCambiarEstado()
  const recordar = useMarcarRecordatorio()
  const [fallo, setFallo] = useState<string | null>(null)

  const mapa = mapaDeEstados(estados)
  const agenda = puede("doctor", "asistente", "recepcion")
  const enlace = enlaceRecordatorio(cita, clinica)

  async function pasarA(estado: ValorEstadoCita) {
    setFallo(null)
    try {
      await cambiar.mutateAsync({ id: cita.id, estado })
      avisar(`Cita: ${mapa.get(estado)?.etiqueta.toLowerCase() ?? estado}`)
    } catch (e) {
      setFallo(e instanceof ApiError ? e.detail : "No se pudo cambiar el estado")
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <InsigniaEstado estado={cita.estado} estados={mapa} />
        {cita.sobrecupo && <Insignia>Sobrecupo</Insignia>}
        <Link
          to={`/pacientes/${cita.paciente_id}`}
          onClick={alCerrar}
          className="ml-auto text-sm text-marca hover:underline"
        >
          Abrir expediente
        </Link>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3">
        <Dato etiqueta="Horario">
          <span className="tabular">
            {hora(cita.inicio)} – {hora(cita.fin)}
          </span>
          <span className="text-tinta-suave"> · {minutosEntre(cita.inicio, cita.fin)} min</span>
        </Dato>
        <Dato etiqueta="Doctor">{doctor(cita.doctor_nombre)}</Dato>
        <Dato etiqueta="Unidad">{cita.unidad_nombre ?? "Sin asignar"}</Dato>
        <Dato etiqueta="Teléfono">
          <span className="tabular font-mono">{telefono(cita.paciente_celular)}</span>
        </Dato>
        <Dato etiqueta="Servicio">{cita.servicio_nombre ?? "Sin especificar"}</Dato>
        <Dato etiqueta="Motivo">{cita.motivo ?? "—"}</Dato>
        {cita.sobrecupo_motivo && (
          <div className="col-span-2">
            <Dato etiqueta="Motivo del sobrecupo">{cita.sobrecupo_motivo}</Dato>
          </div>
        )}
        {cita.notas && (
          <div className="col-span-2">
            <Dato etiqueta="Notas internas">{cita.notas}</Dato>
          </div>
        )}
      </dl>

      {fallo && <Aviso className="mt-4">{fallo}</Aviso>}

      {agenda && (
        <div className="mt-5 flex flex-wrap gap-2 border-t border-linea pt-4">
          {cita.siguientes.map((estado, i) => (
            <Boton
              key={estado}
              // El primer paso posible es el habitual; los demás, secundarios.
              variante={i === 0 ? "solido" : "contorno"}
              disabled={cambiar.isPending}
              onClick={() => pasarA(estado)}
            >
              {ACCION[estado] ?? estado}
            </Boton>
          ))}
          {cita.siguientes.length === 0 && (
            <p className="text-sm text-tinta-suave">
              Una cita atendida ya no cambia de estado ni de horario.
            </p>
          )}
        </div>
      )}

      {agenda && (
        <div className="mt-3 flex flex-wrap gap-2">
          {cita.estado !== "atendida" && (
            <Boton variante="plano" onClick={() => alEditar(cita)}>
              <CalendarClock className="h-4 w-4" aria-hidden />
              Reprogramar o editar
            </Boton>
          )}
          {cita.estado === "atendida" && (
            <Boton variante="plano" onClick={() => alEditar(cita)}>
              <Pencil className="h-4 w-4" aria-hidden />
              Editar notas
            </Boton>
          )}
          {enlace ? (
            <a
              href={enlace}
              target="_blank"
              rel="noreferrer"
              onClick={() => recordar.mutate(cita.id)}
              className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium
                text-tinta-suave transition-colors hover:bg-marca-tenue hover:text-marca"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              {cita.recordatorio_enviado_en ? "Reenviar recordatorio" : "Recordar por WhatsApp"}
            </a>
          ) : (
            <span className="px-3.5 py-2 text-sm text-tinta-suave">
              Sin teléfono para recordatorio
            </span>
          )}
        </div>
      )}

      <div className="mt-5 border-t border-linea pt-4">
        <h3 className="text-xs font-medium text-tinta-suave">Historial</h3>
        <ol className="mt-2 space-y-1.5 text-sm">
          {cita.eventos.map((evento) => (
            <li key={evento.id} className="flex flex-wrap gap-x-2">
              <span className="tabular text-tinta-suave">
                {fecha(evento.ocurrido_en)} {hora(evento.ocurrido_en)}
              </span>
              <span>
                {EVENTO[evento.tipo] ?? evento.tipo}
                {evento.tipo === "estado" && evento.estado_nuevo && (
                  <>: {mapa.get(evento.estado_nuevo)?.etiqueta.toLowerCase()}</>
                )}
                {evento.tipo === "reprogramada" && evento.inicio_anterior && evento.inicio_nuevo && (
                  <>
                    {" "}
                    del {fecha(evento.inicio_anterior)} {hora(evento.inicio_anterior)} al{" "}
                    {fecha(evento.inicio_nuevo)} {hora(evento.inicio_nuevo)}
                  </>
                )}
              </span>
              {evento.motivo && <span className="text-tinta-suave">— {evento.motivo}</span>}
            </li>
          ))}
          {cita.eventos.length === 0 && (
            <li className="text-tinta-suave">Sin movimientos registrados.</li>
          )}
        </ol>
      </div>
    </div>
  )
}
