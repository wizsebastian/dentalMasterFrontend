import { useState } from "react"
import { Printer } from "lucide-react"
import { useSearchParams } from "react-router-dom"

import type { Resumen } from "../../api/tipos"
import {
  Boton,
  type Columna,
  ErrorCarga,
  EsqueletoTabla,
  Pestanas,
  SelectorFiltro,
  Tabla,
  Tarjeta,
  usePestana,
  Vacio,
} from "../../components/ui"
import { doctor, fecha, moneda } from "../../lib/formato"
import { useDoctores } from "../catalogo/consultas"
import { useResumen } from "../inventario/consultas"
import { ReporteDoctor } from "./ReporteDoctor"
import { SelectorTramo } from "./SelectorTramo"
import { esteMes, type Tramo } from "./tramos"
import { Membrete } from "../clinica/Membrete"

const PESTANAS = [
  { id: "clinica", etiqueta: "Clínica" },
  { id: "doctores", etiqueta: "Doctores" },
] as const

type FilaDoctor = Resumen["doctores"][number]
type FilaUnidad = Resumen["unidades"][number]

/** Las columnas del resumen por doctor; el nombre lleva a su reporte completo. */
function columnasDeDoctores(alAbrir: (doctorId: number) => void): Columna<FilaDoctor>[] {
  return [
    {
      id: "doctor",
      titulo: "Doctor",
      celda: (d) => (
        <button
          type="button"
          onClick={() => alAbrir(d.doctor_id)}
          className="font-medium text-marca hover:underline"
        >
          {doctor(d.doctor_nombre)}
        </button>
      ),
    },
    {
      id: "produccion",
      titulo: "Produjo",
      alinear: "derecha",
      className: "tabular whitespace-nowrap",
      celda: (d) => moneda(d.produccion),
    },
    {
      id: "cobrado",
      titulo: "Se cobró",
      alinear: "derecha",
      className: "tabular whitespace-nowrap",
      celda: (d) => moneda(d.cobrado),
    },
    {
      id: "pct",
      titulo: "Comisión",
      alinear: "derecha",
      className: "tabular text-tinta-suave",
      celda: (d) => `${Number(d.comision_pct)} %`,
    },
    {
      id: "comision",
      titulo: "Le corresponde",
      alinear: "derecha",
      className: "tabular whitespace-nowrap",
      celda: (d) => moneda(d.comision),
    },
    {
      id: "pagado",
      titulo: "Ya pagado",
      alinear: "derecha",
      className: "tabular whitespace-nowrap text-tinta-suave",
      celda: (d) => moneda(d.pagado),
    },
    {
      id: "pendiente",
      titulo: "Por liquidar",
      alinear: "derecha",
      className: "tabular whitespace-nowrap font-semibold",
      celda: (d) => moneda(Number(d.comision) - Number(d.pagado)),
    },
  ]
}

const UNIDADES: Columna<FilaUnidad>[] = [
  { id: "unidad", titulo: "Unidad", className: "font-medium", celda: (u) => u.unidad },
  { id: "consultas", titulo: "Consultas", alinear: "derecha", className: "tabular", celda: (u) => u.consultas },
  {
    id: "produccion",
    titulo: "Producción",
    alinear: "derecha",
    className: "tabular whitespace-nowrap",
    celda: (u) => moneda(u.produccion),
  },
]

function Cifra({ etiqueta, valor, nota, fuerte }: { etiqueta: string; valor: string; nota?: string; fuerte?: boolean }) {
  return (
    <Tarjeta className="no-partir p-4">
      <p className="text-xs text-tinta-suave">{etiqueta}</p>
      <p className={`tabular mt-1 font-semibold ${fuerte ? "text-2xl" : "text-xl"}`}>{valor}</p>
      {nota && <p className="mt-0.5 text-xs text-tinta-suave">{nota}</p>}
    </Tarjeta>
  )
}

/**
 * Lo que entró, lo que salió y quién lo produjo.
 *
 * La comisión de cada doctor se calcula sobre lo **cobrado** por sus consultas,
 * y se le resta lo ya pagado como gasto de tipo doctor: lo que queda es lo que
 * hay que liquidarle.
 */
