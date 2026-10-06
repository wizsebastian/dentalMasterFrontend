import { useState, type FormEvent } from "react"
import { Plus, Trash2 } from "lucide-react"

import { ApiError } from "../../api/client"
import type { Catalogos, CondicionDental, EstadoHallazgo, Hallazgo } from "../../api/tipos"
import { Cargando } from "../../components/brand"
import { carasEnOrden, claseDeBlack } from "../../components/odontograma/black"
import { Odontograma } from "../../components/odontograma/Odontograma"
import { BarraPincel, PaletaCondiciones } from "../../components/odontograma/PaletaCondiciones"
import {
  AreaTexto,
  Aviso,
  Boton,
  Dialogo,
  ErrorCarga,
  PieDialogo,
  Selector,
  Tarjeta,
  Vacio,
  useAviso,
} from "../../components/ui"
import { fecha } from "../../lib/formato"
import { useAuth } from "../auth/contexto"
import {
  useBorrarHallazgo,
  useCatalogos,
  useCrearVersion,
  useOdontograma,
  useRegistrarHallazgo,
  useVersionConcreta,
  useVersiones,
} from "./consultas"

type Denticion = "permanente" | "temporal"

const ESTADO_HALLAZGO: Record<EstadoHallazgo, string> = {
  existente: "Existente",
  planificado: "Planificado",
  en_proceso: "En proceso",
  completado: "Completado",
  anulado: "Anulado",
}

/** Una fila de la tabla: la misma condición en la misma pieza, con todas sus caras. */
type Grupo = {
  clave: string
  codigo_fdi: number
  condicion_nombre: string
  color_hex: string
  estado: EstadoHallazgo
  fecha: string
  /** Vacío en un hallazgo de pieza completa. */
  caras: Hallazgo[]
  pieza: Hallazgo | null
  clase: string | null
}

function agrupar(hallazgos: Hallazgo[], catalogos: Catalogos): Grupo[] {
  const anterior = new Map(
    catalogos.dientes.map((d) => [d.codigo_fdi, d.grupo === "incisivo" || d.grupo === "canino"]),
  )
  const grupos = new Map<string, Grupo>()
  for (const hallazgo of hallazgos) {
    const clave = `${hallazgo.codigo_fdi}-${hallazgo.condicion_dental_id}-${hallazgo.estado}`
    const grupo = grupos.get(clave) ?? {
      clave,
      codigo_fdi: hallazgo.codigo_fdi,
      condicion_nombre: hallazgo.condicion_nombre,
      color_hex: hallazgo.color_hex,
      estado: hallazgo.estado,
      fecha: hallazgo.fecha,
      caras: [],
      pieza: null,
      clase: null,
    }
    if (hallazgo.superficie) grupo.caras.push(hallazgo)
    else grupo.pieza = hallazgo
    if (hallazgo.fecha > grupo.fecha) grupo.fecha = hallazgo.fecha
    grupos.set(clave, grupo)
  }

  const lista = [...grupos.values()]
  for (const grupo of lista) {
    const orden = carasEnOrden(grupo.caras.map((h) => h.superficie!))
    grupo.caras.sort((a, b) => orden.indexOf(a.superficie!) - orden.indexOf(b.superficie!))
    // La clase de Black sólo tiene sentido en cavidades: caries y restauraciones.
    grupo.clase =
      grupo.caras.length > 0 && grupo.caras[0].ambito === "superficie"
        ? claseDeBlack(anterior.get(grupo.codigo_fdi) ?? false, orden)
        : null
  }
  return lista.sort((a, b) => a.codigo_fdi - b.codigo_fdi || a.condicion_nombre.localeCompare(b.condicion_nombre))
}

