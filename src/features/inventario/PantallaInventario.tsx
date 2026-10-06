import { useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowDownUp, History, Pencil, Plus, Search } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import type { Insumo } from "../../api/tipos"
import { Cargando } from "../../components/brand"
import {
  AreaTexto,
  Aviso,
  Boton,
  Campo,
  Casilla,
  Dialogo,
  ErrorCarga,
  EsqueletoTabla,
  Insignia,
  PieDialogo,
  Selector,
  Tabla,
  Tarjeta,
  Vacio,
  useAviso,
  type Columna,
} from "../../components/ui"
import { fecha, hora, moneda, numero } from "../../lib/formato"
import { aplicarErrorApi, numeroONulo, oNulo } from "../../lib/formularios"
import { TrazabilidadImplantes } from "../implantes/Implantes"
import { useAuth } from "../auth/contexto"
import {
  useCategoriasDeInsumo,
  useGuardarInsumo,
  useInventario,
  useKardex,
  useMoverInsumo,
} from "./consultas"

const decimal = (mensaje: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d+([.,]\d{1,3})?$/.test(v), mensaje)

const esquema = z.object({
  nombre: z.string().trim().min(1, "Escribe el nombre"),
  categoria_id: z.string(),
  marca: z.string(),
  modelo: z.string(),
  unidad: z.string().trim().min(1, "Indica la unidad"),
  costo: decimal("Importe no válido"),
  stock_minimo: decimal("Cantidad no válida"),
  existencia_inicial: decimal("Cantidad no válida"),
  controla_stock: z.boolean(),
  notas: z.string(),
  activo: z.boolean(),
})
type Valores = z.infer<typeof esquema>

const aTexto = (v: string) => (v ? v.replace(",", ".") : "0")

const MOTIVOS: Record<string, string> = {
  inicial: "Existencia inicial",
  compra: "Compra",
  consumo: "Consumo en consulta",
  merma: "Merma",
  conteo: "Ajuste por conteo",
  devolucion: "Devolución",
}

function FormularioInsumo({ insumo, alCerrar }: { insumo?: Insumo; alCerrar: () => void }) {
  const avisar = useAviso()
  const { data: categorias } = useCategoriasDeInsumo()
  const guardar = useGuardarInsumo()
  const [general, setGeneral] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Valores>({
    resolver: zodResolver(esquema),
    defaultValues: {
      nombre: insumo?.nombre ?? "",
      categoria_id: insumo?.categoria_id ? String(insumo.categoria_id) : "",
      marca: insumo?.marca ?? "",
      modelo: insumo?.modelo ?? "",
      unidad: insumo?.unidad ?? "unidad",
      costo: insumo ? insumo.costo : "",
      stock_minimo: insumo ? String(Number(insumo.stock_minimo)) : "",
      existencia_inicial: "",
      controla_stock: insumo?.controla_stock ?? true,
      notas: insumo?.notas ?? "",
      activo: insumo?.activo ?? true,
    },
  })
  const controla = useWatch({ control, name: "controla_stock" })

  async function enviar(v: Valores) {
    setGeneral(null)
    const comunes = {
      nombre: v.nombre,
      categoria_id: numeroONulo(v.categoria_id),
      marca: oNulo(v.marca),
      modelo: oNulo(v.modelo),
      unidad: v.unidad,
      costo: aTexto(v.costo),
      stock_minimo: aTexto(v.stock_minimo),
      controla_stock: v.controla_stock,
      notas: oNulo(v.notas),
    }
    try {
      await guardar.mutateAsync(
        insumo
          ? { id: insumo.id, datos: { ...comunes, activo: v.activo } }
          : { datos: { ...comunes, existencia_inicial: aTexto(v.existencia_inicial) } },
      )
      avisar(insumo ? "Insumo actualizado" : "Insumo creado")
      alCerrar()
    } catch (fallo) {
      setGeneral(aplicarErrorApi(fallo, setError, ["nombre", "unidad", "costo", "stock_minimo"]))
    }
  }

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          etiqueta="Nombre"
          autoFocus
          className="sm:col-span-2"
          placeholder="Resina compuesta A2"
          error={errors.nombre?.message}
          {...register("nombre")}
        />
        <Selector etiqueta="Categoría" opcional {...register("categoria_id")}>
          <option value="">Sin categoría</option>
          {categorias?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Selector>
        <Campo
          etiqueta="Unidad"
          placeholder="jeringa 4g, caja 100…"
          error={errors.unidad?.message}
          {...register("unidad")}
        />
        <Campo etiqueta="Marca" opcional {...register("marca")} />
        <Campo etiqueta="Modelo" opcional {...register("modelo")} />
        <Campo
          etiqueta="Costo por unidad (RD$)"
          inputMode="decimal"
          placeholder="0.00"
          className="[&_input]:tabular [&_input]:text-right"
          error={errors.costo?.message}
          {...register("costo")}
        />
        {controla && (
          <Campo
            etiqueta="Existencia mínima"
            inputMode="decimal"
            placeholder="0"
            ayuda="Avisa cuando la existencia llega a este número."
            className="[&_input]:tabular [&_input]:text-right"
            error={errors.stock_minimo?.message}
            {...register("stock_minimo")}
          />
        )}
        {controla && !insumo && (
          <Campo
            etiqueta="Existencia inicial"
            inputMode="decimal"
            placeholder="0"
            className="[&_input]:tabular [&_input]:text-right"
            error={errors.existencia_inicial?.message}
            {...register("existencia_inicial")}
          />
        )}
      </div>

      <Casilla
        className="mt-4"
        etiqueta="Lleva existencia"
        ayuda="Desmárcalo para servicios de laboratorio externo: tienen costo, pero no se almacenan."
        {...register("controla_stock")}
      />
      {insumo && (
        <Casilla
          className="mt-3"
          etiqueta="Activo"
          ayuda="Un insumo inactivo deja de ofrecerse, pero conserva su kárdex."
          {...register("activo")}
        />
      )}
      <AreaTexto etiqueta="Notas" opcional rows={2} className="mt-4" {...register("notas")} />

      {general && <Aviso className="mt-5">{general}</Aviso>}

      <PieDialogo>
        <Boton type="button" variante="contorno" onClick={alCerrar}>
          Cancelar
        </Boton>
        <Boton type="submit" disabled={isSubmitting}>
          {isSubmitting && <Cargando size="sm" label="Guardando" />}
          {insumo ? "Guardar cambios" : "Crear insumo"}
        </Boton>
      </PieDialogo>
    </form>
  )
}

