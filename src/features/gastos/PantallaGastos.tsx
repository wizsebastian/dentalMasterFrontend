import { useState } from "react"
import { Ban, Plus, Search, Trash2 } from "lucide-react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"

import { ApiError } from "../../api/client"
import type { Gasto } from "../../api/tipos"
import { Cargando } from "../../components/brand"
import {
  AreaTexto,
  Aviso,
  Boton,
  Campo,
  CampoFecha,
  type Columna,
  Dialogo,
  DialogoMotivo,
  ErrorCarga,
  EsqueletoTabla,
  Insignia,
  PieDialogo,
  Selector,
  SelectorFiltro,
  Tabla,
  Tarjeta,
  useAviso,
  Vacio,
} from "../../components/ui"
import { doctor as tratamiento, fecha, moneda } from "../../lib/formato"
import { numeroONulo, oNulo } from "../../lib/formularios"
import { aFechaISO } from "../agenda/tiempo"
import { Comprobante } from "../archivos/Archivos"
import { METODOS, metodo } from "../caja/textos"
import { useDoctores } from "../catalogo/consultas"
import { IMPORTE } from "../historial/textos"
import {
  useAnularGasto,
  useCategoriasDeGasto,
  useCrearCategoriaDeGasto,
  useGastos,
  useInventario,
  useRegistrarGasto,
} from "../inventario/consultas"

const TIPOS = [
  { id: "consultorio", etiqueta: "Consultorio" },
  { id: "doctor", etiqueta: "Doctor" },
  { id: "personal", etiqueta: "Personal" },
] as const

const HOY = aFechaISO(new Date())
const PRIMERO = `${HOY.slice(0, 8)}01`

type Valores = {
  fecha: string
  monto: string
  itbis: string
  categoria_id: string
  descripcion: string
  tipo: "consultorio" | "doctor" | "personal"
  doctor_id: string
  metodo: string
  proveedor: string
  proveedor_rnc: string
  ncf: string
  notas: string
  compras: { insumo_id: string; cantidad: string; costo_unit: string }[]
}

