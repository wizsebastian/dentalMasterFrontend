import { useState } from "react"
import { Printer, Search } from "lucide-react"
import { Link } from "react-router-dom"

import type { CuentaPorCobrar, PagoConPaciente } from "../../api/tipos"
import {
  Boton,
  ErrorCarga,
  EsqueletoTabla,
  Insignia,
  Pestanas,
  Tabla,
  Tarjeta,
  Vacio,
  usePestana,
  type Columna,
} from "../../components/ui"
import { fecha, moneda, telefono } from "../../lib/formato"
import { aFechaISO } from "../agenda/tiempo"
import { CierreDeCaja } from "../fiscal/CierreDeCaja"
import { DialogoPago, type PagoInicial } from "./DialogoPago"
import { useCaja, useCuentasPorCobrar } from "./consultas"
import { metodo, numeroDeRecibo } from "./textos"
import { Membrete } from "../clinica/Membrete"

const PESTANAS = [
  { id: "cobros", etiqueta: "Cobros" },
  { id: "por-cobrar", etiqueta: "Cuentas por cobrar" },
] as const

function Indicador({ etiqueta, valor, nota }: { etiqueta: string; valor: string; nota?: string }) {
  return (
    <Tarjeta className="no-partir p-4">
      <p className="text-xs text-tinta-suave">{etiqueta}</p>
      <p className="tabular mt-1 text-xl font-semibold">{valor}</p>
      {nota && <p className="tabular mt-0.5 text-xs text-tinta-suave">{nota}</p>}
    </Tarjeta>
  )
}

/** Lo cobrado en un tramo de fechas, por método: el cierre de caja. */
function Cobros() {
  const hoy = aFechaISO(new Date())
  const [desde, setDesde] = useState(hoy)
  const [hasta, setHasta] = useState(hoy)
  const { data, isPending, isFetching, error } = useCaja(desde, hasta < desde ? desde : hasta)

  const columnas: Columna<PagoConPaciente>[] = [
    {
      id: "recibo",
      titulo: "Recibo",
      celda: (p) => (
        <Link to={`/recibos/${p.id}`} className="tabular font-mono text-marca hover:underline">
          {numeroDeRecibo(p.numero_recibo)}
        </Link>
      ),
    },
    { id: "fecha", titulo: "Fecha", className: "tabular whitespace-nowrap", celda: (p) => fecha(p.fecha) },
    {
      id: "paciente",
      titulo: "Paciente",
      celda: (p) => (
        <Link to={`/pacientes/${p.paciente_id}?pestana=cuenta`} className="font-medium hover:underline">
          {p.paciente_nombre}
        </Link>
      ),
    },
    {
      id: "metodo",
      titulo: "Método",
      celda: (p) => (
        <>
          {metodo(p.metodo)}
          {p.referencia && <span className="ml-2 font-mono text-xs text-tinta-suave">{p.referencia}</span>}
        </>
      ),
    },
    {
      id: "monto",
      titulo: "Monto",
      alinear: "derecha",
      className: "tabular whitespace-nowrap",
      celda: (p) =>
        p.anulado_en ? (
          <>
            <span className="line-through">{moneda(p.monto)}</span>
            <Insignia className="ml-2">Anulado</Insignia>
          </>
        ) : (
          <span className="font-medium">{moneda(p.monto)}</span>
        ),
    },
  ]

  const tramo = desde === hasta ? fecha(desde) : `${fecha(desde)} – ${fecha(hasta)}`

  return (
    <div>
      <div className="no-imprimir flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="block text-xs text-tinta-suave">Desde</span>
          <input
            type="date"
            value={desde}
            max={hoy}
            onChange={(e) => e.target.value && setDesde(e.target.value)}
            className="mt-1 rounded-lg border border-linea-fuerte bg-superficie px-3 py-1.5 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="block text-xs text-tinta-suave">Hasta</span>
          <input
            type="date"
            value={hasta}
            max={hoy}
            onChange={(e) => e.target.value && setHasta(e.target.value)}
            className="mt-1 rounded-lg border border-linea-fuerte bg-superficie px-3 py-1.5 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={() => {
            setDesde(hoy)
            setHasta(hoy)
          }}
          disabled={desde === hoy && hasta === hoy}
          className="rounded-lg border border-linea-fuerte px-3 py-1.5 text-sm disabled:opacity-40"
        >
          Hoy
        </button>
        <Boton variante="contorno" className="ml-auto" onClick={() => window.print()}>
          <Printer className="h-4 w-4" aria-hidden />
          Imprimir cierre
        </Boton>
      </div>

      <Membrete soloPapel generado titulo="Cierre de caja" detalle={tramo} />

      {isPending ? (
        <Tarjeta className="mt-4">
          <EsqueletoTabla />
        </Tarjeta>
      ) : error ? (
        <ErrorCarga error={error} className="mt-4" />
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Indicador
              etiqueta="Total cobrado"
              valor={moneda(data.total)}
              nota={data.anulados > 0 ? `${data.anulados} anulado(s), fuera del total` : undefined}
            />
            {data.por_metodo.map((m) => (
              <Indicador
                key={m.metodo}
                etiqueta={metodo(m.metodo)}
                valor={moneda(m.monto)}
                nota={m.pagos === 1 ? "1 pago" : `${m.pagos} pagos`}
              />
            ))}
          </div>

          {/* Sólo se cierra un día, no un tramo. */}
          {desde === hasta && <CierreDeCaja dia={desde} />}

          <Tarjeta className="hoja mt-4 overflow-hidden">
            {data.pagos.length === 0 ? (
              <Vacio titulo="Sin cobros en este tramo" />
            ) : (
              <Tabla
                columnas={columnas}
                filas={data.pagos}
                clave={(p) => p.id}
                atenuada={isFetching}
                claseFila={(p) => (p.anulado_en ? "text-tinta-suave" : undefined)}
              />
            )}
          </Tarjeta>
        </>
      )}
    </div>
  )
}

