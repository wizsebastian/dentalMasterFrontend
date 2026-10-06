import { useMemo, useState } from "react"
import { FlaskConical, Pencil, Plus, Search, Trash2 } from "lucide-react"

import { ApiError } from "../../api/client"
import type { Servicio } from "../../api/tipos"
import {
  Aviso,
  Boton,
  Casilla,
  type Columna,
  ErrorCarga,
  EsqueletoTabla,
  Insignia,
  SelectorFiltro,
  Tabla,
  Tarjeta,
  useAviso,
  Vacio,
} from "../../components/ui"
import { moneda } from "../../lib/formato"
import { plano } from "../../lib/texto"
import { DialogoReceta } from "./DialogoReceta"
import { DialogoServicio } from "./DialogoServicio"
import { useBorrarServicio, useCategorias, useListasPrecio, useServicios } from "./consultas"

export function PanelServicios({ edita }: { edita: boolean }) {
  const avisar = useAviso()
  const [buscar, setBuscar] = useState("")
  const [categoria, setCategoria] = useState("")
  const [inactivos, setInactivos] = useState(false)
  const [editando, setEditando] = useState<Servicio | "nuevo" | null>(null)
  const [fallo, setFallo] = useState<string | null>(null)
  const [receta, setReceta] = useState<Servicio | null>(null)

  const { data: servicios, isPending, error } = useServicios(inactivos)
  const { data: categorias } = useCategorias()
  const { data: listas } = useListasPrecio()
  const borrar = useBorrarServicio()

  // El catálogo entero ya está en memoria: filtrar aquí es instantáneo y no
  // lanza una petición por tecla.
  const visibles = useMemo(() => {
    const aguja = plano(buscar.trim())
    return (servicios ?? []).filter(
      (s) =>
        (!categoria || s.categoria_id === Number(categoria)) &&
        (!aguja || plano(`${s.nombre} ${s.codigo} ${s.categoria_nombre}`).includes(aguja)),
    )
  }, [servicios, buscar, categoria])

  async function alBorrar(servicio: Servicio) {
    setFallo(null)
    try {
      await borrar.mutateAsync(servicio.id)
      avisar(`«${servicio.nombre}» eliminado`)
    } catch (e) {
      setFallo(e instanceof ApiError ? e.detail : "No se pudo eliminar el servicio")
    }
  }

  const columnas: Columna<Servicio>[] = [
    {
      id: "codigo",
      titulo: "Código",
      className: "tabular font-mono text-tinta-suave",
      celda: (s) => s.codigo,
    },
    {
      id: "servicio",
      titulo: "Servicio",
      celda: (s) => (
        <>
          <span className="font-medium">{s.nombre}</span>
          {!s.activo && <Insignia className="ml-2">Inactivo</Insignia>}
          <span className="block text-xs text-tinta-suave">{s.categoria_nombre}</span>
        </>
      ),
    },
    {
      id: "duracion",
      titulo: "Duración",
      className: "tabular text-tinta-suave",
      celda: (s) => `${s.duracion_min} min`,
    },
    // Una columna por tarifa: el precio vive en cada lista, no en el servicio.
    ...(listas ?? []).map(
      (lista): Columna<Servicio> => ({
        id: `lista-${lista.id}`,
        titulo: lista.nombre,
        alinear: "derecha",
        className: "tabular whitespace-nowrap",
        celda: (s) => moneda(s.precios.find((p) => p.lista_precio_id === lista.id)?.precio),
      }),
    ),
    {
      id: "acciones",
      titulo: "",
      alinear: "derecha",
      className: "whitespace-nowrap",
      celda: (s) => (
        <>
          <button
            type="button"
            onClick={() => setReceta(s)}
            aria-label={`Insumos de ${s.nombre}`}
            title="Insumos que gasta, costo y margen"
            className="rounded-lg p-1.5 text-tinta-suave hover:bg-marca-tenue hover:text-marca"
          >
            <FlaskConical className="h-4 w-4" aria-hidden />
          </button>
          {edita && (
              <>
                <button
                  type="button"
                  onClick={() => setEditando(s)}
                  aria-label={`Editar ${s.nombre}`}
                  className="rounded-lg p-1.5 text-tinta-suave hover:bg-marca-tenue hover:text-marca"
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => alBorrar(s)}
                  disabled={s.en_uso}
                  title={s.en_uso ? "Ya se usó en citas, planes o consultas: desactívalo" : undefined}
                  aria-label={`Eliminar ${s.nombre}`}
                  className="rounded-lg p-1.5 text-tinta-suave hover:bg-marca-tenue hover:text-marca disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </>
          )}
        </>
      ),
    },
  ]

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-suave"
            aria-hidden
          />
          <input
            type="search"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Nombre, código o categoría"
            aria-label="Buscar servicios"
            className="w-72 max-w-full rounded-lg border border-linea-fuerte bg-superficie py-2 pl-9 pr-3 text-sm placeholder:text-tinta-suave/60"
          />
        </div>
        <SelectorFiltro
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          aria-label="Filtrar por categoría"
          className="w-56"
          claseCaja="rounded-lg border bg-superficie px-3 py-2 text-sm"
        >
          <option value="">Todas las categorías</option>
          {categorias?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </SelectorFiltro>
        <Casilla
          etiqueta="Mostrar inactivos"
          checked={inactivos}
          onChange={(e) => setInactivos(e.target.checked)}
        />
        {edita && (
          <Boton className="ml-auto" onClick={() => setEditando("nuevo")}>
            <Plus className="h-4 w-4" aria-hidden />
            Nuevo servicio
          </Boton>
        )}
      </div>

      {fallo && <Aviso className="mt-4">{fallo}</Aviso>}

      <Tarjeta className="mt-4 overflow-hidden">
        {isPending ? (
          <EsqueletoTabla filas={10} />
        ) : error ? (
          <ErrorCarga error={error} className="m-4 border-0" />
        ) : visibles.length === 0 ? (
          <Vacio
            titulo={servicios?.length ? "Ningún servicio coincide" : "El catálogo está vacío"}
            descripcion={
              servicios?.length
                ? "Prueba con otro nombre o quita el filtro de categoría."
                : "Los servicios que registres se podrán agendar, cotizar y cobrar."
            }
          />
        ) : (
          <Tabla
            columnas={columnas}
            filas={visibles}
            clave={(s) => s.id}
            claseFila={(s) => (s.activo ? undefined : "text-tinta-suave")}
          />
        )}
      </Tarjeta>

      {servicios && (
        <p className="tabular mt-3 text-sm text-tinta-suave">
          {visibles.length} de {servicios.length} servicios
        </p>
      )}

      <DialogoReceta servicio={receta} alCerrar={() => setReceta(null)} edita={edita} />
      <DialogoServicio
        abierto={editando !== null}
        servicio={editando === "nuevo" || editando === null ? undefined : editando}
        alCerrar={() => setEditando(null)}
      />
    </div>
  )
}