function FormularioGasto({ alCerrar }: { alCerrar: () => void }) {
  const avisar = useAviso()
  const { data: categorias } = useCategoriasDeGasto()
  const { data: doctores } = useDoctores()
  const { data: inventario } = useInventario()
  const registrar = useRegistrarGasto()
  const crearCategoria = useCrearCategoriaDeGasto()
  const [general, setGeneral] = useState<string | null>(null)
  /** `null` = no se está creando; texto = lo escrito hasta ahora. */
  const [categoriaNueva, setCategoriaNueva] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Valores>({
    defaultValues: {
      fecha: HOY,
      monto: "",
      itbis: "",
      categoria_id: "",
      descripcion: "",
      tipo: "consultorio",
      doctor_id: "",
      metodo: "efectivo",
      proveedor: "",
      proveedor_rnc: "",
      ncf: "",
      notas: "",
      compras: [],
    },
  })
  const compras = useFieldArray({ control, name: "compras" })
  const tipo = useWatch({ control, name: "tipo" })

  async function nuevaCategoria() {
    if (!categoriaNueva?.trim()) return
    try {
      const creada = await crearCategoria.mutateAsync(categoriaNueva.trim())
      setValue("categoria_id", String(creada.id))
      setCategoriaNueva(null)
    } catch (e) {
      setGeneral(e instanceof ApiError ? e.detail : "No se pudo crear la categoría")
    }
  }

  async function enviar(v: Valores) {
    setGeneral(null)
    let valido = true
    if (!IMPORTE.test(v.monto) || Number(v.monto.replace(",", ".")) <= 0) {
      setError("monto", { message: "Escribe un importe mayor que cero" })
      valido = false
    }
    if (v.itbis && !IMPORTE.test(v.itbis)) {
      setError("itbis", { message: "Importe no válido" })
      valido = false
    }
    if (!v.categoria_id) {
      setError("categoria_id", { message: "Elige la categoría" })
      valido = false
    }
    if (!v.descripcion.trim()) {
      setError("descripcion", { message: "Describe el gasto" })
      valido = false
    }
    if (v.tipo === "doctor" && !v.doctor_id) {
      setError("doctor_id", { message: "Indica a qué doctor se le paga" })
      valido = false
    }
    if (v.ncf && !/^(B\d{10}|E\d{12})$/.test(v.ncf.trim().toUpperCase())) {
      setError("ncf", { message: "Un NCF es B y 10 cifras, o E y 12" })
      valido = false
    }
    if (!valido) return

    try {
      await registrar.mutateAsync({
        fecha: v.fecha || null,
        monto: v.monto.replace(",", "."),
        itbis: v.itbis ? v.itbis.replace(",", ".") : "0",
        categoria_id: Number(v.categoria_id),
        descripcion: v.descripcion.trim(),
        tipo: v.tipo,
        doctor_id: v.tipo === "doctor" ? numeroONulo(v.doctor_id) : null,
        metodo: v.metodo as (typeof METODOS)[number]["id"],
        proveedor: oNulo(v.proveedor),
        proveedor_rnc: oNulo(v.proveedor_rnc),
        ncf: v.ncf ? v.ncf.trim().toUpperCase() : null,
        notas: oNulo(v.notas),
        compras: v.compras
          .filter((c) => c.insumo_id && Number(c.cantidad) > 0)
          .map((c) => ({
            insumo_id: Number(c.insumo_id),
            cantidad: c.cantidad.replace(",", "."),
            costo_unit: c.costo_unit ? c.costo_unit.replace(",", ".") : "0",
          })),
      })
      avisar("Gasto registrado")
      alCerrar()
    } catch (e) {
      setGeneral(e instanceof ApiError ? e.detail : "No se pudo conectar con el servidor")
    }
  }

  const ENTRADA =
    "min-w-0 rounded-lg border border-linea-fuerte bg-superficie px-2 py-1.5 text-sm placeholder:text-tinta-suave/60"

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate>
      <div className="grid gap-4 sm:grid-cols-3">
        <CampoFecha etiqueta="Fecha" max={HOY} {...register("fecha")} />
        <Campo
          etiqueta="Monto (RD$)"
          autoFocus
          inputMode="decimal"
          placeholder="0.00"
          ayuda="Lo pagado, ITBIS incluido."
          className="[&_input]:tabular [&_input]:text-right"
          error={errors.monto?.message}
          {...register("monto")}
        />
        <Campo
          etiqueta="ITBIS"
          opcional
          inputMode="decimal"
          placeholder="0.00"
          className="[&_input]:tabular [&_input]:text-right"
          error={errors.itbis?.message}
          {...register("itbis")}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Campo
          etiqueta="Descripción"
          className="sm:col-span-2"
          placeholder="Pago de luz de junio"
          error={errors.descripcion?.message}
          {...register("descripcion")}
        />
        <div>
          <Selector
            etiqueta="Categoría"
            error={errors.categoria_id?.message}
            {...register("categoria_id")}
          >
            <option value="">Elige la categoría</option>
            {categorias?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Selector>
          {categoriaNueva === null ? (
            <button
              type="button"
              onClick={() => setCategoriaNueva("")}
              className="mt-1.5 text-sm text-marca underline-offset-2 hover:underline"
            >
              Crear una categoría nueva
            </button>
          ) : (
            <div className="mt-1.5 flex gap-2">
              <input
                autoFocus
                value={categoriaNueva}
                onChange={(e) => setCategoriaNueva(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    nuevaCategoria()
                  }
                }}
                aria-label="Nombre de la categoría nueva"
                placeholder="Nombre de la categoría"
                className="min-w-0 flex-1 rounded-lg border border-linea-fuerte bg-superficie px-2 py-1.5 text-sm"
              />
              <Boton type="button" variante="contorno" className="py-1.5" onClick={nuevaCategoria}>
                Crear
              </Boton>
            </div>
          )}
        </div>
        <Selector etiqueta="Método de pago" {...register("metodo")}>
          {METODOS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.etiqueta}
            </option>
          ))}
        </Selector>
        <Selector
          etiqueta="De quién es el gasto"
          ayuda="Un honorario se registra como gasto de tipo doctor."
          {...register("tipo")}
        >
          {TIPOS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.etiqueta}
            </option>
          ))}
        </Selector>
        {tipo === "doctor" && (
          <Selector etiqueta="Doctor" error={errors.doctor_id?.message} {...register("doctor_id")}>
            <option value="">Elige el doctor</option>
            {doctores?.map((d) => (
              <option key={d.id} value={d.id}>
                {tratamiento(d.nombre_completo)}
              </option>
            ))}
          </Selector>
        )}
      </div>

      <fieldset className="mt-5 border-t border-linea pt-4">
        <legend className="float-left mb-3 w-full text-sm font-medium">Comprobante</legend>
        <div className="clear-both grid gap-4 sm:grid-cols-3">
          <Campo etiqueta="Proveedor" opcional placeholder="Nombre del comercio" {...register("proveedor")} />
          <Campo etiqueta="RNC" opcional {...register("proveedor_rnc")} />
          <Campo
            etiqueta="NCF"
            opcional
            placeholder="B0100000001"
            className="[&_input]:font-mono [&_input]:uppercase"
            error={errors.ncf?.message}
            {...register("ncf")}
          />
        </div>
      </fieldset>

      <fieldset className="mt-5 border-t border-linea pt-4">
        <legend className="float-left mb-1 w-full text-sm font-medium">
          Lo que entró al almacén
        </legend>
        <p className="clear-both mb-3 text-sm text-tinta-suave">
          Si el gasto es una compra de insumos, anótalos: entran al inventario atados a este gasto.
        </p>
        <ul className="space-y-2">
          {compras.fields.map((campo, i) => (
            <li key={campo.id} className="grid items-center gap-2 sm:grid-cols-[3fr_1fr_1fr_auto]">
              <SelectorFiltro
                aria-label={`Insumo ${i + 1}`}
                className="min-w-0"
                {...register(`compras.${i}.insumo_id`)}
              >
                <option value="">Elige el insumo</option>
                {inventario?.items
                  .filter((insumo) => insumo.controla_stock)
                  .map((insumo) => (
                    <option key={insumo.id} value={insumo.id}>
                      {insumo.nombre} · {insumo.unidad}
                    </option>
                  ))}
              </SelectorFiltro>
              <input
                aria-label={`Cantidad ${i + 1}`}
                inputMode="decimal"
                placeholder="Cantidad"
                className={`${ENTRADA} tabular`}
                {...register(`compras.${i}.cantidad`)}
              />
              <input
                aria-label={`Costo por unidad ${i + 1}`}
                inputMode="decimal"
                placeholder="Costo c/u"
                className={`${ENTRADA} tabular text-right`}
                {...register(`compras.${i}.costo_unit`)}
              />
              <button
                type="button"
                onClick={() => compras.remove(i)}
                aria-label={`Quitar el insumo ${i + 1}`}
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
          className="-ml-2 mt-1"
          onClick={() => compras.append({ insumo_id: "", cantidad: "", costo_unit: "" })}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Añadir insumo comprado
        </Boton>
      </fieldset>

      <AreaTexto etiqueta="Notas" opcional rows={2} className="mt-4" {...register("notas")} />

      {general && <Aviso className="mt-5">{general}</Aviso>}

      <PieDialogo>
        <Boton type="button" variante="contorno" onClick={alCerrar}>
          Cancelar
        </Boton>
        <Boton type="submit" disabled={isSubmitting}>
          {isSubmitting && <Cargando size="sm" label="Guardando" />}
          Registrar gasto
        </Boton>
      </PieDialogo>
    </form>
  )
}

/** Lo que sale: gastos del consultorio, honorarios y personal. */
export function PantallaGastos() {
  const avisar = useAviso()
  const [desde, setDesde] = useState(PRIMERO)
  const [hasta, setHasta] = useState(HOY)
  const [tipo, setTipo] = useState("")
  const [categoriaId, setCategoriaId] = useState("")
  const [buscar, setBuscar] = useState("")
  const [registrando, setRegistrando] = useState(false)
  const [anulando, setAnulando] = useState<Gasto | null>(null)

  const { data, isPending, isFetching, error } = useGastos({ desde, hasta, tipo, categoriaId, buscar })
  const { data: categorias } = useCategoriasDeGasto()
  const anular = useAnularGasto()

  const columnas: Columna<Gasto>[] = [
    { id: "fecha", titulo: "Fecha", className: "tabular whitespace-nowrap", celda: (g) => fecha(g.fecha) },
    {
      id: "descripcion",
      titulo: "Gasto",
      celda: (g) => (
        <>
          <span className="font-medium">{g.descripcion}</span>
          {g.anulado_en && <Insignia className="ml-2">Anulado</Insignia>}
          <span className="block text-xs text-tinta-suave">
            {g.categoria_nombre}
            {g.proveedor_nombre && ` · ${g.proveedor_nombre}`}
            {g.ncf && <span className="ml-1 font-mono">{g.ncf}</span>}
          </span>
        </>
      ),
    },
    {
      id: "tipo",
      titulo: "De quién",
      celda: (g) => (
        <>
          {TIPOS.find((t) => t.id === g.tipo)?.etiqueta}
          {g.doctor_nombre && (
            <span className="block text-xs text-tinta-suave">{tratamiento(g.doctor_nombre)}</span>
          )}
        </>
      ),
    },
    { id: "metodo", titulo: "Método", className: "text-tinta-suave", celda: (g) => metodo(g.metodo) },
    {
      id: "monto",
      titulo: "Monto",
      alinear: "derecha",
      className: "tabular whitespace-nowrap",
      celda: (g) => (
        <span className={g.anulado_en ? "line-through" : "font-medium"}>{moneda(g.monto)}</span>
      ),
    },
    {
      id: "acciones",
      titulo: "",
      alinear: "derecha",
      className: "no-imprimir",
      celda: (g) => (
        <span className="inline-flex items-center gap-1">
          <Comprobante
            de="gastos"
            id={g.id}
            comprobanteId={g.comprobante_id}
            edita={g.anulado_en === null}
          />
          {g.anulado_en === null && (
            <button
              type="button"
              onClick={() => setAnulando(g)}
              aria-label={`Anular ${g.descripcion}`}
              title="Anular"
              className="rounded-lg p-1.5 text-tinta-suave hover:bg-marca-tenue hover:text-marca"
            >
              <Ban className="h-4 w-4" aria-hidden />
            </button>
          )}
        </span>
      ),
    },
  ]

  const total = Number(data?.total ?? 0)

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gastos</h1>
          <p className="mt-1 text-sm text-tinta-suave">
            Lo que sale: consultorio, honorarios de doctores y personal.
          </p>
        </div>
        <Boton onClick={() => setRegistrando(true)}>
          <Plus className="h-4 w-4" aria-hidden />
          Registrar gasto
        </Boton>
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="block text-xs text-tinta-suave">Desde</span>
          <input
            type="date"
            value={desde}
            max={HOY}
            onChange={(e) => e.target.value && setDesde(e.target.value)}
            className="mt-1 rounded-lg border border-linea-fuerte bg-superficie px-3 py-1.5 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="block text-xs text-tinta-suave">Hasta</span>
          <input
            type="date"
            value={hasta}
            max={HOY}
            onChange={(e) => e.target.value && setHasta(e.target.value)}
            className="mt-1 rounded-lg border border-linea-fuerte bg-superficie px-3 py-1.5 text-sm"
          />
        </label>
        <SelectorFiltro
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          aria-label="Filtrar por tipo"
          className="w-44"
        >
          <option value="">Todos los tipos</option>
          {TIPOS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.etiqueta}
            </option>
          ))}
        </SelectorFiltro>
        <SelectorFiltro
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          aria-label="Filtrar por categoría"
          className="w-56"
        >
          <option value="">Todas las categorías</option>
          {categorias?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </SelectorFiltro>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-suave"
            aria-hidden
          />
          <input
            type="search"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Descripción, proveedor o NCF"
            aria-label="Buscar gastos"
            className="w-64 max-w-full rounded-lg border border-linea-fuerte bg-superficie py-1.5 pl-9 pr-3 text-sm placeholder:text-tinta-suave/60"
          />
        </div>
      </div>

      {isPending ? (
        <Tarjeta className="mt-4">
          <EsqueletoTabla />
        </Tarjeta>
      ) : error ? (
        <ErrorCarga error={error} className="mt-4" />
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Tarjeta className="p-4">
              <p className="text-xs text-tinta-suave">Total gastado</p>
              <p className="tabular mt-1 text-xl font-semibold">{moneda(data.total)}</p>
              {Number(data.itbis) > 0 && (
                <p className="tabular mt-0.5 text-xs text-tinta-suave">
                  de ello, {moneda(data.itbis)} de ITBIS
                </p>
              )}
            </Tarjeta>
            {data.por_tipo.map((t) => (
              <Tarjeta key={t.nombre} className="p-4">
                <p className="text-xs text-tinta-suave">{t.nombre}</p>
                <p className="tabular mt-1 text-xl font-semibold">{moneda(t.monto)}</p>
                <p className="tabular mt-0.5 text-xs text-tinta-suave">
                  {t.gastos === 1 ? "1 gasto" : `${t.gastos} gastos`}
                </p>
              </Tarjeta>
            ))}
          </div>

          {data.por_categoria.length > 0 && (
            <Tarjeta className="mt-4 p-4">
              <h2 className="text-sm font-semibold">Por categoría</h2>
              <ul className="mt-3 space-y-2.5">
                {data.por_categoria.map((c) => {
                  const fraccion = total > 0 ? Number(c.monto) / total : 0
                  return (
                    <li key={c.nombre} className="text-sm">
                      <div className="flex justify-between gap-4">
                        <span>
                          {c.nombre} <span className="tabular text-tinta-suave">({c.gastos})</span>
                        </span>
                        <span className="tabular">
                          {moneda(c.monto)}
                          <span className="ml-2 text-tinta-suave">{(fraccion * 100).toFixed(1)} %</span>
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-linea" aria-hidden>
                        <div className="h-full rounded-full bg-marca" style={{ width: `${fraccion * 100}%` }} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </Tarjeta>
          )}

          <Tarjeta className="mt-4 overflow-hidden">
            {data.items.length === 0 ? (
              <Vacio titulo="Sin gastos en este tramo" />
            ) : (
              <Tabla
                columnas={columnas}
                filas={data.items}
                clave={(g) => g.id}
                atenuada={isFetching}
                claseFila={(g) => (g.anulado_en ? "text-tinta-suave" : undefined)}
              />
            )}
          </Tarjeta>
        </>
      )}

      <Dialogo abierto={registrando} alCerrar={() => setRegistrando(false)} titulo="Registrar gasto" ancho="lg">
        <FormularioGasto alCerrar={() => setRegistrando(false)} />
      </Dialogo>
      <DialogoMotivo
        abierto={anulando !== null}
        alCerrar={() => setAnulando(null)}
        titulo="Anular gasto"
        descripcion={anulando ? `${anulando.descripcion} · ${moneda(anulando.monto)}` : undefined}
        explicacion="El gasto no se borra: queda anulado, con su motivo, y deja de sumar. Lo que había traído al almacén sale de él."
        accion="Anular gasto"
        alConfirmar={async (motivo) => {
          if (!anulando) return
          await anular.mutateAsync({ id: anulando.id, motivo })
          avisar("Gasto anulado")
        }}
      />
    </div>
  )
}