/** Un asiento manual. La existencia no se edita: se mueve, y queda quién y por qué. */
function FormularioMovimiento({ insumo, alCerrar }: { insumo: Insumo; alCerrar: () => void }) {
  const avisar = useAviso()
  const mover = useMoverInsumo()
  const [motivo, setMotivo] = useState<"compra" | "merma" | "conteo">("conteo")
  const [cantidad, setCantidad] = useState("")
  const [costo, setCosto] = useState("")
  const [nota, setNota] = useState("")
  const [fallo, setFallo] = useState<string | null>(null)

  const valida = /^\d+([.,]\d{1,3})?$/.test(cantidad.trim())
  const numeroCantidad = Number(cantidad.replace(",", "."))
  const actual = Number(insumo.existencia)
  const quedara =
    motivo === "conteo" ? numeroCantidad : motivo === "merma" ? actual - numeroCantidad : actual + numeroCantidad

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    setFallo(null)
    try {
      await mover.mutateAsync({
        id: insumo.id,
        datos: {
          motivo,
          cantidad: cantidad.trim().replace(",", "."),
          costo_unit: motivo === "compra" && costo ? costo.replace(",", ".") : null,
          nota: nota.trim() || null,
        },
      })
      avisar("Existencia actualizada")
      alCerrar()
    } catch (e) {
      setFallo(aplicarErrorApi(e, () => {}, []))
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-4">
      <p className="text-sm text-tinta-suave">
        Hay <span className="tabular font-semibold text-tinta">{numero(insumo.existencia)}</span>{" "}
        {insumo.unidad} según el sistema.
      </p>
      <Selector
        etiqueta="Qué pasó"
        value={motivo}
        onChange={(e) => setMotivo(e.target.value as typeof motivo)}
      >
        <option value="conteo">Conté el estante</option>
        <option value="compra">Entró una compra</option>
        <option value="merma">Se perdió o se dañó</option>
      </Selector>
      <Campo
        etiqueta={motivo === "conteo" ? "Cuántas hay en el estante" : "Cantidad"}
        autoFocus
        inputMode="decimal"
        value={cantidad}
        onChange={(e) => setCantidad(e.target.value)}
        ayuda={
          valida
            ? `Quedará en ${numero(quedara)}${motivo === "conteo" ? ` (ajuste de ${numero(numeroCantidad - actual)})` : ""}.`
            : undefined
        }
        className="[&_input]:tabular"
      />
      {motivo === "compra" && (
        <Campo
          etiqueta="Costo por unidad (RD$)"
          opcional
          inputMode="decimal"
          value={costo}
          onChange={(e) => setCosto(e.target.value)}
          ayuda="Actualiza el costo del insumo."
          className="[&_input]:tabular"
        />
      )}
      <Campo etiqueta="Nota" opcional value={nota} onChange={(e) => setNota(e.target.value)} />

      {fallo && <Aviso>{fallo}</Aviso>}

      <PieDialogo>
        <Boton type="button" variante="contorno" onClick={alCerrar}>
          Cancelar
        </Boton>
        <Boton type="submit" disabled={!valida || mover.isPending}>
          Registrar
        </Boton>
      </PieDialogo>
    </form>
  )
}

