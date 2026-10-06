import { Link } from "react-router-dom"

import type { ReporteDoctor as Reporte } from "../../api/tipos"
import { ErrorCarga, EsqueletoTabla, Tabla, Tarjeta, Vacio, type Columna } from "../../components/ui"
import { doctor, fecha, moneda } from "../../lib/formato"
import { metodo, numeroDeRecibo } from "../caja/textos"
import { pieza } from "../historial/textos"
import { useReporteDoctor } from "./consultas"
import type { Tramo } from "./tramos"
import { Membrete } from "../clinica/Membrete"

type Servicio = Reporte["servicios"][number]
type Linea = Reporte["lineas"][number]
type Cobro = Reporte["cobros"][number]
type Pago = Reporte["pagos"][number]

const DINERO = "tabular whitespace-nowrap"

const SERVICIOS: Columna<Servicio>[] = [
  {
    id: "servicio",
    titulo: "Servicio",
    celda: (s) => (
      <>
        <span className="font-medium">{s.servicio_nombre}</span>
        <span className="no-imprimir tabular ml-2 font-mono text-xs text-tinta-suave">
          {s.servicio_codigo}
        </span>
      </>
    ),
  },
  { id: "cantidad", titulo: "Veces", alinear: "derecha", className: "tabular", celda: (s) => s.cantidad },
  {
    id: "produccion",
    titulo: "Producción",
    alinear: "derecha",
    className: DINERO,
    celda: (s) => moneda(s.produccion),
  },
]

const LINEAS: Columna<Linea>[] = [
  { id: "fecha", titulo: "Fecha", className: DINERO, celda: (l) => fecha(l.fecha) },
  {
    id: "paciente",
    titulo: "Paciente",
    celda: (l) => (
      <Link to={`/pacientes/${l.paciente_id}`} className="font-medium hover:underline">
        {l.paciente_nombre}
      </Link>
    ),
  },
  {
    id: "servicio",
    titulo: "Servicio",
    celda: (l) => (
      <>
        {l.cantidad > 1 && <span className="tabular">{l.cantidad} × </span>}
        {l.servicio_nombre}
        {pieza(l) && <span className="tabular ml-2 font-mono text-xs text-tinta-suave">{pieza(l)}</span>}
      </>
    ),
  },
  { id: "total", titulo: "Total", alinear: "derecha", className: DINERO, celda: (l) => moneda(l.total) },
]

const COBROS: Columna<Cobro>[] = [
  { id: "fecha", titulo: "Cobrado el", className: DINERO, celda: (c) => fecha(c.fecha) },
  {
    id: "recibo",
    titulo: "Recibo",
    celda: (c) => (
      <Link to={`/recibos/${c.pago_id}`} className="tabular font-mono text-marca hover:underline">
        {numeroDeRecibo(c.numero_recibo)}
      </Link>
    ),
  },
  { id: "paciente", titulo: "Paciente", className: "font-medium", celda: (c) => c.paciente_nombre },
  {
    id: "consulta",
    titulo: "Por la consulta del",
    className: `${DINERO} text-tinta-suave`,
    celda: (c) => fecha(c.consulta_fecha),
  },
  { id: "monto", titulo: "Monto", alinear: "derecha", className: DINERO, celda: (c) => moneda(c.monto) },
]

const PAGOS: Columna<Pago>[] = [
  { id: "fecha", titulo: "Fecha", className: DINERO, celda: (p) => fecha(p.fecha) },
  { id: "descripcion", titulo: "Concepto", className: "font-medium", celda: (p) => p.descripcion },
  { id: "metodo", titulo: "Método", className: "text-tinta-suave", celda: (p) => metodo(p.metodo) },
  { id: "monto", titulo: "Monto", alinear: "derecha", className: DINERO, celda: (p) => moneda(p.monto) },
]

function Cifra({
  etiqueta,
  valor,
  nota,
  fuerte,
}: {
  etiqueta: string
  valor: string
  nota?: string
  fuerte?: boolean
}) {
  return (
    <Tarjeta className="no-partir p-4">
      <p className="text-xs text-tinta-suave">{etiqueta}</p>
      <p className={`tabular mt-1 font-semibold ${fuerte ? "text-2xl" : "text-xl"}`}>{valor}</p>
      {nota && <p className="tabular mt-0.5 text-xs text-tinta-suave">{nota}</p>}
    </Tarjeta>
  )
}

function Seccion<T>({
  titulo,
  nota,
  columnas,
  filas,
  clave,
  vacio,
  total,
}: {
  titulo: string
  nota?: string
  columnas: Columna<T>[]
  filas: T[]
  clave: (fila: T) => string | number
  vacio: string
  total?: string
}) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 flex flex-wrap items-baseline justify-between gap-3 text-sm font-semibold">
        {titulo}
        {total && <span className="tabular font-normal text-tinta-suave">{total}</span>}
      </h2>
      <Tarjeta className="hoja overflow-hidden">
        {filas.length === 0 ? (
          <p className="px-4 py-3 text-sm text-tinta-suave">{vacio}</p>
        ) : (
          <Tabla columnas={columnas} filas={filas} clave={clave} />
        )}
      </Tarjeta>
      {nota && <p className="mt-2 text-xs text-tinta-suave">{nota}</p>}
    </section>
  )
}

