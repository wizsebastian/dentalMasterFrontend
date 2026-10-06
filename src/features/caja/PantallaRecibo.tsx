import { ArrowLeft, Printer } from "lucide-react"
import { Link, useParams } from "react-router-dom"

import { Cargando } from "../../components/brand"
import { Boton, ErrorCarga } from "../../components/ui"
import { fecha, hora, moneda, telefono } from "../../lib/formato"
import { useRecibo } from "./consultas"
import { metodo, numeroDeRecibo } from "./textos"
import { MembreteTicket } from "../clinica/Membrete"

function Renglon({ a, b, fuerte }: { a: string; b: string; fuerte?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${fuerte ? "font-semibold" : ""}`}>
      <span>{a}</span>
      <span className="tabular text-right">{b}</span>
    </div>
  )
}

const RAYA = <div className="my-2 border-t border-dashed border-current" aria-hidden />

/**
 * El recibo de un pago, en formato de ticket de 80 mm.
 *
 * Documenta el abono, no la consulta. A diferencia del sistema de referencia,
 * lleva los datos fiscales de la clínica, quién cobró y cómo queda el saldo.
 */
export function PantallaRecibo() {
  const { id } = useParams<{ id: string }>()
  const { data: recibo, isPending, error } = useRecibo(Number(id))

  if (isPending) {
    return (
      <div className="grid place-items-center py-24 text-marca">
        <Cargando size="lg" label="Cargando el recibo" />
      </div>
    )
  }
  if (error) return <ErrorCarga error={error} />

  const anulado = recibo.anulado_en !== null
  const balance = Number(recibo.balance_despues)

  return (
    <div>
      <div className="no-imprimir mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`/pacientes/${recibo.paciente_id}?pestana=cuenta`}
          className="inline-flex items-center gap-1.5 text-sm text-tinta-suave hover:text-tinta"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {recibo.paciente_nombre}
        </Link>
        <Boton onClick={() => window.print()}>
          <Printer className="h-4 w-4" aria-hidden />
          Imprimir
        </Boton>
      </div>

      <article
        className="hoja-ticket mx-auto w-[80mm] max-w-full rounded-lg border border-linea bg-superficie
          p-4 font-mono text-xs leading-relaxed print:rounded-none print:border-0 print:p-0"
      >
        <MembreteTicket />

        {RAYA}
        <Renglon a="Recibo N.º" b={numeroDeRecibo(recibo.numero_recibo)} fuerte />
        <Renglon a="Fecha" b={fecha(recibo.fecha)} />
        <Renglon a="Hora" b={hora(recibo.registrado_en)} />

        {anulado && (
          <p className="my-2 border-2 border-current py-1 text-center text-sm font-semibold uppercase">
            Anulado
          </p>
        )}

        {RAYA}
        <p className="font-semibold uppercase">Cliente</p>
        <p>{recibo.paciente_nombre}</p>
        {recibo.paciente_documento && <p>Céd. {recibo.paciente_documento}</p>}
        {recibo.paciente_telefono && <p>Tel. {telefono(recibo.paciente_telefono)}</p>}

        {RAYA}
        <Renglon a={recibo.concepto ?? "Tratamiento odontológico"} b={moneda(recibo.monto)} />
        {recibo.referencia && <p>Ref. {recibo.referencia}</p>}

        {RAYA}
        <Renglon a="TOTAL" b={moneda(recibo.monto)} fuerte />
        <Renglon a={`Pagado (${metodo(recibo.metodo).toLowerCase()})`} b={moneda(recibo.monto)} />

        {!anulado && (
          <>
            {RAYA}
            <Renglon
              a={balance < 0 ? "Crédito a favor" : "Saldo pendiente"}
              b={moneda(Math.abs(balance))}
            />
          </>
        )}

        {RAYA}
        <footer className="text-center">
          {recibo.recibido_por_email && <p>Le atendió: {recibo.recibido_por_email}</p>}
          <p className="mt-1 font-semibold">¡Gracias por su preferencia!</p>
          <p>Conserve este recibo</p>
        </footer>
      </article>
    </div>
  )
}