/** Quién debe, cuánto y desde cuándo. */
function PorCobrar() {
  const [buscar, setBuscar] = useState("")
  const [pago, setPago] = useState<PagoInicial | null>(null)
  const { data, isPending, isFetching, error } = useCuentasPorCobrar(buscar)

  const columnas: Columna<CuentaPorCobrar>[] = [
    {
      id: "paciente",
      titulo: "Paciente",
      celda: (c) => (
        <>
          <Link to={`/pacientes/${c.paciente_id}?pestana=cuenta`} className="font-medium text-marca hover:underline">
            {c.paciente_nombre}
          </Link>
          <span className="tabular block font-mono text-xs text-tinta-suave">
            {c.paciente_codigo}
            {c.paciente_telefono && ` · ${telefono(c.paciente_telefono)}`}
          </span>
        </>
      ),
    },
    {
      id: "consultas",
      titulo: "Consultas con saldo",
      className: "tabular text-tinta-suave",
      celda: (c) => c.consultas,
    },
    {
      id: "desde",
      titulo: "Debe desde",
      className: "tabular whitespace-nowrap",
      celda: (c) =>
        c.desde ? (
          <>
            {fecha(c.desde)}
            <span className="ml-2 text-xs text-tinta-suave">
              {c.dias === 0 ? "hoy" : c.dias === 1 ? "1 día" : `${c.dias} días`}
            </span>
          </>
        ) : (
          "—"
        ),
    },
    {
      id: "pagado",
      titulo: "Abonado",
      alinear: "derecha",
      className: "tabular whitespace-nowrap text-tinta-suave",
      celda: (c) => moneda(c.pagado),
    },
    {
      id: "balance",
      titulo: "Debe",
      alinear: "derecha",
      className: "tabular whitespace-nowrap font-semibold",
      celda: (c) => moneda(c.balance),
    },
    {
      id: "acciones",
      titulo: "",
      alinear: "derecha",
      className: "no-imprimir",
      celda: (c) => (
        <Boton
          variante="contorno"
          className="py-1.5"
          onClick={() => setPago({ pacienteId: c.paciente_id, pacienteNombre: c.paciente_nombre })}
        >
          Cobrar
        </Boton>
      ),
    },
  ]

  return (
    <div>
      <div className="no-imprimir flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-suave"
            aria-hidden
          />
          <input
            type="search"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Nombre, expediente o teléfono"
            aria-label="Buscar en cuentas por cobrar"
            className="w-72 max-w-full rounded-lg border border-linea-fuerte bg-superficie py-2 pl-9 pr-3 text-sm placeholder:text-tinta-suave/60"
          />
        </div>
        <Boton variante="contorno" className="ml-auto" onClick={() => window.print()}>
          <Printer className="h-4 w-4" aria-hidden />
          Imprimir
        </Boton>
      </div>

      <Membrete
        soloPapel
        generado
        titulo="Cuentas por cobrar"
        detalle={data ? `${data.pacientes} paciente(s) · ${moneda(data.total)}` : ""}
      />

      {isPending ? (
        <Tarjeta className="mt-4">
          <EsqueletoTabla />
        </Tarjeta>
      ) : error ? (
        <ErrorCarga error={error} className="mt-4" />
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Indicador
              etiqueta="Total por cobrar"
              valor={moneda(data.total)}
              nota={data.pacientes === 1 ? "1 paciente" : `${data.pacientes} pacientes`}
            />
            {/* La antigüedad dice a quién llamar primero. */}
            {data.antiguedad.map((tramo) => (
              <Indicador
                key={tramo.etiqueta}
                etiqueta={tramo.etiqueta}
                valor={moneda(tramo.balance)}
                nota={tramo.pacientes === 1 ? "1 paciente" : `${tramo.pacientes} pacientes`}
              />
            ))}
          </div>

          <Tarjeta className="hoja mt-4 overflow-hidden">
            {data.items.length === 0 ? (
              <Vacio
                titulo={buscar.trim() ? "Nadie coincide" : "Nadie debe nada"}
                descripcion={buscar.trim() ? undefined : "Todos los pacientes están al día."}
              />
            ) : (
              <Tabla
                columnas={columnas}
                filas={data.items}
                clave={(c) => c.paciente_id}
                atenuada={isFetching}
              />
            )}
          </Tarjeta>
        </>
      )}

      <DialogoPago inicial={pago} alCerrar={() => setPago(null)} />
    </div>
  )
}

export function PantallaCaja() {
  const [pestana, setPestana] = usePestana(PESTANAS)

  return (
    <div>
      <div className="no-imprimir">
        <h1 className="text-2xl font-semibold tracking-tight">Caja</h1>
        <p className="mt-1 text-sm text-tinta-suave">
          Lo que entró y lo que falta por entrar.
        </p>
        <div className="mt-6">
          <Pestanas pestanas={PESTANAS} activa={pestana} alCambiar={setPestana} />
        </div>
      </div>

      <div className="mt-5">{pestana === "cobros" ? <Cobros /> : <PorCobrar />}</div>
    </div>
  )
}