function InformeClinica({ tramo, alAbrirDoctor }: { tramo: Tramo; alAbrirDoctor: (id: number) => void }) {
  const hasta = tramo.hasta < tramo.desde ? tramo.desde : tramo.hasta
  const { data, isPending, error } = useResumen(tramo.desde, hasta)

  return (
    <>
      <Membrete
        soloPapel
        generado
        titulo="Informe de la clínica"
        detalle={`${fecha(tramo.desde)} – ${fecha(hasta)}`}
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
            <Cifra etiqueta="Ingresos" valor={moneda(data.ingresos)} nota="Lo cobrado en el tramo" />
            <Cifra etiqueta="Gastos" valor={moneda(data.gastos)} nota="Lo pagado en el tramo" />
            <Cifra etiqueta="Neto" valor={moneda(data.neto)} nota="Ingresos menos gastos" fuerte />
            <Cifra etiqueta="Producción" valor={moneda(data.produccion)} nota="Lo ejecutado, cobrado o no" />
            <Cifra etiqueta="Por cobrar" valor={moneda(data.por_cobrar)} nota="Saldo de todos los pacientes, hoy" />
          </div>

          <section className="mt-6">
            <h2 className="mb-2 text-sm font-semibold">Por doctor</h2>
            <Tarjeta className="hoja overflow-hidden">
              <Tabla
                columnas={columnasDeDoctores(alAbrirDoctor)}
                filas={data.doctores}
                clave={(d) => d.doctor_id}
              />
            </Tarjeta>
            <p className="mt-2 text-xs text-tinta-suave">
              La comisión es sobre lo cobrado por sus consultas en el tramo. «Ya pagado» son los
              gastos de tipo doctor registrados a su nombre. El nombre abre el reporte completo
              del doctor.
            </p>
          </section>

          {data.unidades.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-2 text-sm font-semibold">Por unidad dental</h2>
              <Tarjeta className="hoja max-w-xl overflow-hidden">
                <Tabla columnas={UNIDADES} filas={data.unidades} clave={(u) => u.unidad} />
              </Tarjeta>
            </section>
          )}
        </>
      )}
    </>
  )
}

/** Elegir un doctor y ver su reporte. El doctor elegido vive en la URL. */
function InformeDoctores({ tramo }: { tramo: Tramo }) {
  const [parametros, setParametros] = useSearchParams()
  const { data: doctores } = useDoctores()
  const pedido = Number(parametros.get("doctor")) || null
  // Con uno solo no hay nada que elegir: se abre el suyo.
  const doctorId = pedido ?? (doctores?.length === 1 ? doctores[0].id : null)

  function elegir(id: string) {
    const siguientes = new URLSearchParams(parametros)
    if (id) siguientes.set("doctor", id)
    else siguientes.delete("doctor")
    setParametros(siguientes)
  }

  return (
    <>
      <label className="no-imprimir mt-4 block text-sm">
        <span className="block text-xs text-tinta-suave">Doctor</span>
        <SelectorFiltro
          value={doctorId ?? ""}
          onChange={(e) => elegir(e.target.value)}
          aria-label="Doctor"
          className="mt-1 w-72 max-w-full"
        >
          <option value="">Elige un doctor</option>
          {(doctores ?? []).map((d) => (
            <option key={d.id} value={d.id}>
              {doctor(d.nombre_completo)}
            </option>
          ))}
        </SelectorFiltro>
      </label>

      {doctorId === null ? (
        <Tarjeta className="mt-4">
          <Vacio
            titulo="Elige un doctor"
            descripcion="Verás lo que hizo en el tramo, lo que se cobró por sus consultas y lo que hay que liquidarle."
          />
        </Tarjeta>
      ) : (
        <ReporteDoctor doctorId={doctorId} tramo={tramo} />
      )}
    </>
  )
}

export function PantallaInformes() {
  const [pestana, setPestana] = usePestana(PESTANAS)
  const [, setParametros] = useSearchParams()
  // El tramo se comparte entre las dos pestañas: se compara el mismo periodo.
  const [tramo, setTramo] = useState(esteMes)

  return (
    <div>
      <div className="no-imprimir">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Informes</h1>
            <p className="mt-1 text-sm text-tinta-suave">
              Ingresos, gastos y producción de la clínica, y el reporte de cada doctor.
            </p>
          </div>
          <Boton variante="contorno" onClick={() => window.print()}>
            <Printer className="h-4 w-4" aria-hidden />
            Imprimir
          </Boton>
        </div>

        <div className="mt-6">
          <Pestanas pestanas={PESTANAS} activa={pestana} alCambiar={setPestana} />
        </div>
        <div className="mt-5">
          <SelectorTramo tramo={tramo} alCambiar={setTramo} />
        </div>
      </div>

      {pestana === "clinica" ? (
        <InformeClinica
          tramo={tramo}
          alAbrirDoctor={(id) => setParametros({ pestana: "doctores", doctor: String(id) })}
        />
      ) : (
        <InformeDoctores tramo={tramo} />
      )}
    </div>
  )
}