/** Abrir la versión N+1: con qué dentición y por qué. */
function FormularioVersion({
  denticionActual,
  crear,
  alCerrar,
}: {
  denticionActual: Denticion
  crear: (datos: { denticion: Denticion; observaciones?: string; copiar_hallazgos: boolean }) => Promise<unknown>
  alCerrar: () => void
}) {
  const [denticion, setDenticion] = useState<Denticion>(denticionActual)
  const [observaciones, setObservaciones] = useState("")
  const [fallo, setFallo] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const cambia = denticion !== denticionActual

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setFallo(null)
    setEnviando(true)
    try {
      await crear({
        denticion,
        observaciones: observaciones.trim() || undefined,
        copiar_hallazgos: !cambia,
      })
      alCerrar()
    } catch (e) {
      setFallo(e instanceof ApiError ? e.detail : "No se pudo crear la versión")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} noValidate>
      <p className="mb-4 text-sm text-tinta-suave">
        La versión actual queda guardada como historial, de solo lectura. La nueva arranca con lo
        existente, lo ya hecho y lo que sigue propuesto en un plan.
      </p>
      <Selector
        etiqueta="Dentición"
        value={denticion}
        onChange={(e) => setDenticion(e.target.value as Denticion)}
        ayuda={
          cambia
            ? "Al cambiar de dentición la versión nueva empieza vacía: son otras piezas."
            : undefined
        }
      >
        <option value="permanente">Permanente (11–48)</option>
        <option value="temporal">Temporal (51–85)</option>
      </Selector>
      <div className="mt-4">
        <AreaTexto
          etiqueta="Motivo de la nueva versión"
          rows={2}
          value={observaciones}
          placeholder="Control anual, fin del tratamiento, recambio dentario…"
          onChange={(e) => setObservaciones(e.target.value)}
        />
      </div>
      {fallo && <Aviso className="mt-4">{fallo}</Aviso>}
      <PieDialogo>
        <Boton type="button" variante="contorno" onClick={alCerrar}>
          Cancelar
        </Boton>
        <Boton type="submit" disabled={enviando}>
          Crear versión
        </Boton>
      </PieDialogo>
    </form>
  )
}

