import { useRef, useState, type ChangeEvent, type FormEvent } from "react"
import { Download, FileText, ImageOff, Paperclip, Plus, Trash2, Upload } from "lucide-react"

import { ApiError } from "../../api/client"
import type { ArchivoClinico, TipoArchivo } from "../../api/tipos"
import { Cargando } from "../../components/brand"
import {
  Aviso,
  Boton,
  Campo,
  CampoFecha,
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
  useActualizarArchivo,
  useArchivos,
  useComprobante,
  useContenido,
  useQuitarArchivo,
  useSubirArchivo,
} from "./consultas"
import { ACEPTA, TIPOS_ARCHIVO, peso, tipoArchivo } from "./textos"

const TIPOS = Object.entries(TIPOS_ARCHIVO) as [TipoArchivo, string][]

function mensaje(e: unknown, porDefecto: string): string {
  return e instanceof ApiError ? e.detail : porDefecto
}

/** El contenido a tamaño completo: la imagen, o el PDF en su visor. */
function Contenido({ archivoId, mime, nombre }: { archivoId: number; mime: string; nombre: string }) {
  const { url, cargando, error } = useContenido(archivoId)

  if (error) return <ErrorCarga error={error} />
  if (cargando || !url) {
    return (
      <div className="grid h-64 place-items-center text-marca">
        <Cargando label="Cargando el archivo" />
      </div>
    )
  }
  return (
    <div>
      {mime === "application/pdf" ? (
        <iframe src={url} title={nombre} className="h-[60vh] w-full rounded-lg border border-linea" />
      ) : (
        <img
          src={url}
          alt={nombre}
          className="mx-auto max-h-[60vh] rounded-lg border border-linea object-contain"
        />
      )}
      <a
        href={url}
        download={nombre}
        className="mt-2 inline-flex items-center gap-1.5 text-sm text-tinta-suave hover:text-marca"
      >
        <Download className="h-4 w-4" aria-hidden />
        Descargar
      </a>
    </div>
  )
}

/** Recuadro pequeño: la foto, o un icono si es un PDF o una referencia sin archivo. */
function Miniatura({ documento }: { documento: ArchivoClinico }) {
  const esImagen = documento.archivo?.mime.startsWith("image/") ?? false
  const { url } = useContenido(esImagen ? documento.archivo?.id : null)

  if (esImagen && url) {
    return <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
  }
  const Icono = documento.archivo ? FileText : ImageOff
  return (
    <span className="grid h-full w-full place-items-center bg-esmalte text-tinta-suave">
      <Icono className="h-6 w-6" aria-hidden />
    </span>
  )
}

function nombreDe(documento: ArchivoClinico): string {
  return documento.titulo ?? tipoArchivo(documento.tipo)
}

/** Ver un archivo, corregir sus datos o quitarlo. */
function VisorArchivo({
  documento,
  pacienteId,
  alCerrar,
}: {
  documento: ArchivoClinico | null
  pacienteId: number
  alCerrar: () => void
}) {
  return (
    <Dialogo
      abierto={documento !== null}
      alCerrar={alCerrar}
      titulo={documento ? nombreDe(documento) : ""}
      descripcion={documento?.archivo ? peso(documento.archivo.bytes) : undefined}
      ancho="lg"
    >
      {documento && (
        <FormularioArchivo documento={documento} pacienteId={pacienteId} alCerrar={alCerrar} />
      )}
    </Dialogo>
  )
}

