import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Plus, Printer } from "lucide-react"
import { Link, useSearchParams } from "react-router-dom"

import { ApiError } from "../../api/client"
import type { Cita, ValorEstadoCita } from "../../api/tipos"
import {
  Aviso,
  Boton,
  ErrorCarga,
  EsqueletoTabla,
  Insignia,
  SelectorFiltro,
  Tarjeta,
  Vacio,
} from "../../components/ui"
import { doctor as tratamiento } from "../../lib/formato"
import { useLayout } from "../../rutas/contexto"
import { useAuth } from "../auth/contexto"
import { useDoctores, useUnidades } from "../catalogo/consultas"
import { Calendario, type Columna } from "./Calendario"
import { DetalleCita } from "./DetalleCita"
import { ListaCitas } from "./ListaCitas"
import {
  useCambiarEstado,
  useCitas,
  useClinica,
  useEstadosCita,
  useMarcarRecordatorio,
} from "./consultas"
import { mapaDeEstados } from "./mapaEstados"
import { Mes } from "./Mes"
import {
  aFechaISO,
  diaCorto,
  inicioDeSemana,
  inicioDelDia,
  mismoDia,
  rotuloDeTramo,
  sumarDias,
} from "./tiempo"
import { Membrete } from "../clinica/Membrete"

const VISTAS = [
  { id: "semana", etiqueta: "Semana" },
  { id: "dia", etiqueta: "Día" },
  { id: "mes", etiqueta: "Mes" },
  { id: "lista", etiqueta: "Lista" },
] as const
type Vista = (typeof VISTAS)[number]["id"]

const AGRUPACIONES = [
  { id: "doctor", etiqueta: "Por doctor" },
  { id: "unidad", etiqueta: "Por unidad" },
] as const

/** Cuántos días abarca cada vista. La lista enseña cuatro semanas: es la que se imprime. */
const DIAS: Record<Vista, number> = { semana: 7, dia: 1, mes: 42, lista: 28 }

const MES = new Intl.DateTimeFormat("es-DO", { month: "long", year: "numeric" })

function Segmentado<T extends string>({
  opciones,
  valor,
  alCambiar,
  etiqueta,
}: {
  opciones: readonly { id: T; etiqueta: string }[]
  valor: T
  alCambiar: (valor: T) => void
  etiqueta: string
}) {
  return (
    <div role="group" aria-label={etiqueta} className="inline-flex rounded-lg border border-linea-fuerte p-0.5">
      {opciones.map((opcion) => (
        <button
          key={opcion.id}
          type="button"
          aria-pressed={valor === opcion.id}
          onClick={() => alCambiar(opcion.id)}
          className={`rounded-md px-3 py-1 text-sm transition-colors ${
            valor === opcion.id ? "bg-marca text-esmalte" : "text-tinta-suave hover:text-tinta"
          }`}
        >
          {opcion.etiqueta}
        </button>
      ))}
    </div>
  )
}

