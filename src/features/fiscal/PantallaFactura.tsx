import { ArrowLeft, Printer } from "lucide-react"
import { Link, useParams } from "react-router-dom"

import { Cargando } from "../../components/brand"
import { Boton, ErrorCarga } from "../../components/ui"
import { fecha, moneda } from "../../lib/formato"
import { useFactura } from "./consultas"
import { Membrete } from "../clinica/Membrete"

function Total({ etiqueta, valor, fuerte }: { etiqueta: string; valor: string; fuerte?: boolean }) {
  return (
    <div className={`flex justify-between gap-8 ${fuerte ? "border-t border-black pt-1 font-semibold" : ""}`}>
      <dt>{etiqueta}</dt>
      <dd className="tabular">{valor}</dd>
    </div>
  )
}

/** El comprobante fiscal, en hoja carta, con lo que la DGII exige a la vista. */
export function PantallaFactura() {
  const { id } = useParams<{ id: string }>()
  const { data: factura, isPending, error } = useFactura(Number(id))

  if (isPending) {
    return (
      <div className="grid place-items-center py-24 text-marca">
        <Cargando size="lg" label="Cargando el comprobante" />
      </div>
    )
  }
  if (error) return <ErrorCarga error={error} />

  const anulada = factura.estado === "anulada"

  return (
    <div>
      <div className="no-imprimir mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`/pacientes/${factura.paciente_id}?pestana=cuenta`}
          className="inline-flex items-center gap-1.5 text-sm text-tinta-suave hover:text-tinta"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {factura.paciente_nombre}
        </Link>
        <Boton onClick={() => window.print()}>
          <Printer className="h-4 w-4" aria-hidden />
          Imprimir
        </Boton>
      </div>

      <article className="hoja mx-auto max-w-3xl rounded-xl border border-linea bg-superficie p-8 text-sm print:rounded-none print:border-0 print:p-0">
        <Membrete titulo={`Factura de ${factura.tipo_etiqueta.toLowerCase()}`}>
          <p className="tabular font-mono text-base">NCF {factura.numero}</p>
          <p className="tabular text-sm">Fecha: {fecha(factura.fecha)}</p>
          {factura.ncf_vence && (
            <p className="tabular text-sm">Válido hasta: {fecha(factura.ncf_vence)}</p>
          )}
        </Membrete>

        {anulada && (
          <p className="my-4 border-2 border-black py-1.5 text-center font-semibold uppercase">
            Anulado{factura.motivo_anulacion ? ` · ${factura.motivo_anulacion}` : ""}
          </p>
        )}

        <section className="mt-4">
          <p className="text-xs uppercase text-tinta-suave">Cliente</p>
          <p className="font-medium">{factura.razon_social ?? factura.paciente_nombre}</p>
          {factura.rnc_cliente && <p className="tabular">RNC/Cédula {factura.rnc_cliente}</p>}
          {factura.razon_social && factura.razon_social !== factura.paciente_nombre && (
            <p>Paciente: {factura.paciente_nombre}</p>
          )}
          <p className="tabular font-mono text-xs text-tinta-suave">{factura.paciente_codigo}</p>
        </section>

        <table className="mt-5 w-full">
          <thead>
            <tr className="border-b border-black text-left text-xs uppercase">
              <th className="py-1.5 font-medium">Descripción</th>
              <th className="py-1.5 text-right font-medium">Cant.</th>
              <th className="py-1.5 text-right font-medium">Precio</th>
              <th className="py-1.5 text-right font-medium">Desc.</th>
              <th className="py-1.5 text-right font-medium">Importe</th>
            </tr>
          </thead>
          <tbody>
            {factura.items.map((item) => (
              <tr key={item.id} className="border-b border-linea">
                <td className="py-1.5">{item.descripcion}</td>
                <td className="tabular py-1.5 text-right">{item.cantidad}</td>
                <td className="tabular py-1.5 text-right">{moneda(item.precio_unit)}</td>
                <td className="tabular py-1.5 text-right">
                  {Number(item.descuento_pct) > 0 ? `${Number(item.descuento_pct)} %` : "—"}
                </td>
                <td className="tabular py-1.5 text-right">{moneda(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="ml-auto mt-4 w-64 space-y-1">
          <Total etiqueta="Subtotal" valor={moneda(factura.subtotal)} />
          {Number(factura.descuento) > 0 && (
            <Total etiqueta="Descuento" valor={`− ${moneda(factura.descuento)}`} />
          )}
          <Total etiqueta="ITBIS (exento)" valor={moneda(factura.impuesto)} />
          <Total etiqueta="Total" valor={moneda(factura.total)} fuerte />
        </dl>

        <footer className="mt-10 text-xs text-tinta-suave">
          Servicios de salud exentos de ITBIS (art. 344 del Código Tributario).
        </footer>
      </article>
    </div>
  )
}