export function PanelOdontograma({ pacienteId }: { pacienteId: number }) {
  const avisar = useAviso()
  const { puede } = useAuth()
  const catalogos = useCatalogos()
  const vigente = useOdontograma(pacienteId)
  const versiones = useVersiones(pacienteId)

  const [versionVista, setVersionVista] = useState<number | null>(null)
  const historica = useVersionConcreta(versionVista)

  const [condicion, setCondicion] = useState<CondicionDental | null>(null)
  const [estado, setEstado] = useState<EstadoHallazgo>("existente")
  const [aviso, setAviso] = useState<{ texto: string; tono: "advertencia" | "error" } | null>(null)
  const [nuevaVersion, setNuevaVersion] = useState(false)

  const crearVersion = useCrearVersion(pacienteId)
  const datos = versionVista ? historica.data : vigente.data
  const odontogramaId = vigente.data?.id ?? 0

  const registrar = useRegistrarHallazgo(pacienteId, odontogramaId)
  const borrar = useBorrarHallazgo(pacienteId, odontogramaId)

  const puedeEditar = puede("doctor", "asistente")
  const soloLectura = !puedeEditar || versionVista !== null

  if (catalogos.isPending || vigente.isPending) {
    return (
      <div className="grid place-items-center py-16 text-marca">
        <Cargando label="Cargando el odontograma" />
      </div>
    )
  }

  if (catalogos.error) return <ErrorCarga error={catalogos.error} />

  // Un 404 aquí no es un fallo: el paciente aún no tiene odontograma.
  if (vigente.error) {
    const sinOdontograma = vigente.error instanceof ApiError && vigente.error.status === 404
    if (!sinOdontograma) return <ErrorCarga error={vigente.error} />

    return (
      <Vacio
        titulo="Este paciente no tiene odontograma"
        descripcion="Crea la primera versión para empezar a registrar hallazgos. Se crea solo al ejecutar el primer tratamiento sobre una pieza."
        accion={
          puedeEditar && (
            <span className="inline-flex flex-wrap justify-center gap-2">
              <Boton
                disabled={crearVersion.isPending}
                onClick={() => crearVersion.mutate({ denticion: "permanente", copiar_hallazgos: false })}
              >
                <Plus className="h-4 w-4" aria-hidden />
                Dentición permanente
              </Boton>
              <Boton
                variante="contorno"
                disabled={crearVersion.isPending}
                onClick={() => crearVersion.mutate({ denticion: "temporal", copiar_hallazgos: false })}
              >
                <Plus className="h-4 w-4" aria-hidden />
                Dentición temporal
              </Boton>
            </span>
          )
        }
      />
    )
  }

  /**
   * Pulsar el dibujo con un pincel. Una condición de cara se registra en la cara
   * pulsada; una de pieza (ausente, corona, implante, endodoncia…) en la pieza
   * entera, pulse donde se pulse. Pulsar de nuevo lo que ya está puesto lo quita.
   */
  async function alElegirCara(codigoFdi: number, superficiePulsada: string | null) {
    if (soloLectura) return
    if (!condicion) {
      setAviso({ texto: "Elige primero una condición de la lista.", tono: "advertencia" })
      return
    }

    const deCara = condicion.ambito === "superficie"
    if (deCara && superficiePulsada === null) {
      setAviso({
        texto: `«${condicion.nombre}» va sobre una cara: pulsa una cara del diente, no su número.`,
        tono: "advertencia",
      })
      return
    }
    const superficie = deCara ? superficiePulsada : null
    const donde = `${codigoFdi}${superficie ? ` ${superficie}` : ""}`

    setAviso(null)
    try {
      const puesto = datos?.hallazgos.find(
        (h) =>
          h.codigo_fdi === codigoFdi &&
          h.superficie === superficie &&
          h.condicion_dental_id === condicion.id &&
          h.estado === estado,
      )
      if (puesto) {
        await borrar.mutateAsync(puesto.id)
        avisar(`Quitado: ${condicion.nombre} · ${donde}`)
        return
      }
      await registrar.mutateAsync({
        codigo_fdi: codigoFdi,
        superficie,
        condicion_dental_id: condicion.id,
        estado,
      })
    } catch (fallo) {
      setAviso({
        texto: fallo instanceof ApiError ? fallo.detail : "No se pudo registrar el hallazgo",
        tono: "error",
      })
    }
  }

  async function quitarGrupo(grupo: Grupo) {
    setAviso(null)
    const ids = [...(grupo.pieza ? [grupo.pieza] : []), ...grupo.caras].map((h) => h.id)
    try {
      await Promise.all(ids.map((id) => borrar.mutateAsync(id)))
      const caras = grupo.caras.map((h) => h.superficie).join("")
      avisar(`Quitado: ${grupo.condicion_nombre} · ${grupo.codigo_fdi}${caras ? ` ${caras}` : ""}`)
    } catch (fallo) {
      setAviso({
        texto: fallo instanceof ApiError ? fallo.detail : "No se pudo quitar el hallazgo",
        tono: "error",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* La línea de tiempo: cada versión es una foto fechada de la boca. */}
        <ol aria-label="Versiones del odontograma" className="flex flex-wrap items-center gap-y-2">
          {[...(versiones.data ?? [])]
            .sort((a, b) => a.version - b.version)
            .map((version, indice) => {
              const activa = version.es_actual ? versionVista === null : versionVista === version.id
              return (
                <li key={version.id} className="flex items-center">
                  {indice > 0 && <span className="h-px w-5 bg-linea-fuerte" aria-hidden />}
                  <button
                    type="button"
                    onClick={() => setVersionVista(version.es_actual ? null : version.id)}
                    aria-current={activa ? "true" : undefined}
                    title={version.observaciones ?? undefined}
                    className={`rounded-lg border px-2.5 py-1 text-left text-xs transition-colors ${
                      activa
                        ? "border-marca bg-marca-tenue text-marca"
                        : "border-linea hover:border-linea-fuerte"
                    }`}
                  >
                    <span className="tabular font-mono font-semibold">v{version.version}</span>
                    <span className="tabular ml-1.5">{fecha(version.fecha)}</span>
                    <span className="ml-1.5 text-tinta-suave">
                      {version.es_actual
                        ? "vigente"
                        : version.denticion === "temporal"
                          ? "temporal"
                          : ""}
                    </span>
                  </button>
                </li>
              )
            })}
        </ol>

        {puedeEditar && (
          <Boton variante="contorno" onClick={() => setNuevaVersion(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Nueva versión
          </Boton>
        )}
      </div>

      {versionVista !== null && (
        <p className="rounded-lg border border-linea bg-esmalte px-3 py-2 text-sm text-tinta-suave">
          Estás viendo una versión histórica. Es de solo lectura: para registrar algo nuevo,
          vuelve a la vigente.
        </p>
      )}

      {!soloLectura && (
        <Tarjeta className="space-y-4 p-4">
          <BarraPincel condicion={condicion} estado={estado} alSoltar={() => setCondicion(null)} />
          <PaletaCondiciones
            condiciones={catalogos.data.condiciones}
            condicionElegida={condicion}
            estadoElegido={estado}
            onElegirCondicion={(c) => {
              setCondicion(c)
              setAviso(null)
            }}
            onElegirEstado={setEstado}
          />
        </Tarjeta>
      )}

      <Tarjeta className="p-4">
        {datos ? (
          <Odontograma
            datos={datos}
            catalogos={catalogos.data}
            soloLectura={soloLectura}
            onElegirCara={alElegirCara}
          />
        ) : (
          <div className="grid place-items-center py-10 text-marca">
            <Cargando label="Cargando la versión" />
          </div>
        )}
      </Tarjeta>

      {aviso && <Aviso tono={aviso.tono}>{aviso.texto}</Aviso>}

      {datos && datos.hallazgos.length > 0 && (
        <Tarjeta className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-linea text-left text-tinta-suave">
              <tr>
                <th className="px-4 py-2.5 font-medium">Pieza</th>
                <th className="px-4 py-2.5 font-medium">Hallazgo</th>
                <th className="px-4 py-2.5 font-medium">Caras</th>
                <th className="px-4 py-2.5 font-medium">Clase</th>
                <th className="px-4 py-2.5 font-medium">Estado</th>
                <th className="px-4 py-2.5 font-medium">Fecha</th>
                {!soloLectura && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody>
              {agrupar(datos.hallazgos, catalogos.data).map((grupo) => (
                <tr key={grupo.clave} className="border-b border-linea last:border-0">
                  <td className="tabular px-4 py-2 font-mono">{grupo.codigo_fdi}</td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-3 w-3 shrink-0 rounded-sm"
                        style={{ backgroundColor: grupo.color_hex }}
                        aria-hidden
                      />
                      {grupo.condicion_nombre}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="font-mono text-tinta-suave">
                      {[...(grupo.pieza ? ["pieza"] : []), ...grupo.caras.map((h) => h.superficie)].join(
                        " · ",
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-tinta-suave">
                    {grupo.clase ? `Clase ${grupo.clase}` : "—"}
                  </td>
                  <td className="px-4 py-2 text-tinta-suave">{ESTADO_HALLAZGO[grupo.estado]}</td>
                  <td className="tabular whitespace-nowrap px-4 py-2 text-tinta-suave">
                    {fecha(grupo.fecha)}
                  </td>
                  {!soloLectura && (
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => quitarGrupo(grupo)}
                        aria-label={`Quitar ${grupo.condicion_nombre} de la pieza ${grupo.codigo_fdi}`}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-tinta-suave hover:bg-marca-tenue hover:text-marca"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        Quitar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </Tarjeta>
      )}

      {!soloLectura && datos && datos.hallazgos.length > 0 && (
        <p className="text-xs text-tinta-suave">
          «Quitar» borra la condición de esa pieza con todas sus caras. Para quitar sólo una cara,
          elige la misma condición en el pincel y pulsa esa cara en el dibujo.
        </p>
      )}

      <Dialogo
        abierto={nuevaVersion}
        alCerrar={() => setNuevaVersion(false)}
        titulo="Nueva versión del odontograma"
        ancho="sm"
      >
        <FormularioVersion
          denticionActual={vigente.data.denticion}
          alCerrar={() => setNuevaVersion(false)}
          crear={async (datosVersion) => {
            await crearVersion.mutateAsync(datosVersion)
            setVersionVista(null)
          }}
        />
      </Dialogo>
    </div>
  )
}
