import { MessageCircle } from "lucide-react"
import { Link } from "react-router-dom"

import type { Cita, Clinica, ValorEstadoCita } from "../../api/tipos"
import { Tabla, type Columna } from "../../components/ui"
import { doctor, fecha, hora, telefono } from "../../lib/formato"
import { InsigniaEstado, SelectorEstado } from "./estados"
import type { MapaEstados } from "./mapaEstados"
import { enlaceRecordatorio } from "./whatsapp"

/**
 * Las citas en tabla. Es también lo que se imprime: en papel las acciones
 * desaparecen y el estado queda como etiqueta.
 */
export function ListaCitas({
  citas,
  estados,
  clinica,
  atenuada,
  edita,
  conPaciente = true,
  alElegir,
  alCambiarEstado,
  alRecordar,
}: {
  citas: Cita[]
  estados: MapaEstados
  clinica?: Clinica
  atenuada?: boolean
  edita: boolean
  /** En el expediente la columna del paciente sobra. */
  conPaciente?: boolean
  alElegir: (cita: Cita) => void
  alCambiarEstado: (cita: Cita, estado: ValorEstadoCita) => void
  alRecordar: (cita: Cita) => void
}) {
  const columnas: Columna<Cita>[] = [
    {
      id: "cuando",
      titulo: "Fecha y hora",
      className: "whitespace-nowrap",
      celda: (c) => (
        <button type="button" onClick={() => alElegir(c)} className="text-left hover:underline">
          <span className="tabular font-medium">{fecha(c.inicio)}</span>
          <span className="tabular block text-xs text-tinta-suave">
            {hora(c.inicio)} – {hora(c.fin)}
          </span>
        </button>
      ),
    },
    ...(conPaciente
      ? [
          {
            id: "paciente",
            titulo: "Paciente",
            celda: (c) => (
              <>
                <Link to={`/pacientes/${c.paciente_id}`} className="font-medium text-marca hover:underline">
                  {c.paciente_nombre}
                </Link>
                <span className="tabular block font-mono text-xs text-tinta-suave">
                  {telefono(c.paciente_celular)}
                </span>
              </>
            ),
          } satisfies Columna<Cita>,
        ]
      : []),
    {
      id: "doctor",
      titulo: "Doctor",
      celda: (c) => (
        <>
          {doctor(c.doctor_nombre)}
          {c.unidad_nombre && <span className="block text-xs text-tinta-suave">{c.unidad_nombre}</span>}
        </>
      ),
    },
    {
      id: "motivo",
      titulo: "Servicio y motivo",
      celda: (c) => (
        <>
          {c.servicio_nombre ?? <span className="text-tinta-suave">—</span>}
          {c.motivo && <span className="block text-xs text-tinta-suave">{c.motivo}</span>}
        </>
      ),
    },
    {
      id: "estado",
      titulo: "Estado",
      className: "whitespace-nowrap",
      celda: (c) => (
        <>
          <span className="no-imprimir">
            <SelectorEstado
              cita={c}
              estados={estados}
              deshabilitado={!edita}
              alCambiar={(estado) => alCambiarEstado(c, estado)}
            />
          </span>
          <span className="solo-imprimir">
            <InsigniaEstado estado={c.estado} estados={estados} />
          </span>
          {c.sobrecupo && <span className="ml-2 text-xs text-tinta-suave">sobrecupo</span>}
        </>
      ),
    },
    ...(edita
      ? [
          {
            id: "acciones",
            titulo: "",
            alinear: "derecha",
            className: "no-imprimir",
            celda: (c) => {
              const enlace = enlaceRecordatorio(c, clinica)
              if (!enlace) return null
              const enviado = Boolean(c.recordatorio_enviado_en)
              return (
                <a
                  href={enlace}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => alRecordar(c)}
                  aria-label={`${enviado ? "Reenviar" : "Enviar"} recordatorio a ${c.paciente_nombre}`}
                  title={enviado ? `Recordatorio enviado el ${fecha(c.recordatorio_enviado_en)}` : "Recordar por WhatsApp"}
                  className={`inline-flex rounded-lg p-1.5 hover:bg-marca-tenue hover:text-marca ${
                    enviado ? "text-marca" : "text-tinta-suave"
                  }`}
                >
                  <MessageCircle className="h-4 w-4" fill={enviado ? "currentColor" : "none"} aria-hidden />
                </a>
              )
            },
          } satisfies Columna<Cita>,
        ]
      : []),
  ]

  return (
    <Tabla
      columnas={columnas}
      filas={citas}
      clave={(c) => c.id}
      atenuada={atenuada}
      claseFila={(c) => (estados.get(c.estado)?.ocupa_agenda === false ? "text-tinta-suave" : undefined)}
    />
  )
}