function Kardex({ insumo }: { insumo: Insumo }) {
  const { data, isPending } = useKardex(insumo.id)

  if (isPending) return <EsqueletoTabla filas={4} />
  if (!data?.length) return <p className="text-sm text-tinta-suave">Sin movimientos.</p>

  return (
    <ol className="space-y-1.5 text-sm">
      {data.map((m) => (
        <li key={m.id} className="flex flex-wrap items-baseline justify-between gap-x-4">
          <span>
            <span className="tabular text-tinta-suave">
              {fecha(m.ocurrido_en)} {hora(m.ocurrido_en)}
            </span>
            <span className="ml-2">{MOTIVOS[m.motivo] ?? m.motivo}</span>
            {m.nota && <span className="ml-2 text-tinta-suave">— {m.nota}</span>}
          </span>
          <span className="tabular font-medium">
            {Number(m.cantidad) > 0 ? "+" : "−"}
            {numero(Math.abs(Number(m.cantidad)))}
          </span>
        </li>
      ))}
    </ol>
  )
}

type Abierto =
  | { tipo: "nuevo" }
  | { tipo: "editar" | "mover" | "kardex"; insumo: Insumo }
  | null

/** Un solo catálogo de insumos. La existencia sale del kárdex, no de un número editable. */
export function PantallaInventario() {
  const { puede } = useAuth()
  const [buscar, setBuscar] = useState("")
  const [soloBajos, setSoloBajos] = useState(false)
  const [inactivos, setInactivos] = useState(false)
  const [abierto, setAbierto] = useState<Abierto>(null)
  const { data, isPending, error } = useInventario(inactivos)

  const mueve = puede("facturacion", "doctor", "asistente")

  const visibles = useMemo(() => {
    const aguja = buscar.trim().toLowerCase()
    return (data?.items ?? []).filter(
      (i) =>
        (!soloBajos || i.bajo_minimo) &&
        (!aguja ||
          `${i.nombre} ${i.marca ?? ""} ${i.modelo ?? ""} ${i.categoria_nombre ?? ""}`
            .toLowerCase()
            .includes(aguja)),
    )
  }, [data, buscar, soloBajos])

  const columnas: Columna<Insumo>[] = [
    {
      id: "insumo",
      titulo: "Insumo",
      celda: (i) => (
        <>
          <span className="font-medium">{i.nombre}</span>
          {!i.activo && <Insignia className="ml-2">Inactivo</Insignia>}
          <span className="block text-xs text-tinta-suave">
            {[i.categoria_nombre, [i.marca, i.modelo].filter(Boolean).join(" ")].filter(Boolean).join(" · ") ||
              "—"}
          </span>
        </>
      ),
    },
    { id: "unidad", titulo: "Unidad", className: "text-tinta-suave", celda: (i) => i.unidad },
    {
      id: "costo",
      titulo: "Costo",
      alinear: "derecha",
      className: "tabular whitespace-nowrap",
      celda: (i) => moneda(i.costo),
    },
    {
      id: "existencia",
      titulo: "Existencia",
      alinear: "derecha",
      className: "tabular whitespace-nowrap",
      celda: (i) =>
        i.controla_stock ? (
          <>
            <span className={i.bajo_minimo ? "font-semibold" : undefined}>{numero(i.existencia)}</span>
            <span className="ml-1.5 text-xs text-tinta-suave">mín. {numero(i.stock_minimo)}</span>
            {i.bajo_minimo && <Insignia className="ml-2 border-tinta text-tinta">Reponer</Insignia>}
          </>
        ) : (
          <span className="text-tinta-suave">No se almacena</span>
        ),
    },
    {
      id: "acciones",
      titulo: "",
      alinear: "derecha",
      className: "whitespace-nowrap",
      celda: (i) => (
        <>
          {i.controla_stock && (
            <button
              type="button"
              onClick={() => setAbierto({ tipo: "kardex", insumo: i })}
              aria-label={`Movimientos de ${i.nombre}`}
              title="Movimientos"
              className="rounded-lg p-1.5 text-tinta-suave hover:bg-marca-tenue hover:text-marca"
            >
              <History className="h-4 w-4" aria-hidden />
            </button>
          )}
          {mueve && i.controla_stock && (
            <button
              type="button"
              onClick={() => setAbierto({ tipo: "mover", insumo: i })}
              aria-label={`Mover existencia de ${i.nombre}`}
              title="Entrada, merma o conteo"
              className="rounded-lg p-1.5 text-tinta-suave hover:bg-marca-tenue hover:text-marca"
            >
              <ArrowDownUp className="h-4 w-4" aria-hidden />
            </button>
          )}
          {mueve && (
            <button
              type="button"
              onClick={() => setAbierto({ tipo: "editar", insumo: i })}
              aria-label={`Editar ${i.nombre}`}
              className="rounded-lg p-1.5 text-tinta-suave hover:bg-marca-tenue hover:text-marca"
            >
              <Pencil className="h-4 w-4" aria-hidden />
            </button>
          )}
        </>
      ),
    },
  ]

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventario</h1>
          <p className="mt-1 text-sm text-tinta-suave">
            Materiales e insumos de la clínica, con lo que hay de cada uno.
          </p>
        </div>
        {mueve && (
          <Boton onClick={() => setAbierto({ tipo: "nuevo" })}>
            <Plus className="h-4 w-4" aria-hidden />
            Nuevo insumo
          </Boton>
        )}
      </div>

      {data && (
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Tarjeta className="p-4">
            <p className="text-xs text-tinta-suave">Insumos</p>
            <p className="tabular mt-1 text-xl font-semibold">{data.insumos}</p>
          </Tarjeta>
          <Tarjeta className="p-4">
            <p className="text-xs text-tinta-suave">Por reponer</p>
            <p className="tabular mt-1 text-xl font-semibold">{data.bajo_minimo}</p>
            <p className="mt-0.5 text-xs text-tinta-suave">En su mínimo o por debajo</p>
          </Tarjeta>
          <Tarjeta className="p-4">
            <p className="text-xs text-tinta-suave">Valor del almacén</p>
            <p className="tabular mt-1 text-xl font-semibold">{moneda(data.valor)}</p>
            <p className="mt-0.5 text-xs text-tinta-suave">Existencia por costo</p>
          </Tarjeta>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-suave"
            aria-hidden
          />
          <input
            type="search"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Nombre, marca o categoría"
            aria-label="Buscar insumos"
            className="w-72 max-w-full rounded-lg border border-linea-fuerte bg-superficie py-2 pl-9 pr-3 text-sm placeholder:text-tinta-suave/60"
          />
        </div>
        <Casilla
          etiqueta="Sólo por reponer"
          checked={soloBajos}
          onChange={(e) => setSoloBajos(e.target.checked)}
        />
        <Casilla
          etiqueta="Mostrar inactivos"
          checked={inactivos}
          onChange={(e) => setInactivos(e.target.checked)}
        />
      </div>

      <Tarjeta className="mt-4 overflow-hidden">
        {isPending ? (
          <EsqueletoTabla />
        ) : error ? (
          <ErrorCarga error={error} className="m-4 border-0" />
        ) : visibles.length === 0 ? (
          <Vacio
            titulo={data.items.length ? "Ningún insumo coincide" : "El inventario está vacío"}
            descripcion={
              data.items.length ? undefined : "Da de alta los materiales para llevar su existencia."
            }
          />
        ) : (
          <Tabla
            columnas={columnas}
            filas={visibles}
            clave={(i) => i.id}
            claseFila={(i) => (i.activo ? undefined : "text-tinta-suave")}
          />
        )}
      </Tarjeta>

      <Dialogo
        abierto={abierto?.tipo === "nuevo" || abierto?.tipo === "editar"}
        alCerrar={() => setAbierto(null)}
        titulo={abierto?.tipo === "editar" ? "Editar insumo" : "Nuevo insumo"}
        ancho="lg"
      >
        <FormularioInsumo
          insumo={abierto?.tipo === "editar" ? abierto.insumo : undefined}
          alCerrar={() => setAbierto(null)}
        />
      </Dialogo>
      <Dialogo
        abierto={abierto?.tipo === "mover"}
        alCerrar={() => setAbierto(null)}
        titulo="Mover existencia"
        descripcion={abierto?.tipo === "mover" ? abierto.insumo.nombre : undefined}
        ancho="sm"
      >
        {abierto?.tipo === "mover" && (
          <FormularioMovimiento insumo={abierto.insumo} alCerrar={() => setAbierto(null)} />
        )}
      </Dialogo>
      <Dialogo
        abierto={abierto?.tipo === "kardex"}
        alCerrar={() => setAbierto(null)}
        titulo="Movimientos"
        descripcion={abierto?.tipo === "kardex" ? abierto.insumo.nombre : undefined}
        ancho="md"
      >
        {abierto?.tipo === "kardex" && <Kardex insumo={abierto.insumo} />}
      </Dialogo>

      {puede("doctor", "asistente") && (
        <div className="mt-10">
          <TrazabilidadImplantes />
        </div>
      )}
    </div>
  )
}
