import { useState, type FormEvent, type ReactNode } from "react"
import { Check, Pencil, Plus, Trash2, X } from "lucide-react"

import { ApiError } from "../../api/client"
import { Aviso, Boton, ErrorCarga, EsqueletoTabla, Tarjeta, Vacio, useAviso } from "../../components/ui"

export type Elemento = { id: number; nombre: string }

/**
 * Lista de un catálogo de nombres (categorías, especialidades): alta arriba,
 * renombrar en la propia fila y borrar sólo lo que no se usa.
 *
 * Añadir una fila no merece un diálogo: es un campo y un botón.
 */
export function ListaEditable<E extends Elemento>({
  elementos,
  cargando,
  error,
  edita,
  nombreSingular,
  placeholder,
  detalle,
  extra,
  puedeBorrar,
  motivoNoBorrar,
  alGuardar,
  alBorrar,
  vacio,
}: {
  elementos: E[] | undefined
  cargando: boolean
  error: unknown
  edita: boolean
  nombreSingular: string
  placeholder: string
  /** Texto secundario de la fila: cuántos servicios, quién la usa. */
  detalle: (elemento: E) => ReactNode
  /** Controles propios de la fila, a la izquierda de editar y borrar. */
  extra?: (elemento: E) => ReactNode
  puedeBorrar: (elemento: E) => boolean
  motivoNoBorrar: string
  alGuardar: (datos: { id?: number; nombre: string }) => Promise<unknown>
  alBorrar: (id: number) => Promise<unknown>
  vacio: string
}) {
  const avisar = useAviso()
  const [nuevo, setNuevo] = useState("")
  const [editando, setEditando] = useState<{ id: number; nombre: string } | null>(null)
  const [fallo, setFallo] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  async function intentar(accion: () => Promise<unknown>, hecho: string) {
    setFallo(null)
    setOcupado(true)
    try {
      await accion()
      avisar(hecho)
      return true
    } catch (e) {
      setFallo(e instanceof ApiError ? e.detail : "No se pudo guardar")
      return false
    } finally {
      setOcupado(false)
    }
  }

  async function alCrear(evento: FormEvent) {
    evento.preventDefault()
    const nombre = nuevo.trim()
    if (!nombre) return
    if (await intentar(() => alGuardar({ nombre }), `«${nombre}» añadida`)) setNuevo("")
  }

  async function alRenombrar(evento: FormEvent) {
    evento.preventDefault()
    if (!editando) return
    const nombre = editando.nombre.trim()
    if (!nombre) return
    if (await intentar(() => alGuardar({ id: editando.id, nombre }), "Nombre actualizado")) {
      setEditando(null)
    }
  }

  return (
    <div className="max-w-3xl">
      {edita && (
        <form onSubmit={alCrear} className="flex flex-wrap gap-2">
          <input
            value={nuevo}
            onChange={(e) => setNuevo(e.target.value)}
            placeholder={placeholder}
            aria-label={`Nombre de la nueva ${nombreSingular}`}
            className="w-72 max-w-full rounded-lg border border-linea-fuerte bg-superficie px-3 py-2 text-sm placeholder:text-tinta-suave/60"
          />
          <Boton type="submit" disabled={ocupado || !nuevo.trim()}>
            <Plus className="h-4 w-4" aria-hidden />
            Añadir {nombreSingular}
          </Boton>
        </form>
      )}

      {fallo && <Aviso className="mt-4">{fallo}</Aviso>}

      <Tarjeta className="mt-4 overflow-hidden">
        {cargando ? (
          <EsqueletoTabla />
        ) : error ? (
          <ErrorCarga error={error} className="m-4 border-0" />
        ) : !elementos?.length ? (
          <Vacio titulo={vacio} />
        ) : (
          <ul>
            {elementos.map((elemento) => (
              <li
                key={elemento.id}
                className="flex flex-wrap items-center gap-3 border-b border-linea px-4 py-2.5 text-sm last:border-0"
              >
                {editando?.id === elemento.id ? (
                  <form onSubmit={alRenombrar} className="flex flex-1 flex-wrap items-center gap-2">
                    <input
                      autoFocus
                      value={editando.nombre}
                      onChange={(e) => setEditando({ id: elemento.id, nombre: e.target.value })}
                      aria-label={`Nuevo nombre de ${elemento.nombre}`}
                      className="min-w-0 flex-1 rounded-lg border border-linea-fuerte bg-superficie px-3 py-1.5 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={ocupado}
                      aria-label="Guardar nombre"
                      className="rounded-lg p-1.5 text-marca hover:bg-marca-tenue"
                    >
                      <Check className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditando(null)}
                      aria-label="Cancelar"
                      className="rounded-lg p-1.5 text-tinta-suave hover:bg-esmalte"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </form>
                ) : (
                  <>
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">{elemento.nombre}</span>
                      <span className="ml-3 text-tinta-suave">{detalle(elemento)}</span>
                    </span>
                    {edita && (
                      <span className="flex items-center gap-1">
                        {extra?.(elemento)}
                        <button
                          type="button"
                          onClick={() => setEditando({ id: elemento.id, nombre: elemento.nombre })}
                          aria-label={`Renombrar ${elemento.nombre}`}
                          className="rounded-lg p-1.5 text-tinta-suave hover:bg-marca-tenue hover:text-marca"
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            intentar(() => alBorrar(elemento.id), `«${elemento.nombre}» eliminada`)
                          }
                          disabled={ocupado || !puedeBorrar(elemento)}
                          title={puedeBorrar(elemento) ? undefined : motivoNoBorrar}
                          aria-label={`Eliminar ${elemento.nombre}`}
                          className="rounded-lg p-1.5 text-tinta-suave hover:bg-marca-tenue hover:text-marca disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </span>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
    </div>
  )
}
