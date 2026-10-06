import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import type { ListaPrecio, Servicio } from "../../api/tipos"
import { Cargando } from "../../components/brand"
import {
  AreaTexto,
  Aviso,
  Boton,
  Campo,
  Casilla,
  Dialogo,
  PieDialogo,
  Selector,
  useAviso,
} from "../../components/ui"
import { aplicarErrorApi, numeroONulo, oNulo } from "../../lib/formularios"
import { useCatalogos } from "../pacientes/consultas"
import {
  useActualizarServicio,
  useCategorias,
  useCrearServicio,
  useListasPrecio,
} from "./consultas"

const importe = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d+([.,]\d{1,2})?$/.test(v), "Escribe un importe, como 1500 o 1500.50")

const esquema = z.object({
  categoria_id: z.string().min(1, "Elige una categoría"),
  nombre: z.string().trim().min(1, "Escribe el nombre"),
  descripcion: z.string(),
  duracion_min: z.coerce.number<string>().int().min(5, "Mínimo 5 minutos").max(480, "Máximo 8 horas"),
  sesiones: z.coerce.number<string>().int().min(1, "Al menos una").max(50),
  requiere_diente: z.boolean(),
  requiere_superficie: z.boolean(),
  es_implante: z.boolean(),
  condicion_resultante_id: z.string(),
  activo: z.boolean(),
  /** Precio por lista, con el id de la lista como clave. Vacío = sin precio en ella. */
  precios: z.record(z.string(), importe),
})

type Entrada = z.input<typeof esquema>
type Valores = z.output<typeof esquema>

const CAMPOS = ["categoria_id", "nombre", "descripcion", "duracion_min", "sesiones"] as const

function iniciales(servicio: Servicio | undefined, listas: ListaPrecio[]): Entrada {
  return {
    categoria_id: servicio ? String(servicio.categoria_id) : "",
    nombre: servicio?.nombre ?? "",
    descripcion: servicio?.descripcion ?? "",
    duracion_min: String(servicio?.duracion_min ?? 30),
    sesiones: String(servicio?.sesiones ?? 1),
    requiere_diente: servicio?.requiere_diente ?? false,
    requiere_superficie: servicio?.requiere_superficie ?? false,
    es_implante: servicio?.es_implante ?? false,
    condicion_resultante_id: servicio?.condicion_resultante_id
      ? String(servicio.condicion_resultante_id)
      : "",
    activo: servicio?.activo ?? true,
    precios: Object.fromEntries(
      listas.map((lista) => [
        String(lista.id),
        servicio?.precios.find((p) => p.lista_precio_id === lista.id)?.precio ?? "",
      ]),
    ),
  }
}

export function DialogoServicio({
  abierto,
  alCerrar,
  servicio,
}: {
  abierto: boolean
  alCerrar: () => void
  servicio?: Servicio
}) {
  const { data: listas } = useListasPrecio()

  return (
    <Dialogo
      abierto={abierto}
      alCerrar={alCerrar}
      titulo={servicio ? `Editar ${servicio.codigo}` : "Nuevo servicio"}
      descripcion={servicio ? servicio.nombre : "El código se asigna solo, según la categoría."}
      ancho="lg"
    >
      {listas && <Formulario servicio={servicio} listas={listas} alCerrar={alCerrar} />}
    </Dialogo>
  )
}

