import { useMemo, useState } from "react"
import { Link } from "react-router-dom"

import { ApiError } from "../../api/client"
import type { Cita, ValorEstadoCita } from "../../api/tipos"
import { Aviso, Boton, ErrorCarga, Esqueleto, Tarjeta } from "../../components/ui"
import { doctor, fechaLarga, hora } from "../../lib/formato"
import { useLayout } from "../../rutas/contexto"
import { DetalleCita } from "../agenda/DetalleCita"
import { useCambiarEstado, useCitas, useEstadosCita } from "../agenda/consultas"
import { InsigniaEstado } from "../agenda/estados"
import { mapaDeEstados, type MapaEstados } from "../agenda/mapaEstados"
import { inicioDelDia, sumarDias } from "../agenda/tiempo"
import { useAuth } from "../auth/contexto"
import { useOnboarding } from "../onboarding/consultas"
import { RecordatoriosDeManana } from "./RecordatoriosDeManana"

/** El paso siguiente de una visita, dicho como lo dice el mostrador. */
const PASO: Partial<Record<ValorEstadoCita, string>> = {
  confirmada: "Confirmar",
  en_sala: "Llegó",
  atendida: "Atendida",
}

const COLUMNAS: { titulo: string; vacio: string; estados: ValorEstadoCita[] }[] = [
  { titulo: "Por llegar", vacio: "Nadie pendiente de llegar.", estados: ["agendada", "confirmada"] },
  { titulo: "En sala", vacio: "La sala de espera está vacía.", estados: ["en_sala"] },
  { titulo: "Atendidos", vacio: "Todavía no se ha atendido a nadie.", estados: ["atendida"] },
]

function TarjetaCita({
  cita,
  estados,
  edita,
  ocupado,
  alAbrir,
  alAvanzar,
}: {
  cita: Cita
  estados: MapaEstados
  edita: boolean
  ocupado: boolean
  alAbrir: () => void
  alAvanzar: (estado: ValorEstadoCita) => void
}) {
  // El primer estado posible que sea un paso adelante de la visita.
  const siguiente = cita.siguientes.find((estado) => PASO[estado])

  return (
    <li className="rounded-lg border border-linea bg-superficie p-3">
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={alAbrir} className="min-w-0 text-left">
          <span className="tabular text-sm font-semibold">{hora(cita.inicio)}</span>
          <span className="block truncate text-sm font-medium hover:underline">
            {cita.paciente_nombre}
          </span>
        </button>
        <InsigniaEstado estado={cita.estado} estados={estados} />
      </div>
      <p className="mt-1 truncate text-xs text-tinta-suave">
        {doctor(cita.doctor_nombre)}
        {cita.unidad_nombre && ` · ${cita.unidad_nombre}`}
        {cita.servicio_nombre && ` · ${cita.servicio_nombre}`}
      </p>
      {edita && siguiente && (
        <Boton
          variante="contorno"
          className="mt-2.5 w-full py-1.5"
          disabled={ocupado}
          onClick={() => alAvanzar(siguiente)}
        >
          {PASO[siguiente]}
        </Boton>
      )}
    </li>
  )
}

/**
 * El día de la clínica de un vistazo: quién falta por llegar, quién espera y a
 * quién se atendió. Cada tarjeta avanza con un clic, sin abrir la cita.
 */