export function PantallaAgenda() {
  const { usuario, puede } = useAuth()
  const { abrirCita } = useLayout()
  const [parametros, setParametros] = useSearchParams()
  const [detalle, setDetalle] = useState<number | null>(null)
  const [agrupar, setAgrupar] = useState<"doctor" | "unidad">("doctor")
  const [fallo, setFallo] = useState<string | null>(null)

  // Vista, día y doctor viven en la URL: se pueden enlazar y sobreviven a una recarga.
  const vista = (VISTAS.find((v) => v.id === parametros.get("vista"))?.id ?? "semana") as Vista
  const pedida = parametros.get("fecha")
  const ancla = useMemo(
    () => inicioDelDia(pedida && /^\d{4}-\d{2}-\d{2}$/.test(pedida) ? new Date(`${pedida}T00:00`) : new Date()),
    [pedida],
  )
  const doctorId = Number(parametros.get("doctor")) || null

  function fijar(cambios: Record<string, string | null>) {
    const siguientes = new URLSearchParams(parametros)
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor === null) siguientes.delete(clave)
      else siguientes.set(clave, valor)
    }
    setParametros(siguientes)
  }

  const desde = useMemo(() => {
    if (vista === "dia") return ancla
    // El mes se pinta desde el lunes de la semana en que cae su día 1.
    if (vista === "mes") return inicioDeSemana(new Date(ancla.getFullYear(), ancla.getMonth(), 1))
    return inicioDeSemana(ancla)
  }, [vista, ancla])

  /** Anterior y siguiente: un día, una semana, cuatro semanas o un mes. */
  function mover(sentido: 1 | -1) {
    const destino =
      vista === "mes"
        ? new Date(ancla.getFullYear(), ancla.getMonth() + sentido, 1)
        : sumarDias(ancla, sentido * dias)
    fijar({ fecha: aFechaISO(destino) })
  }
  const dias = DIAS[vista]
  const hasta = useMemo(() => sumarDias(desde, dias), [desde, dias])

  const { data: citas, isPending, isFetching, error } = useCitas(desde, hasta, { doctorId })
  const { data: estados } = useEstadosCita()
  const { data: doctores } = useDoctores()
  const { data: unidades } = useUnidades()
  const { data: clinica } = useClinica()
  const cambiar = useCambiarEstado()
  const recordar = useMarcarRecordatorio()

  const mapa = useMemo(() => mapaDeEstados(estados), [estados])
  const edita = puede("doctor", "asistente", "recepcion")
  const filtrado = doctores?.find((d) => d.id === doctorId)

  const columnas = useMemo<Columna[]>(() => {
    const todas = citas ?? []
    if (vista === "semana") {
      return Array.from({ length: 7 }, (_, i) => {
        const dia = sumarDias(desde, i)
        return {
          id: aFechaISO(dia),
          titulo: `${diaCorto(dia)} ${dia.getDate()}`,
          dia,
          citas: todas.filter((c) => mismoDia(new Date(c.inicio), dia)),
          doctorId: doctorId ?? undefined,
        }
      })
    }
    if (agrupar === "unidad") {
      const sinUnidad = todas.filter((c) => c.unidad_id === null)
      return [
        ...(unidades ?? []).map((u) => ({
          id: `u${u.id}`,
          titulo: u.nombre,
          subtitulo: u.alquilada ? "Alquilada" : undefined,
          dia: desde,
          citas: todas.filter((c) => c.unidad_id === u.id),
          unidadId: u.id,
          doctorId: doctorId ?? undefined,
        })),
        ...(sinUnidad.length > 0 || !unidades?.length
          ? [{ id: "u0", titulo: "Sin unidad", dia: desde, citas: sinUnidad, doctorId: doctorId ?? undefined }]
          : []),
      ]
    }
    return (doctores ?? [])
      .filter((d) => !doctorId || d.id === doctorId)
      .map((d) => ({
        id: `d${d.id}`,
        titulo: tratamiento(d.nombre_completo),
        subtitulo: d.especialidades[0]?.nombre,
        dia: desde,
        citas: todas.filter((c) => c.doctor_id === d.id),
        doctorId: d.id,
      }))
  }, [citas, vista, agrupar, desde, doctorId, doctores, unidades])

  // Cuántas hay de cada estado en lo que se está viendo.
  const cuenta = useMemo(() => {
    const total = new Map<ValorEstadoCita, number>()
    for (const cita of citas ?? []) total.set(cita.estado, (total.get(cita.estado) ?? 0) + 1)
    return total
  }, [citas])

  async function alCambiarEstado(cita: Cita, estado: ValorEstadoCita) {
    setFallo(null)
    try {
      await cambiar.mutateAsync({ id: cita.id, estado })
    } catch (e) {
      setFallo(e instanceof ApiError ? e.detail : "No se pudo cambiar el estado")
    }
  }

  const rotulo = vista === "mes" ? MES.format(ancla) : rotuloDeTramo(desde, dias)
  const ahora = new Date()
  const esHoy =
    vista === "dia"
      ? mismoDia(ancla, ahora)
      : vista === "mes"
        ? ancla.getMonth() === ahora.getMonth() && ancla.getFullYear() === ahora.getFullYear()
        : mismoDia(desde, inicioDeSemana(ahora))

  return (
    <div>
      <div className="no-imprimir">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Agenda</h1>
            <p className="mt-1 text-sm text-tinta-suave first-letter:uppercase">{rotulo}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Boton variante="contorno" onClick={() => window.print()}>
              <Printer className="h-4 w-4" aria-hidden />
              Imprimir
            </Boton>
            {edita && (
              <Boton onClick={() => abrirCita({ inicio: undefined, doctorId })}>
                <Plus className="h-4 w-4" aria-hidden />
                Nueva cita
              </Boton>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => mover(-1)}
              aria-label="Anterior"
              className="rounded-lg border border-linea-fuerte p-1.5 text-tinta-suave hover:text-tinta"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => mover(1)}
              aria-label="Siguiente"
              className="rounded-lg border border-linea-fuerte p-1.5 text-tinta-suave hover:text-tinta"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => fijar({ fecha: null })}
              disabled={esHoy}
              className="ml-1 rounded-lg border border-linea-fuerte px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Hoy
            </button>
          </div>

          <input
            type="date"
            value={aFechaISO(ancla)}
            onChange={(e) => e.target.value && fijar({ fecha: e.target.value })}
            aria-label="Ir a un día"
            className="rounded-lg border border-linea-fuerte bg-superficie px-3 py-1.5 text-sm"
          />

          <Segmentado
            etiqueta="Vista"
            opciones={VISTAS}
            valor={vista}
            alCambiar={(v) => fijar({ vista: v === "semana" ? null : v })}
          />

          {vista === "dia" && (
            <Segmentado
              etiqueta="Columnas"
              opciones={AGRUPACIONES}
              valor={agrupar}
              alCambiar={(v) => setAgrupar(v)}
            />
          )}

          <SelectorFiltro
            value={doctorId ?? ""}
            onChange={(e) => fijar({ doctor: e.target.value || null })}
            aria-label="Filtrar por doctor"
            className="w-60"
          >
            <option value="">Todos los doctores</option>
            {doctores?.map((d) => (
              <option key={d.id} value={d.id}>
                {tratamiento(d.nombre_completo)}
              </option>
            ))}
          </SelectorFiltro>
          {usuario?.doctor_id && (
            <button
              type="button"
              aria-pressed={doctorId === usuario.doctor_id}
              onClick={() =>
                fijar({ doctor: doctorId === usuario.doctor_id ? null : String(usuario.doctor_id) })
              }
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                doctorId === usuario.doctor_id
                  ? "border-marca bg-marca-tenue font-medium text-marca"
                  : "border-linea-fuerte text-tinta-suave hover:text-tinta"
              }`}
            >
              Mis citas
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="tabular text-tinta-suave">
            {citas?.length ?? 0} {citas?.length === 1 ? "cita" : "citas"}
          </span>
          {(estados ?? [])
            .filter((e) => cuenta.get(e.valor))
            .map((e) => (
              <Insignia key={e.valor} color={e.color_hex}>
                {e.etiqueta} <span className="tabular ml-1">{cuenta.get(e.valor)}</span>
              </Insignia>
            ))}
        </div>

        {fallo && <Aviso className="mt-4">{fallo}</Aviso>}
      </div>

      {/* Membrete: sólo en papel. */}
      <Membrete
        soloPapel
        generado
        titulo="Agenda de citas"
        detalle={
          <span className="first-letter:uppercase">
            {rotulo}
            {filtrado ? ` · ${tratamiento(filtrado.nombre_completo)}` : " · Todos los doctores"}
            {` · ${citas?.length ?? 0} cita(s)`}
          </span>
        }
      />

      <Tarjeta className="hoja mt-4 overflow-hidden">
        {isPending ? (
          <EsqueletoTabla filas={8} />
        ) : error ? (
          <ErrorCarga error={error} className="m-4 border-0" />
        ) : (
          <>
            {vista === "mes" && (
              <div className="no-imprimir">
                <Mes
                  desde={desde}
                  mes={ancla.getMonth()}
                  citas={citas}
                  estados={mapa}
                  alElegirCita={(cita) => setDetalle(cita.id)}
                  alElegirDia={(dia) => fijar({ vista: "dia", fecha: aFechaISO(dia) })}
                />
              </div>
            )}

            {vista !== "lista" && vista !== "mes" && (
              <div className="no-imprimir">
                {columnas.length === 0 ? (
                  <Vacio
                    titulo="No hay doctores activos"
                    descripcion={
                      puede()
                        ? "Registra al primero para poder agendar."
                        : "Pide al administrador que registre a los doctores."
                    }
                    accion={
                      puede() && (
                        <Link
                          to="/bienvenida/doctores"
                          className="guia-turno inline-flex items-center rounded-lg bg-marca px-3.5 py-2 text-sm font-medium text-esmalte hover:bg-marca-viva"
                        >
                          Añadir mi primer doctor
                        </Link>
                      )
                    }
                  />
                ) : (
                  <Calendario
                    columnas={columnas}
                    estados={mapa}
                    alElegirCita={(cita) => setDetalle(cita.id)}
                    alElegirHueco={
                      edita
                        ? (inicio, columna) =>
                            abrirCita({ inicio, doctorId: columna.doctorId, unidadId: columna.unidadId })
                        : undefined
                    }
                  />
                )}
              </div>
            )}

            {/* La lista es la vista «Lista» en pantalla, y lo que se imprime siempre. */}
            <div className={vista === "lista" ? undefined : "solo-imprimir"}>
              {citas.length === 0 ? (
                <Vacio
                  titulo="No hay citas en este tramo"
                  descripcion="Agenda la primera con «Nueva cita» o pulsando F2."
                />
              ) : (
                <ListaCitas
                  citas={citas}
                  estados={mapa}
                  clinica={clinica}
                  atenuada={isFetching}
                  edita={edita}
                  alElegir={(cita) => setDetalle(cita.id)}
                  alCambiarEstado={alCambiarEstado}
                  alRecordar={(cita) => recordar.mutate(cita.id)}
                />
              )}
            </div>
          </>
        )}
      </Tarjeta>

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