function Formulario({
  servicio,
  listas,
  alCerrar,
}: {
  servicio?: Servicio
  listas: ListaPrecio[]
  alCerrar: () => void
}) {
  const avisar = useAviso()
  const { data: categorias } = useCategorias()
  const { data: catalogos } = useCatalogos()
  const crear = useCrearServicio()
  const actualizar = useActualizarServicio()
  const [general, setGeneral] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Entrada, unknown, Valores>({
    resolver: zodResolver(esquema),
    defaultValues: iniciales(servicio, listas),
  })

  // Lo que un servicio deja pintado en el odontograma es un tratamiento, nunca
  // una patología.
  const resultados = (catalogos?.condiciones ?? []).filter((c) => !c.patologico)
  const particular = listas.find((l) => l.aseguradora_id === null)

  async function enviar(valores: Valores) {
    setGeneral(null)

    const precios = Object.entries(valores.precios)
      .filter(([, precio]) => precio !== "")
      .map(([lista, precio]) => ({
        lista_precio_id: Number(lista),
        precio: precio.replace(",", "."),
      }))

    if (particular && !precios.some((p) => p.lista_precio_id === particular.id)) {
      setError(`precios.${particular.id}`, { message: "Este precio es obligatorio" })
      return
    }

    const datos = {
      categoria_id: Number(valores.categoria_id),
      nombre: valores.nombre,
      descripcion: oNulo(valores.descripcion),
      duracion_min: valores.duracion_min,
      sesiones: valores.sesiones,
      requiere_diente: valores.requiere_diente,
      requiere_superficie: valores.requiere_superficie,
      es_implante: valores.es_implante,
      condicion_resultante_id: numeroONulo(valores.condicion_resultante_id),
      precios,
    }

    try {
      if (servicio) {
        await actualizar.mutateAsync({ id: servicio.id, datos: { ...datos, activo: valores.activo } })
      } else {
        await crear.mutateAsync(datos)
      }
      avisar(servicio ? "Servicio actualizado" : "Servicio creado")
      alCerrar()
    } catch (fallo) {
      setGeneral(aplicarErrorApi(fallo, setError, CAMPOS))
    }
  }

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          etiqueta="Nombre"
          autoFocus
          className="sm:col-span-2"
          placeholder="Resina de una superficie"
          error={errors.nombre?.message}
          {...register("nombre")}
        />
        <Selector
          etiqueta="Categoría"
          error={errors.categoria_id?.message}
          {...register("categoria_id")}
        >
          <option value="">Elige una categoría</option>
          {categorias?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Selector>
        <div className="grid grid-cols-2 gap-4">
          <Campo
            etiqueta="Duración (min)"
            type="number"
            inputMode="numeric"
            min={5}
            step={5}
            ayuda="Tamaño de la cita."
            error={errors.duracion_min?.message}
            {...register("duracion_min")}
          />
          <Campo
            etiqueta="Sesiones"
            type="number"
            inputMode="numeric"
            min={1}
            error={errors.sesiones?.message}
            {...register("sesiones")}
          />
        </div>
      </div>

      <fieldset className="mt-5 border-t border-linea pt-4">
        <legend className="float-left mb-3 w-full text-sm font-medium">Precio por tarifa</legend>
        <div className="clear-both grid gap-4 sm:grid-cols-2">
          {listas.map((lista) => (
            <Campo
              key={lista.id}
              etiqueta={lista.nombre}
              inputMode="decimal"
              placeholder="0.00"
              opcional={lista.aseguradora_id !== null}
              className="[&_input]:tabular [&_input]:text-right"
              error={errors.precios?.[String(lista.id)]?.message}
              {...register(`precios.${lista.id}`)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5 border-t border-linea pt-4">
        <legend className="float-left mb-3 w-full text-sm font-medium">En el odontograma</legend>
        <div className="clear-both grid gap-4 sm:grid-cols-2">
          <div className="space-y-2.5">
            <Casilla etiqueta="Se hace sobre una pieza" {...register("requiere_diente")} />
            <Casilla etiqueta="Pide cara o superficie" {...register("requiere_superficie")} />
            <Casilla
              etiqueta="Es un implante"
              ayuda="Exigirá marca y lote al ejecutarlo."
              {...register("es_implante")}
            />
          </div>
          <Selector
            etiqueta="Al completarse pinta"
            opcional
            ayuda="La condición que queda en la pieza cuando el servicio se ejecuta."
            error={errors.condicion_resultante_id?.message}
            {...register("condicion_resultante_id")}
          >
            <option value="">Nada</option>
            {resultados.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Selector>
        </div>
      </fieldset>

      <AreaTexto
        etiqueta="Descripción"
        opcional
        rows={2}
        className="mt-5"
        error={errors.descripcion?.message}
        {...register("descripcion")}
      />

      {servicio && (
        <Casilla
          className="mt-4"
          etiqueta="Activo"
          ayuda="Un servicio inactivo deja de ofrecerse, pero conserva su histórico."
          {...register("activo")}
        />
      )}

      {general && <Aviso className="mt-5">{general}</Aviso>}

      <PieDialogo>
        <Boton type="button" variante="contorno" onClick={alCerrar}>
          Cancelar
        </Boton>
        <Boton type="submit" disabled={isSubmitting}>
          {isSubmitting && <Cargando size="sm" label="Guardando" />}
          {servicio ? "Guardar cambios" : "Crear servicio"}
        </Boton>
      </PieDialogo>
    </form>
  )
}