const veces = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

/**
 * El reporte de un doctor en un tramo: qué hizo, qué se cobró por ello y qué se
 * le debe. Es también la hoja de su liquidación: se imprime y se firma.
 *
 * La comisión es sobre lo **cobrado** por sus consultas, no sobre lo producido:
 * por eso el reporte enseña los cobros uno a uno, que son la base del cálculo.
 */
export function ReporteDoctor({ doctorId, tramo }: { doctorId: number; tramo: Tramo }) {
  const hasta = tramo.hasta < tramo.desde ? tramo.desde : tramo.hasta
  const { data, isPending, isFetching, error } = useReporteDoctor(doctorId, tramo.desde, hasta)

  if (isPending) {
    return (
      <Tarjeta className="mt-4">
        <EsqueletoTabla />
      </Tarjeta>
    )
  }
  if (error) return <ErrorCarga error={error} className="mt-4" />

  const sinActividad =
    data.lineas.length === 0 && data.cobros.length === 0 && data.pagos.length === 0
  const porLiquidar = Number(data.por_liquidar)

  return (
    <div className={isFetching ? "opacity-60" : undefined}>
      <Membrete
        soloPapel
        generado
        titulo="Reporte de producción y liquidación"
        detalle={
          <>
            <p className="font-medium">{doctor(data.doctor_nombre)}</p>
            <p>
              {fecha(data.desde)} – {fecha(data.hasta)}
            </p>
          </>
        }
      />

      <div className="no-imprimir mt-4">
        <p className="text-lg font-semibold">{doctor(data.doctor_nombre)}</p>
        {data.especialidades.length > 0 && (
          <p className="text-sm text-tinta-suave">{data.especialidades.join(" · ")}</p>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Cifra
          etiqueta="Producción"
          valor={moneda(data.produccion)}
          nota="Lo ejecutado, cobrado o no"
        />
        <Cifra etiqueta="Cobrado" valor={moneda(data.cobrado)} nota="Lo que entró por sus consultas" />
        <Cifra
          etiqueta={`Comisión · ${Number(data.comision_pct)} %`}
          valor={moneda(data.comision)}
          nota={Number(data.pagado) > 0 ? `ya pagado ${moneda(data.pagado)}` : "Sobre lo cobrado"}
        />
        <Cifra
          etiqueta={porLiquidar < 0 ? "Pagado de más" : "Por liquidar"}
          valor={moneda(Math.abs(porLiquidar))}
          nota="Comisión menos lo ya pagado"
          fuerte
        />
      </div>

      <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-tinta-suave">
        <span>{veces(data.consultas, "consulta", "consultas")}</span>
        <span>{veces(data.pacientes, "paciente atendido", "pacientes atendidos")}</span>
        {data.citas.total > 0 && (
          <span>
            {veces(data.citas.total, "cita", "citas")}: {data.citas.atendidas} atendidas ·{" "}
            {data.citas.no_asistio} ausencias · {data.citas.canceladas} canceladas
          </span>
        )}
        {Number(data.por_cobrar) > 0 && (
          <span>
            Sus consultas tienen <span className="tabular">{moneda(data.por_cobrar)}</span> por cobrar
          </span>
        )}
      </p>

      {sinActividad ? (
        <Tarjeta className="mt-6">
          <Vacio
            titulo="Sin actividad en este tramo"
            descripcion="No ejecutó tratamientos, no se cobró nada por sus consultas y no se le pagó nada."
          />
        </Tarjeta>
      ) : (
        <>
          <Seccion
            titulo="Qué hizo"
            columnas={SERVICIOS}
            filas={data.servicios}
            clave={(s) => s.servicio_codigo}
            vacio="No ejecutó tratamientos en el tramo."
            total={moneda(data.produccion)}
          />
          <Seccion
            titulo="Lo cobrado por sus consultas"
            nota="Es la base de la comisión. Un cobro cuenta en la fecha en que entró, aunque la consulta sea anterior."
            columnas={COBROS}
            filas={data.cobros}
            clave={(c) => `${c.pago_id}-${c.consulta_fecha}-${c.monto}`}
            vacio="No se cobró nada por sus consultas en el tramo."
            total={moneda(data.cobrado)}
          />
          <Seccion
            titulo="Pagos al doctor"
            nota="Los gastos de tipo doctor registrados a su nombre."
            columnas={PAGOS}
            filas={data.pagos}
            clave={(p) => p.gasto_id}
            vacio="No se le ha pagado nada en el tramo."
            total={moneda(data.pagado)}
          />
          <Seccion
            titulo="Detalle de lo ejecutado"
            columnas={LINEAS}
            filas={data.lineas}
            clave={(l) => l.procedimiento_id}
            vacio="No ejecutó tratamientos en el tramo."
          />
        </>
      )}

      <footer className="solo-imprimir no-partir mt-16 flex justify-between gap-10 text-xs">
        <p className="w-56 border-t border-black pt-1 text-center">{doctor(data.doctor_nombre)}</p>
        <p className="w-56 border-t border-black pt-1 text-center">Por la clínica</p>
      </footer>
    </div>
  )
}
