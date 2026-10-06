import { useState, type FormEvent } from "react"
import { Ban, FilePlus2, PenLine, Pill, Plus, Printer, Trash2 } from "lucide-react"
import { Link } from "react-router-dom"

import { ApiError } from "../../api/client"
import type { Borrador, Documento, PacienteDetalle } from "../../api/tipos"
import { Cargando } from "../../components/brand"
import {
  AreaTexto,
  Aviso,
  Boton,
  Campo,
  Dialogo,
  DialogoMotivo,
  ErrorCarga,
  EsqueletoTabla,
  Insignia,
  PieDialogo,
  Selector,
  Tarjeta,
  Vacio,
  useAviso,
} from "../../components/ui"
import { doctor as tratamiento, fecha } from "../../lib/formato"
import { SeccionArchivos } from "../archivos/Archivos"
import { useAuth } from "../auth/contexto"
import { useDoctores } from "../catalogo/consultas"
import {
  pedirBorrador,
  pedirEnlaceDeFirma,
  useAnularDocumento,
  useDocumentos,
  useEmitirDocumento,
  usePlantillas,
  useRecetar,
} from "./consultas"
import { TIPOS } from "./textos"

const ENTRADA =
  "min-w-0 rounded-lg border border-linea-fuerte bg-superficie px-2 py-1.5 text-sm placeholder:text-tinta-suave/60"

/** Elegir plantilla, revisar el texto ya combinado y emitir. */
function DialogoEmitir({
  abierto,
  alCerrar,
  paciente,
  soloTipo,
}: {
  abierto: boolean
  alCerrar: () => void
  paciente: PacienteDetalle
  /** Para el atajo «firmar datos personales»: abre directamente esa plantilla. */
  soloTipo?: string
}) {
  return (
    <Dialogo
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Nuevo documento"
      descripcion={`${paciente.nombres} ${paciente.apellidos}`}
      ancho="lg"
    >
      <FormularioEmitir paciente={paciente} alCerrar={alCerrar} soloTipo={soloTipo} />
    </Dialogo>
  )
}

function FormularioEmitir({
  paciente,
  alCerrar,
  soloTipo,
}: {
  paciente: PacienteDetalle
  alCerrar: () => void
  soloTipo?: string
}) {
  const avisar = useAviso()
  const { data: plantillas } = usePlantillas()
  const emitir = useEmitirDocumento(paciente.id)
  const [borrador, setBorrador] = useState<Borrador | null>(null)
  const [titulo, setTitulo] = useState("")
  const [cuerpo, setCuerpo] = useState("")
  const [cargando, setCargando] = useState(false)
  const [fallo, setFallo] = useState<string | null>(null)

  const disponibles = (plantillas ?? []).filter((p) => !soloTipo || p.tipo === soloTipo)

  async function elegir(plantillaId: string) {
    setFallo(null)
    if (!plantillaId) {
      setBorrador(null)
      return
    }
    setCargando(true)
    try {
      const combinado = await pedirBorrador(paciente.id, Number(plantillaId))
      setBorrador(combinado)
      setTitulo(combinado.titulo)
      setCuerpo(combinado.cuerpo)
    } catch (e) {
      setFallo(e instanceof ApiError ? e.detail : "No se pudo preparar el documento")
    } finally {
      setCargando(false)
    }
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (!borrador) return
    setFallo(null)
    try {
      await emitir.mutateAsync({
        tipo: borrador.tipo,
        titulo: titulo.trim(),
        cuerpo,
        plantilla_id: borrador.plantilla_id,
        requiere_firma: borrador.requiere_firma,
      })
      avisar("Documento emitido")
      alCerrar()
    } catch (e) {
      setFallo(e instanceof ApiError ? e.detail : "No se pudo emitir el documento")
    }
  }

  // Lo que la plantilla no pudo rellenar queda a la vista entre corchetes.
  const huecos = cuerpo.match(/\[[a-z_]+: [a-z_]+\]|\[[a-z_.]+\]|___/g) ?? []

  return (
    <form onSubmit={enviar} noValidate>
      <Selector
        etiqueta="Plantilla"
        autoFocus
        defaultValue=""
        onChange={(e) => elegir(e.target.value)}
      >
        <option value="">Elige qué documento emitir</option>
        {disponibles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.titulo}
            {p.requiere_firma ? " · se firma" : ""}
          </option>
        ))}
      </Selector>

      {cargando && (
        <div className="grid place-items-center py-8 text-marca">
          <Cargando label="Preparando el documento" />
        </div>
      )}

      {borrador && !cargando && (
        <div className="mt-4 space-y-4">
          <Campo etiqueta="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          <AreaTexto
            etiqueta="Contenido"
            rows={12}
            value={cuerpo}
            onChange={(e) => setCuerpo(e.target.value)}
            ayuda="Puedes corregirlo antes de emitir. Después ya no cambia: se anula y se emite otro."
          />
          {huecos.length > 0 && (
            <Aviso tono="advertencia">
              Quedan datos por completar: {[...new Set(huecos)].join(", ")}. Corrígelos en el texto
              antes de emitir.
            </Aviso>
          )}
        </div>
      )}

      {fallo && <Aviso className="mt-4">{fallo}</Aviso>}

      <PieDialogo>
        <Boton type="button" variante="contorno" onClick={alCerrar}>
          Cancelar
        </Boton>
        <Boton type="submit" disabled={!borrador || !titulo.trim() || !cuerpo.trim() || emitir.isPending}>
          Emitir documento
        </Boton>
      </PieDialogo>
    </form>
  )
}