function FormularioArchivo({
  documento,
  pacienteId,
  alCerrar,
}: {
  documento: ArchivoClinico
  pacienteId: number
  alCerrar: () => void
}) {
  const avisar = useAviso()
  const { puede } = useAuth()
  const actualizar = useActualizarArchivo(pacienteId)
  const quitar = useQuitarArchivo(pacienteId)
  const [tipo, setTipo] = useState(documento.tipo as TipoArchivo)
  const [titulo, setTitulo] = useState(documento.titulo ?? "")
  const [pieza, setPieza] = useState(documento.codigo_fdi ? String(documento.codigo_fdi) : "")
  const [tomado, setTomado] = useState(documento.tomado_en ?? "")
  const [fallo, setFallo] = useState<string | null>(null)

  const edita = puede("doctor", "asistente", "recepcion")

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    setFallo(null)
    try {
      await actualizar.mutateAsync({
        id: documento.id,
        datos: {
          tipo,
          titulo: titulo.trim() || null,
          codigo_fdi: pieza ? Number(pieza) : null,
          tomado_en: tomado || null,
        },
      })
      avisar("Archivo actualizado")
      alCerrar()
    } catch (e) {
      setFallo(mensaje(e, "No se pudo guardar"))
    }
  }

  async function alQuitar() {
    setFallo(null)
    try {
      await quitar.mutateAsync(documento.id)
      avisar("Archivo quitado del expediente")
      alCerrar()
    } catch (e) {
      setFallo(mensaje(e, "No se pudo quitar el archivo"))
    }
  }

  return (
    <form onSubmit={guardar} noValidate>
      {documento.archivo ? (
        <Contenido
          archivoId={documento.archivo.id}
          mime={documento.archivo.mime}
          nombre={documento.archivo.nombre_original}
        />
      ) : (
        <Aviso tono="info">
          Este registro es una referencia a un archivo que vive fuera del sistema
          {documento.url ? ` (${documento.url})` : ""}: aquí no hay nada que mostrar.
        </Aviso>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Selector
          etiqueta="Tipo"
          value={tipo}
          disabled={!edita}
          onChange={(e) => setTipo(e.target.value as TipoArchivo)}
        >
          {TIPOS.map(([valor, etiqueta]) => (
            <option key={valor} value={valor}>
              {etiqueta}
            </option>
          ))}
        </Selector>
        <Campo
          etiqueta="Título"
          value={titulo}
          disabled={!edita}
          placeholder="Opcional"
          onChange={(e) => setTitulo(e.target.value)}
        />
        <Campo
          etiqueta="Pieza (FDI)"
          inputMode="numeric"
          value={pieza}
          disabled={!edita}
          placeholder="Opcional"
          onChange={(e) => setPieza(e.target.value.replace(/\D/g, "").slice(0, 2))}
        />
        <CampoFecha
          etiqueta="Fecha de la toma"
          value={tomado}
          disabled={!edita}
          onChange={(e) => setTomado(e.target.value)}
        />
      </div>

      {fallo && <Aviso className="mt-4">{fallo}</Aviso>}

      <PieDialogo>
        {puede("doctor") && (
          <Boton
            type="button"
            variante="plano"
            className="mr-auto"
            disabled={quitar.isPending}
            onClick={alQuitar}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Quitar del expediente
          </Boton>
        )}
        <Boton type="button" variante="contorno" onClick={alCerrar}>
          Cerrar
        </Boton>
        {edita && (
          <Boton type="submit" disabled={actualizar.isPending}>
            Guardar
          </Boton>
        )}
      </PieDialogo>
    </form>
  )
}

/** Elegir archivos y decir qué son, antes de subirlos. */
function DialogoSubir({
  abierto,
  alCerrar,
  pacienteId,
}: {
  abierto: boolean
  alCerrar: () => void
  pacienteId: number
}) {
  return (
    <Dialogo
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Subir fotos o exámenes"
      descripcion="Imágenes (JPG, PNG, WebP) o PDF, hasta 25 MB cada uno."
    >
      <FormularioSubir pacienteId={pacienteId} alCerrar={alCerrar} />
    </Dialogo>
  )
}

function FormularioSubir({ pacienteId, alCerrar }: { pacienteId: number; alCerrar: () => void }) {
  const avisar = useAviso()
  const subir = useSubirArchivo(pacienteId)
  const [archivos, setArchivos] = useState<File[]>([])
  const [tipo, setTipo] = useState<TipoArchivo>("radiografia_periapical")
  const [titulo, setTitulo] = useState("")
  const [pieza, setPieza] = useState("")
  const [tomado, setTomado] = useState("")
  const [fallo, setFallo] = useState<string | null>(null)
  const [subiendo, setSubiendo] = useState(false)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setFallo(null)
    setSubiendo(true)
    try {
      // De uno en uno: si el tercero falla, los dos primeros ya están guardados
      // y el mensaje dice cuál fue.
      for (const archivo of archivos) {
        try {
          await subir.mutateAsync({
            archivo,
            tipo,
            titulo: archivos.length === 1 ? titulo.trim() : undefined,
            codigo_fdi: pieza ? Number(pieza) : undefined,
            tomado_en: tomado || undefined,
          })
        } catch (e) {
          throw new Error(`${archivo.name}: ${mensaje(e, "no se pudo subir")}`, { cause: e })
        }
      }
      avisar(archivos.length === 1 ? "Archivo subido" : `${archivos.length} archivos subidos`)
      alCerrar()
    } catch (e) {
      setFallo(e instanceof Error ? e.message : "No se pudo subir")
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <form onSubmit={enviar} noValidate>
      <label className="block text-sm font-medium" htmlFor="archivos-subida">
        Archivos
      </label>
      <input
        id="archivos-subida"
        type="file"
        multiple
        accept={ACEPTA}
        onChange={(e) => setArchivos(Array.from(e.target.files ?? []))}
        className="mt-1.5 block w-full text-sm file:mr-3 file:rounded-lg file:border file:border-linea-fuerte file:bg-superficie file:px-3 file:py-1.5 file:text-sm file:font-medium"
      />

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Selector etiqueta="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoArchivo)}>
          {TIPOS.map(([valor, etiqueta]) => (
            <option key={valor} value={valor}>
              {etiqueta}
            </option>
          ))}
        </Selector>
        <CampoFecha
          etiqueta="Fecha de la toma"
          value={tomado}
          onChange={(e) => setTomado(e.target.value)}
        />
        {archivos.length <= 1 && (
          <Campo
            etiqueta="Título"
            value={titulo}
            placeholder="Opcional"
            onChange={(e) => setTitulo(e.target.value)}
          />
        )}
        <Campo
          etiqueta="Pieza (FDI)"
          inputMode="numeric"
          value={pieza}
          placeholder="Opcional"
          onChange={(e) => setPieza(e.target.value.replace(/\D/g, "").slice(0, 2))}
        />
      </div>

      {fallo && <Aviso className="mt-4">{fallo}</Aviso>}

      <PieDialogo>
        <Boton type="button" variante="contorno" onClick={alCerrar}>
          Cancelar
        </Boton>
        <Boton type="submit" disabled={archivos.length === 0 || subiendo}>
          <Upload className="h-4 w-4" aria-hidden />
          {subiendo ? "Subiendo…" : "Subir"}
        </Boton>
      </PieDialogo>
    </form>
  )
}

/** Las fotos y los exámenes del expediente. */
export function SeccionArchivos({ pacienteId }: { pacienteId: number }) {
  const { puede } = useAuth()
  const { data, isPending, error } = useArchivos(pacienteId)
  const [subiendo, setSubiendo] = useState(false)
  const [abierto, setAbierto] = useState<ArchivoClinico | null>(null)

  const sube = puede("doctor", "asistente", "recepcion")

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Fotos y exámenes</h2>
        {sube && (
          <Boton variante="contorno" className="py-1.5" onClick={() => setSubiendo(true)}>
            <Upload className="h-4 w-4" aria-hidden />
            Subir
          </Boton>
        )}
      </div>

      {error ? (
        <ErrorCarga error={error} />
      ) : isPending ? (
        <div className="h-32 animate-pulse rounded-xl border border-linea bg-superficie" />
      ) : data.length === 0 ? (
        <Tarjeta>
          <Vacio
            titulo="Sin fotos ni exámenes"
            descripcion="Radiografías, tomografías, analíticas y fotografías clínicas aparecerán aquí."
          />
        </Tarjeta>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {data.map((documento) => (
            <li key={documento.id}>
              <button
                type="button"
                onClick={() => setAbierto(documento)}
                className="group block w-full overflow-hidden rounded-xl border border-linea bg-superficie text-left hover:border-tinta-suave"
              >
                <span className="block aspect-[4/3] overflow-hidden">
                  <Miniatura documento={documento} />
                </span>
                <span className="block px-2.5 py-2 text-sm">
                  <span className="block truncate font-medium">{nombreDe(documento)}</span>
                  <span className="tabular block truncate text-xs text-tinta-suave">
                    {[
                      documento.titulo ? tipoArchivo(documento.tipo) : null,
                      documento.codigo_fdi ? `pieza ${documento.codigo_fdi}` : null,
                      fecha(documento.tomado_en ?? documento.creado_en),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <DialogoSubir abierto={subiendo} alCerrar={() => setSubiendo(false)} pacienteId={pacienteId} />
      <VisorArchivo documento={abierto} pacienteId={pacienteId} alCerrar={() => setAbierto(null)} />
    </section>
  )
}

/** Botón que abre el selector de archivos del sistema. */
function BotonArchivo({
  etiqueta,
  multiple = false,
  ocupado = false,
  alElegir,
  icono = "mas",
}: {
  etiqueta: string
  multiple?: boolean
  ocupado?: boolean
  alElegir: (archivos: File[]) => void
  icono?: "mas" | "clip"
}) {
  const entrada = useRef<HTMLInputElement>(null)
  const Icono = icono === "clip" ? Paperclip : Plus

  function alCambiar(evento: ChangeEvent<HTMLInputElement>) {
    const elegidos = Array.from(evento.target.files ?? [])
    // Se vacía para que elegir otra vez el mismo archivo vuelva a disparar el cambio.
    evento.target.value = ""
    if (elegidos.length > 0) alElegir(elegidos)
  }

  return (
    <>
      <input
        ref={entrada}
        type="file"
        accept={ACEPTA}
        multiple={multiple}
        onChange={alCambiar}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />
      <button
        type="button"
        disabled={ocupado}
        onClick={() => entrada.current?.click()}
        className="no-imprimir inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-tinta-suave hover:bg-marca-tenue hover:text-marca disabled:opacity-50"
      >
        <Icono className="h-3.5 w-3.5" aria-hidden />
        {ocupado ? "Subiendo…" : etiqueta}
      </button>
    </>
  )
}

/** Las fotos de una consulta, dentro de su fila del historial. */
export function FotosConsulta({
  pacienteId,
  consultaId,
  edita,
}: {
  pacienteId: number
  consultaId: number
  edita: boolean
}) {
  const avisar = useAviso()
  const { data } = useArchivos(pacienteId)
  const subir = useSubirArchivo(pacienteId)
  const [abierto, setAbierto] = useState<ArchivoClinico | null>(null)
  const [fallo, setFallo] = useState<string | null>(null)
  const [subiendo, setSubiendo] = useState(false)

  // Sólo lo que tiene archivo: una referencia externa no tiene nada que enseñar aquí.
  const fotos = (data ?? []).filter((d) => d.consulta_id === consultaId && d.archivo !== null)
  if (fotos.length === 0 && !edita) return null

  async function alElegir(archivos: File[]) {
    setFallo(null)
    setSubiendo(true)
    try {
      for (const archivo of archivos) {
        await subir.mutateAsync({ archivo, tipo: "foto", consulta_id: consultaId })
      }
      avisar(archivos.length === 1 ? "Foto añadida a la consulta" : "Fotos añadidas a la consulta")
    } catch (e) {
      setFallo(mensaje(e, "No se pudo subir la foto"))
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center gap-2">
        {fotos.map((foto) => (
          <button
            key={foto.id}
            type="button"
            onClick={() => setAbierto(foto)}
            aria-label={`Ver ${nombreDe(foto)}`}
            className="h-12 w-16 overflow-hidden rounded-lg border border-linea hover:border-tinta-suave"
          >
            <Miniatura documento={foto} />
          </button>
        ))}
        {edita && (
          <BotonArchivo etiqueta="Foto" multiple ocupado={subiendo} alElegir={alElegir} />
        )}
      </div>
      {fallo && <p className="mt-1 text-xs text-tinta-suave">{fallo}</p>}
      <VisorArchivo documento={abierto} pacienteId={pacienteId} alCerrar={() => setAbierto(null)} />
    </div>
  )
}

/** El comprobante de un pago o de un gasto: adjuntarlo, verlo o quitarlo. */
export function Comprobante({
  de,
  id,
  comprobanteId,
  edita,
}: {
  de: "pagos" | "gastos"
  id: number
  comprobanteId: number | null | undefined
  edita: boolean
}) {
  const avisar = useAviso()
  const { adjuntar, quitar } = useComprobante(de, id)
  const [viendo, setViendo] = useState(false)
  const [fallo, setFallo] = useState<string | null>(null)

  async function alElegir([archivo]: File[]) {
    setFallo(null)
    try {
      await adjuntar.mutateAsync(archivo)
      avisar("Comprobante adjuntado")
    } catch (e) {
      setFallo(mensaje(e, "No se pudo adjuntar"))
    }
  }

  async function alQuitar() {
    try {
      await quitar.mutateAsync()
      avisar("Comprobante quitado")
      setViendo(false)
    } catch (e) {
      setFallo(mensaje(e, "No se pudo quitar"))
    }
  }

  if (comprobanteId == null) {
    if (!edita) return null
    return (
      <span title={fallo ?? undefined}>
        <BotonArchivo
          etiqueta={fallo ? "Reintentar" : "Adjuntar"}
          icono="clip"
          ocupado={adjuntar.isPending}
          alElegir={alElegir}
        />
      </span>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setViendo(true)}
        className="no-imprimir inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-marca hover:bg-marca-tenue"
      >
        <Paperclip className="h-3.5 w-3.5" aria-hidden />
        Comprobante
      </button>
      <Dialogo abierto={viendo} alCerrar={() => setViendo(false)} titulo="Comprobante" ancho="lg">
        <VistaComprobante archivoId={comprobanteId} />
        {fallo && <Aviso className="mt-4">{fallo}</Aviso>}
        <PieDialogo>
          {edita && (
            <Boton
              type="button"
              variante="plano"
              className="mr-auto"
              disabled={quitar.isPending}
              onClick={alQuitar}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Quitar
            </Boton>
          )}
          <Boton type="button" variante="contorno" onClick={() => setViendo(false)}>
            Cerrar
          </Boton>
        </PieDialogo>
      </Dialogo>
    </>
  )
}

/** Un comprobante no trae su tipo en la fila: se deduce del contenido. */
function VistaComprobante({ archivoId }: { archivoId: number }) {
  const { url, cargando, error } = useContenido(archivoId)
  const [esPdf, setEsPdf] = useState(false)

  if (error) return <ErrorCarga error={error} />
  if (cargando || !url) {
    return (
      <div className="grid h-64 place-items-center text-marca">
        <Cargando label="Cargando el comprobante" />
      </div>
    )
  }
  return (
    <div>
      {esPdf ? (
        <iframe src={url} title="Comprobante" className="h-[60vh] w-full rounded-lg border border-linea" />
      ) : (
        <img
          src={url}
          alt="Comprobante"
          onError={() => setEsPdf(true)}
          className="mx-auto max-h-[60vh] rounded-lg border border-linea object-contain"
        />
      )}
      <a
        href={url}
        download="comprobante"
        className="mt-2 inline-flex items-center gap-1.5 text-sm text-tinta-suave hover:text-marca"
      >
        <Download className="h-4 w-4" aria-hidden />
        Descargar
      </a>
    </div>
  )
}
