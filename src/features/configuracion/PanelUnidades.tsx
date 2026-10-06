import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Pencil, Plus } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import type { Unidad } from "../../api/tipos"
import { Cargando } from "../../components/brand"
import {
  Aviso,
  Boton,
  Campo,
  Casilla,
  Dialogo,
  ErrorCarga,
  EsqueletoTabla,
  Insignia,
  PieDialogo,
  Tabla,
  Tarjeta,
  Vacio,
  useAviso,
  type Columna,
} from "../../components/ui"
import { aplicarErrorApi } from "../../lib/formularios"
import { useGuardarUnidad, useUnidades } from "../catalogo/consultas"

const esquema = z.object({
  nombre: z.string().trim().min(1, "Escribe el nombre"),
  orden: z.coerce.number<string>().int().min(0),
  alquilada: z.boolean(),
  activo: z.boolean(),
})

type Entrada = z.input<typeof esquema>
type Valores = z.output<typeof esquema>

export function PanelUnidades() {
  const { data, isPending, error } = useUnidades(true)
  const [editando, setEditando] = useState<Unidad | "nueva" | null>(null)

  const columnas: Columna<Unidad>[] = [
    {
      id: "nombre",
      titulo: "Unidad",
      celda: (u) => (
        <>
          <span className="font-medium">{u.nombre}</span>
          {u.alquilada && <Insignia className="ml-2">Alquilada</Insignia>}
          {!u.activo && <Insignia className="ml-2">Inactiva</Insignia>}
        </>
      ),
    },
    { id: "orden", titulo: "Orden", className: "tabular text-tinta-suave", celda: (u) => u.orden },
    {
      id: "acciones",
      titulo: "",
      alinear: "derecha",
      celda: (u) => (
        <button
          type="button"
          onClick={() => setEditando(u)}
          aria-label={`Editar ${u.nombre}`}
          className="rounded-lg p-1.5 text-tinta-suave hover:bg-marca-tenue hover:text-marca"
        >
          <Pencil className="h-4 w-4" aria-hidden />
        </button>
      ),
    },
  ]

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="max-w-xl text-sm text-tinta-suave">
          Una unidad es un sillón. La agenda no deja ocupar el mismo sillón con dos citas a la
          vez, y los informes separan lo producido en cada uno.
        </p>
        <Boton onClick={() => setEditando("nueva")}>
          <Plus className="h-4 w-4" aria-hidden />
          Nueva unidad
        </Boton>
      </div>

      <Tarjeta className="mt-4 overflow-hidden">
        {isPending ? (
          <EsqueletoTabla filas={3} />
        ) : error ? (
          <ErrorCarga error={error} className="m-4 border-0" />
        ) : data.length === 0 ? (
          <Vacio
            titulo="Todavía no hay unidades"
            descripcion="Sin unidades, las citas se agendan sólo por doctor."
          />
        ) : (
          <Tabla
            columnas={columnas}
            filas={data}
            clave={(u) => u.id}
            claseFila={(u) => (u.activo ? undefined : "text-tinta-suave")}
          />
        )}
      </Tarjeta>

      <Dialogo
        abierto={editando !== null}
        alCerrar={() => setEditando(null)}
        titulo={editando === "nueva" || editando === null ? "Nueva unidad" : "Editar unidad"}
        ancho="sm"
      >
        <Formulario
          unidad={editando === "nueva" || editando === null ? undefined : editando}
          siguienteOrden={(data?.length ?? 0) + 1}
          alCerrar={() => setEditando(null)}
        />
      </Dialogo>
    </div>
  )
}

function Formulario({
  unidad,
  siguienteOrden,
  alCerrar,
}: {
  unidad?: Unidad
  siguienteOrden: number
  alCerrar: () => void
}) {
  const avisar = useAviso()
  const guardar = useGuardarUnidad()
  const [general, setGeneral] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Entrada, unknown, Valores>({
    resolver: zodResolver(esquema),
    defaultValues: {
      nombre: unidad?.nombre ?? "",
      orden: String(unidad?.orden ?? siguienteOrden),
      alquilada: unidad?.alquilada ?? false,
      activo: unidad?.activo ?? true,
    },
  })

  async function enviar({ activo, ...valores }: Valores) {
    setGeneral(null)
    try {
      await guardar.mutateAsync(
        unidad ? { id: unidad.id, datos: { ...valores, activo } } : { datos: valores },
      )
      avisar(unidad ? "Unidad actualizada" : "Unidad creada")
      alCerrar()
    } catch (fallo) {
      setGeneral(aplicarErrorApi(fallo, setError, ["nombre", "orden"]))
    }
  }

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-4">
      <Campo
        etiqueta="Nombre"
        autoFocus
        placeholder="Unidad 3"
        error={errors.nombre?.message}
        {...register("nombre")}
      />
      <Campo
        etiqueta="Orden"
        type="number"
        inputMode="numeric"
        min={0}
        ayuda="Posición de la columna en la agenda."
        error={errors.orden?.message}
        {...register("orden")}
      />
      <Casilla
        etiqueta="Es alquilada"
        ayuda="La usa un doctor externo que paga por el sillón."
        {...register("alquilada")}
      />
      {unidad && (
        <Casilla
          etiqueta="Activa"
          ayuda="Una unidad inactiva no se ofrece al agendar, pero conserva su histórico."
          {...register("activo")}
        />
      )}

      {general && <Aviso>{general}</Aviso>}

      <PieDialogo>
        <Boton type="button" variante="contorno" onClick={alCerrar}>
          Cancelar
        </Boton>
        <Boton type="submit" disabled={isSubmitting}>
          {isSubmitting && <Cargando size="sm" label="Guardando" />}
          {unidad ? "Guardar cambios" : "Crear unidad"}
        </Boton>
      </PieDialogo>
    </form>
  )
}