type Renglon = { medicamento: string; dosis: string; frecuencia: string; duracion: string }
const RENGLON: Renglon = { medicamento: "", dosis: "", frecuencia: "", duracion: "" }

/** Receta: un renglón por medicamento. Si choca con una alergia, hay que confirmarlo. */
function DialogoReceta({
  abierto,
  alCerrar,
  paciente,
}: {
  abierto: boolean
  alCerrar: () => void
  paciente: PacienteDetalle
}) {
  return (
    <Dialogo
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Nueva receta"
      descripcion={`${paciente.nombres} ${paciente.apellidos}`}
      ancho="lg"
    >
      <FormularioReceta paciente={paciente} alCerrar={alCerrar} />
    </Dialogo>
  )
}

function FormularioReceta({ paciente, alCerrar }: { paciente: PacienteDetalle; alCerrar: () => void }) {
  const avisar = useAviso()
  const { usuario } = useAuth()
  const { data: doctores } = useDoctores()
  const recetar = useRecetar(paciente.id)
  const [doctorId, setDoctorId] = useState(String(usuario?.doctor_id ?? paciente.doctor_tratante_id ?? ""))
  const [renglones, setRenglones] = useState<Renglon[]>([RENGLON])
  const [indicaciones, setIndicaciones] = useState("")
  const [fallo, setFallo] = useState<string | null>(null)
  /** El último intento chocó con una alergia registrada. */
  const [choque, setChoque] = useState<string | null>(null)

  const completos = renglones.filter((r) => r.medicamento.trim())
  const validos = completos.every((r) => r.dosis.trim() && r.frecuencia.trim())

  function cambiar(i: number, campo: keyof Renglon, valor: string) {
    setRenglones(renglones.map((r, j) => (j === i ? { ...r, [campo]: valor } : r)))
    setChoque(null)
  }

  async function enviar(confirmar: boolean) {
    setFallo(null)
    try {
      await recetar.mutateAsync({
        doctor_id: Number(doctorId),
        indicaciones: indicaciones.trim() || null,
        items: completos.map((r) => ({
          medicamento: r.medicamento.trim(),
          dosis: r.dosis.trim(),
          frecuencia: r.frecuencia.trim(),
          duracion: r.duracion.trim() || null,
        })),
        confirmar_alergias: confirmar,
      })
      avisar("Receta guardada")
      alCerrar()
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setChoque(e.detail)
      else setFallo(e instanceof ApiError ? e.detail : "No se pudo guardar la receta")
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        enviar(false)
      }}
      noValidate
    >
      <Selector etiqueta="Doctor" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
        <option value="">Elige el doctor</option>
        {doctores?.map((d) => (
          <option key={d.id} value={d.id}>
            {tratamiento(d.nombre_completo)}
          </option>
        ))}
      </Selector>

      <fieldset className="mt-4">
        <legend className="mb-2 text-sm font-medium">Medicamentos</legend>
        <ul className="space-y-2">
          {renglones.map((r, i) => (
            <li key={i} className="grid items-center gap-2 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]">
              <input
                aria-label={`Medicamento ${i + 1}`}
                placeholder="Amoxicilina 500 mg"
                value={r.medicamento}
                onChange={(e) => cambiar(i, "medicamento", e.target.value)}
                className={ENTRADA}
              />
              <input
                aria-label={`Dosis ${i + 1}`}
                placeholder="1 cápsula"
                value={r.dosis}
                onChange={(e) => cambiar(i, "dosis", e.target.value)}
                className={ENTRADA}
              />
              <input
                aria-label={`Frecuencia ${i + 1}`}
                placeholder="Cada 8 horas"
                value={r.frecuencia}
                onChange={(e) => cambiar(i, "frecuencia", e.target.value)}
                className={ENTRADA}
              />
              <input
                aria-label={`Duración ${i + 1}`}
                placeholder="7 días"
                value={r.duracion}
                onChange={(e) => cambiar(i, "duracion", e.target.value)}
                className={ENTRADA}
              />
              <button
                type="button"
                onClick={() =>
                  setRenglones(renglones.length > 1 ? renglones.filter((_, j) => j !== i) : [RENGLON])
                }
                aria-label={`Quitar el medicamento ${i + 1}`}
                className="justify-self-start rounded-lg p-1.5 text-tinta-suave hover:bg-marca-tenue hover:text-marca"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
        <Boton
          type="button"
          variante="plano"
          className="-ml-2 mt-2"
          onClick={() => setRenglones([...renglones, RENGLON])}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Añadir medicamento
        </Boton>
      </fieldset>

      <AreaTexto
        etiqueta="Indicaciones"
        opcional
        rows={2}
        className="mt-3"
        placeholder="Tomar con alimentos. Suspender si aparece erupción."
        value={indicaciones}
        onChange={(e) => setIndicaciones(e.target.value)}
      />

      {fallo && <Aviso className="mt-4">{fallo}</Aviso>}

      {choque && (
        <Aviso className="mt-4">
          <p className="font-semibold">Alergia registrada</p>
          <p className="mt-1">{choque}.</p>
          <Boton
            type="button"
            variante="contorno"
            className="mt-3"
            disabled={recetar.isPending}
            onClick={() => enviar(true)}
          >
            Recetar de todos modos
          </Boton>
        </Aviso>
      )}

      <PieDialogo>
        <Boton type="button" variante="contorno" onClick={alCerrar}>
          Cancelar
        </Boton>
        <Boton
          type="submit"
          disabled={!doctorId || completos.length === 0 || !validos || recetar.isPending}
        >
          Guardar receta
        </Boton>
      </PieDialogo>
    </form>
  )
}

/** El enlace para firmar: se abre aquí mismo o se copia para el teléfono del paciente. */
function DialogoFirma({ documento, alCerrar }: { documento: Documento | null; alCerrar: () => void }) {
  return (
    <Dialogo
      abierto={documento !== null}
      alCerrar={alCerrar}
      titulo="Pedir la firma"
      descripcion={documento?.titulo}
      ancho="sm"
    >
      {documento && <EnlaceFirma documento={documento} />}
    </Dialogo>
  )
}

function EnlaceFirma({ documento }: { documento: Documento }) {
  const [enlace, setEnlace] = useState<{ url: string; minutos: number } | null>(null)
  const [fallo, setFallo] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  async function generar() {
    setFallo(null)
    try {
      const { token, minutos } = await pedirEnlaceDeFirma(documento.id)
      setEnlace({ url: `${window.location.origin}/firmar/${token}`, minutos })
    } catch (e) {
      setFallo(e instanceof ApiError ? e.detail : "No se pudo generar el enlace")
    }
  }

  if (!enlace) {
    return (
      <div>
        <p className="text-sm text-tinta-suave">
          Se genera un enlace que sirve sólo para firmar este documento. Quien firma no entra a la
          aplicación ni ve nada más del expediente.
        </p>
        {fallo && <Aviso className="mt-3">{fallo}</Aviso>}
        <PieDialogo>
          <Boton onClick={generar}>Generar enlace de firma</Boton>
        </PieDialogo>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm text-tinta-suave">
        Válido durante {enlace.minutos} minutos y para una sola firma.
      </p>
      <input
        readOnly
        value={enlace.url}
        aria-label="Enlace de firma"
        onFocus={(e) => e.target.select()}
        className="mt-3 block w-full rounded-lg border border-linea-fuerte bg-esmalte px-3 py-2 font-mono text-xs"
      />
      <PieDialogo>
        <Boton
          variante="contorno"
          onClick={async () => {
            await navigator.clipboard?.writeText(enlace.url)
            setCopiado(true)
          }}
        >
          {copiado ? "Copiado" : "Copiar enlace"}
        </Boton>
        <a
          href={enlace.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-marca px-3.5 py-2 text-sm font-medium text-esmalte transition-colors hover:bg-marca-viva"
        >
          Abrir para firmar aquí
        </a>
      </PieDialogo>
    </div>
  )
}

/** Lo que se le entrega o se le hace firmar al paciente, y sus recetas. */
export function PanelDocumentos({ paciente }: { paciente: PacienteDetalle }) {
  const avisar = useAviso()
  const { puede } = useAuth()
  const { data, isPending, error } = useDocumentos(paciente.id)
  const anular = useAnularDocumento(paciente.id)
  const [emitiendo, setEmitiendo] = useState<{ tipo?: string } | null>(null)
  const [recetando, setRecetando] = useState(false)
  const [firmando, setFirmando] = useState<Documento | null>(null)
  const [anulando, setAnulando] = useState<Documento | null>(null)

  const emite = puede("doctor", "asistente", "recepcion")
  const receta = puede("doctor")


  if (isPending) {
    return (
      <Tarjeta>
        <EsqueletoTabla filas={3} />
      </Tarjeta>
    )
  }
  if (error) return <ErrorCarga error={error} />

  return (
    <div className="space-y-5">
      {(emite || receta) && (
        <div className="flex flex-wrap justify-end gap-2">
          {receta && (
            <Boton variante="contorno" onClick={() => setRecetando(true)}>
              <Pill className="h-4 w-4" aria-hidden />
              Receta
            </Boton>
          )}
          {emite && (
            <Boton onClick={() => setEmitiendo({})}>
              <FilePlus2 className="h-4 w-4" aria-hidden />
              Nuevo documento
            </Boton>
          )}
        </div>
      )}

      {!data.datos_personales_firmados && (
        <Aviso tono="advertencia">
          <div className="flex flex-wrap items-center justify-between gap-3">
          <span>Falta el consentimiento de tratamiento de datos personales firmado.</span>
          {emite && (
            <Boton
              variante="contorno"
              className="py-1.5"
              onClick={() => setEmitiendo({ tipo: "consentimiento_datos" })}
            >
              Prepararlo
            </Boton>
          )}
          </div>
        </Aviso>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold">Documentos</h2>
        <Tarjeta className="overflow-hidden">
          {data.documentos.length === 0 ? (
            <Vacio
              titulo="Sin documentos"
              descripcion="Constancias, licencias, cuidados postoperatorios y consentimientos aparecerán aquí."
            />
          ) : (
            <ul>
              {data.documentos.map((d) => {
                const anulado = d.anulado_en !== null
                const firmado = d.firmas.length > 0
                return (
                  <li
                    key={d.id}
                    className={`flex flex-wrap items-center justify-between gap-3 border-b border-linea px-4 py-2.5 text-sm last:border-0 ${
                      anulado ? "text-tinta-suave" : ""
                    }`}
                  >
                    <span>
                      <Link to={`/documentos/${d.id}`} className="font-medium hover:underline">
                        {d.titulo}
                      </Link>
                      <span className="tabular ml-3 text-tinta-suave">{fecha(d.emitido_en)}</span>
                      <span className="ml-3 text-tinta-suave">{TIPOS[d.tipo] ?? d.tipo}</span>
                      {anulado && <Insignia className="ml-3">Anulado</Insignia>}
                      {!anulado && firmado && (
                        <Insignia className="ml-3">Firmado por {d.firmas[0].firmante_nombre}</Insignia>
                      )}
                      {!anulado && d.requiere_firma && !firmado && (
                        <Insignia className="ml-3 border-tinta text-tinta">Pendiente de firma</Insignia>
                      )}
                      {anulado && d.motivo_anulacion && (
                        <span className="block text-xs">Motivo: {d.motivo_anulacion}</span>
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      {emite && !anulado && d.requiere_firma && !firmado && (
                        <Boton variante="contorno" className="py-1.5" onClick={() => setFirmando(d)}>
                          <PenLine className="h-4 w-4" aria-hidden />
                          Firmar
                        </Boton>
                      )}
                      <Link
                        to={`/documentos/${d.id}`}
                        aria-label={`Ver e imprimir ${d.titulo}`}
                        className="rounded-lg p-1.5 text-tinta-suave hover:bg-marca-tenue hover:text-marca"
                      >
                        <Printer className="h-4 w-4" aria-hidden />
                      </Link>
                      {emite && !anulado && (
                        <button
                          type="button"
                          onClick={() => setAnulando(d)}
                          aria-label={`Anular ${d.titulo}`}
                          title="Anular"
                          className="rounded-lg p-1.5 text-tinta-suave hover:bg-marca-tenue hover:text-marca"
                        >
                          <Ban className="h-4 w-4" aria-hidden />
                        </button>
                      )}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </Tarjeta>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Recetas</h2>
        <Tarjeta className="overflow-hidden">
          {data.recetas.length === 0 ? (
            <Vacio titulo="Sin recetas" />
          ) : (
            <ul>
              {data.recetas.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-start justify-between gap-3 border-b border-linea px-4 py-2.5 text-sm last:border-0"
                >
                  <span>
                    <span className="tabular font-medium">{fecha(r.fecha)}</span>
                    <span className="ml-3 text-tinta-suave">{tratamiento(r.doctor_nombre)}</span>
                    <span className="mt-1 block text-tinta-suave">
                      {r.items.map((i) => i.medicamento).join(" · ")}
                    </span>
                  </span>
                  <Link
                    to={`/pacientes/${paciente.id}/recetas/${r.id}`}
                    aria-label={`Ver e imprimir la receta del ${fecha(r.fecha)}`}
                    className="rounded-lg p-1.5 text-tinta-suave hover:bg-marca-tenue hover:text-marca"
                  >
                    <Printer className="h-4 w-4" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      </section>

      <SeccionArchivos pacienteId={paciente.id} />

      <DialogoEmitir
        abierto={emitiendo !== null}
        alCerrar={() => setEmitiendo(null)}
        paciente={paciente}
        soloTipo={emitiendo?.tipo}
      />
      <DialogoReceta abierto={recetando} alCerrar={() => setRecetando(false)} paciente={paciente} />
      <DialogoFirma documento={firmando} alCerrar={() => setFirmando(null)} />
      <DialogoMotivo
        abierto={anulando !== null}
        alCerrar={() => setAnulando(null)}
        titulo="Anular documento"
        descripcion={anulando?.titulo}
        explicacion="El documento no se borra: queda marcado como anulado, con su motivo. Para corregirlo, anula y emite otro."
        accion="Anular documento"
        alConfirmar={async (motivo) => {
          if (!anulando) return
          await anular.mutateAsync({ id: anulando.id, motivo })
          avisar("Documento anulado")
        }}
      />
    </div>
  )
}