export function PantallaInicio() {
  const { usuario, puede } = useAuth()
  const { abrirCita } = useLayout()
  const [soloMias, setSoloMias] = useState(false)
  const [detalle, setDetalle] = useState<number | null>(null)
  const [fallo, setFallo] = useState<string | null>(null)

  const hoy = useMemo(() => inicioDelDia(new Date()), [])
  const manana = useMemo(() => sumarDias(hoy, 1), [hoy])
  const doctorId = soloMias ? usuario?.doctor_id : null

  const { data: guia } = useOnboarding()
  const { data: citas, isPending, error } = useCitas(hoy, manana, { doctorId })
  const { data: estados } = useEstadosCita()
  const cambiar = useCambiarEstado()

  const mapa = useMemo(() => mapaDeEstados(estados), [estados])
  const edita = puede("doctor", "asistente", "recepcion")
  const caidas = (citas ?? []).filter((c) => mapa.get(c.estado)?.ocupa_agenda === false)
  const vivas = (citas ?? []).length - caidas.length

  async function avanzar(cita: Cita, estado: ValorEstadoCita) {
    setFallo(null)
    try {
      await cambiar.mutateAsync({ id: cita.id, estado })
    } catch (e) {
      setFallo(e instanceof ApiError ? e.detail : "No se pudo cambiar el estado")
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hoy</h1>
          <p className="mt-1 text-sm text-tinta-suave first-letter:uppercase">
            {fechaLarga(hoy)}
            {citas && (
              <>
                {" · "}
                <span className="tabular">{vivas}</span> {vivas === 1 ? "cita" : "citas"}
                {caidas.length > 0 && (
                  <>
                    {" · "}
                    <span className="tabular">{caidas.length}</span> entre canceladas y ausencias
                  </>
                )}
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {usuario?.doctor_id && (
            <button
              type="button"
              aria-pressed={soloMias}
              onClick={() => setSoloMias(!soloMias)}
              className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                soloMias
                  ? "border-marca bg-marca-tenue font-medium text-marca"
                  : "border-linea-fuerte text-tinta-suave hover:text-tinta"
              }`}
            >
              Mis citas
            </button>
          )}
          <Link
            to="/agenda?vista=dia"
            className="rounded-lg border border-linea-fuerte px-3 py-2 text-sm hover:border-tinta-suave"
          >
            Ver en la agenda
          </Link>
        </div>
      </div>

      {/* Quien no administra no ve la guía; sí debe saber por qué no hay nada que hacer. */}
      {!puede() && guia && !guia.listo && (
        <Aviso tono="advertencia" className="mt-4">
          La clínica aún se está configurando. Pide al administrador que registre los datos de la
          clínica y a los doctores para poder agendar.
        </Aviso>
      )}
      {fallo && <Aviso className="mt-4">{fallo}</Aviso>}
      {error && <ErrorCarga error={error} className="mt-6" />}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {COLUMNAS.map((columna) => {
          const suyas = (citas ?? []).filter((c) => columna.estados.includes(c.estado))
          return (
            <Tarjeta key={columna.titulo} className="bg-esmalte p-3">
              <h2 className="flex items-baseline justify-between px-1 text-sm font-semibold">
                {columna.titulo}
                <span className="tabular font-normal text-tinta-suave">{suyas.length}</span>
              </h2>
              {isPending ? (
                <div className="mt-3 space-y-2">
                  <Esqueleto className="h-20 w-full" />
                  <Esqueleto className="h-20 w-full" />
                </div>
              ) : suyas.length === 0 ? (
                <p className="px-1 py-6 text-center text-sm text-tinta-suave">{columna.vacio}</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {suyas.map((cita) => (
                    <TarjetaCita
                      key={cita.id}
                      cita={cita}
                      estados={mapa}
                      edita={edita}
                      ocupado={cambiar.isPending}
                      alAbrir={() => setDetalle(cita.id)}
                      alAvanzar={(estado) => avanzar(cita, estado)}
                    />
                  ))}
                </ul>
              )}
            </Tarjeta>
          )
        })}
      </div>

      {caidas.length > 0 && (
        <details className="mt-5 text-sm">
          <summary className="cursor-pointer text-tinta-suave">
            Canceladas y ausencias de hoy ({caidas.length})
          </summary>
          <ul className="mt-2 space-y-1">
            {caidas.map((cita) => (
              <li key={cita.id} className="flex flex-wrap items-center gap-2">
                <span className="tabular text-tinta-suave">{hora(cita.inicio)}</span>
                <button type="button" onClick={() => setDetalle(cita.id)} className="hover:underline">
                  {cita.paciente_nombre}
                </button>
                <InsigniaEstado estado={cita.estado} estados={mapa} />
              </li>
            ))}
          </ul>
        </details>
      )}

      {edita && <RecordatoriosDeManana />}

      <DetalleCita
        citaId={detalle}
        alCerrar={() => setDetalle(null)}
        alEditar={(cita) => {
          setDetalle(null)
          abrirCita({ cita })
        }}
      />
    </div>
  )
}
