import { useState, type FormEvent } from "react"
import { Ban, FileCheck2, Printer } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import { ApiError } from "../../api/client"
import type { Factura, FacturasDelPaciente, PacienteDetalle } from "../../api/tipos"
import {
  Aviso,
  Boton,
  Campo,
  Casilla,
  Dialogo,
  DialogoMotivo,
  Insignia,
  PieDialogo,
  Selector,
  Tarjeta,
  useAviso,
} from "../../components/ui"
import { fecha, moneda } from "../../lib/formato"
import { useAuth } from "../auth/contexto"
import { useAnularFactura, useEmitirFactura, useFacturas } from "./consultas"
import { TIPOS_NCF, tipoNcf, type TipoNcf } from "./textos"

function FormularioFactura({
  paciente,
  facturables,
  alCerrar,
}: {
  paciente: PacienteDetalle
  facturables: FacturasDelPaciente["facturables"]
  alCerrar: () => void
}) {
  const navegar = useNavigate()
  const emitir = useEmitirFactura(paciente.id)
  const [tipo, setTipo] = useState<TipoNcf>("B02")
  const [elegidas, setElegidas] = useState(() => new Set(facturables.map((l) => l.procedimiento_id)))
  const [rnc, setRnc] = useState("")
  const [razon, setRazon] = useState("")
  const [fallo, setFallo] = useState<string | null>(null)

  const total = facturables
    .filter((l) => elegidas.has(l.procedimiento_id))
    .reduce((suma, l) => suma + Number(l.total), 0)
  const conRnc = tipo !== "B02"
  const digitos = rnc.replace(/\D/g, "")
  const rncValido = digitos.length === 9 || digitos.length === 11
  const listo = elegidas.size > 0 && (!conRnc || (rncValido && razon.trim().length > 0))

  function alternar(id: number) {
    setElegidas((previas) => {
      const nuevas = new Set(previas)
      if (!nuevas.delete(id)) nuevas.add(id)
      return nuevas
    })
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setFallo(null)
    try {
      const factura = await emitir.mutateAsync({
        tipo_ncf: tipo,
        procedimiento_ids: facturables
          .filter((l) => elegidas.has(l.procedimiento_id))
          .map((l) => l.procedimiento_id),
        rnc_cliente: digitos || null,
        razon_social: razon.trim() || null,
      })
      navegar(`/facturas/${factura.id}`)
    } catch (e) {
      setFallo(e instanceof ApiError ? e.detail : "No se pudo emitir el comprobante")
    }
  }

  return (
    <form onSubmit={enviar} noValidate>
      <Selector
        etiqueta="Tipo de comprobante"
        value={tipo}
        onChange={(e) => setTipo(e.target.value as TipoNcf)}
        ayuda={TIPOS_NCF.find((t) => t.id === tipo)?.ayuda}
      >
        {TIPOS_NCF.map((t) => (
          <option key={t.id} value={t.id}>
            {t.etiqueta} ({t.id})
          </option>
        ))}
      </Selector>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Campo
          etiqueta={conRnc ? "RNC o cédula" : "RNC o cédula (opcional)"}
          inputMode="numeric"
          value={rnc}
          onChange={(e) => setRnc(e.target.value)}
          error={rnc && !rncValido ? "El RNC tiene 9 dígitos; la cédula, 11" : undefined}
        />
        <Campo
          etiqueta={conRnc ? "Razón social" : "A nombre de"}
          value={razon}
          placeholder={`${paciente.nombres} ${paciente.apellidos}`}
          onChange={(e) => setRazon(e.target.value)}
        />
      </div>

      <fieldset className="mt-5">
        <legend className="text-sm font-medium">Qué se factura</legend>
        <ul className="mt-2 divide-y divide-linea rounded-lg border border-linea">
          {facturables.map((linea) => (
            <li key={linea.procedimiento_id} className="flex items-center justify-between gap-3 px-3 py-2">
              <Casilla
                etiqueta={linea.descripcion}
                checked={elegidas.has(linea.procedimiento_id)}
                onChange={() => alternar(linea.procedimiento_id)}
              />
              <span className="tabular whitespace-nowrap text-sm">
                <span className="mr-3 text-xs text-tinta-suave">{fecha(linea.fecha)}</span>
                {moneda(linea.total)}
              </span>
            </li>
          ))}
        </ul>
        <p className="tabular mt-2 text-right text-sm font-semibold">Total {moneda(total)}</p>
      </fieldset>

      <p className="mt-3 text-xs text-tinta-suave">
        El comprobante toma el siguiente número de la secuencia y ya no se edita: si sale mal, se
        anula y se emite otro. No cambia lo que el paciente debe.
      </p>

      {fallo && <Aviso className="mt-4">{fallo}</Aviso>}

      <PieDialogo>
        <Boton type="button" variante="contorno" onClick={alCerrar}>
          Cancelar
        </Boton>
        <Boton type="submit" disabled={!listo || emitir.isPending}>
          Emitir comprobante
        </Boton>
      </PieDialogo>
    </form>
  )
}

/** Los comprobantes fiscales del paciente, y emitir uno sobre lo ya ejecutado. */
export function SeccionFacturas({ paciente }: { paciente: PacienteDetalle }) {
  const avisar = useAviso()
  const { puede } = useAuth()
  const { data } = useFacturas(paciente.id)
  const anular = useAnularFactura()
  const [emitiendo, setEmitiendo] = useState(false)
  const [anulando, setAnulando] = useState<Factura | null>(null)

  const emite = puede("recepcion", "facturacion")
  const anula = puede("facturacion")

  // Sin nada emitido ni nada que facturar, la sección no aporta.
  if (!data || (data.facturas.length === 0 && data.facturables.length === 0)) return null

  return (
    <section>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Comprobantes fiscales</h2>
        {emite && data.facturables.length > 0 && (
          <Boton variante="contorno" className="py-1.5" onClick={() => setEmitiendo(true)}>
            <FileCheck2 className="h-4 w-4" aria-hidden />
            Emitir comprobante
          </Boton>
        )}
      </div>

      <Tarjeta className="overflow-hidden">
        {data.facturas.length === 0 ? (
          <p className="px-4 py-3 text-sm text-tinta-suave">
            No se ha emitido ninguno. Se emiten a petición del paciente, sobre lo ya realizado.
          </p>
        ) : (
          <ul>
            {data.facturas.map((f) => {
              const anulada = f.estado === "anulada"
              return (
                <li
                  key={f.id}
                  className={`flex flex-wrap items-center justify-between gap-3 border-b border-linea px-4 py-2.5 text-sm last:border-0 ${
                    anulada ? "text-tinta-suave" : ""
                  }`}
                >
                  <span>
                    <Link to={`/facturas/${f.id}`} className="tabular font-mono text-marca hover:underline">
                      {f.numero}
                    </Link>
                    <span className="tabular ml-3">{fecha(f.fecha)}</span>
                    <span className="ml-3 text-tinta-suave">{tipoNcf(f.tipo_ncf)}</span>
                    {anulada && <Insignia className="ml-3">Anulado</Insignia>}
                    {anulada && f.motivo_anulacion && (
                      <span className="block text-xs">Motivo: {f.motivo_anulacion}</span>
                    )}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className={`tabular mr-2 font-semibold ${anulada ? "line-through" : ""}`}>
                      {moneda(f.total)}
                    </span>
                    <Link
                      to={`/facturas/${f.id}`}
                      aria-label={`Ver e imprimir el comprobante ${f.numero}`}
                      className="rounded-lg p-1.5 text-tinta-suave hover:bg-marca-tenue hover:text-marca"
                    >
                      <Printer className="h-4 w-4" aria-hidden />
                    </Link>
                    {anula && !anulada && (
                      <button
                        type="button"
                        onClick={() => setAnulando(f)}
                        aria-label={`Anular el comprobante ${f.numero}`}
                        title="Anular"
                        className="rounded-lg p-1.5 text-tinta-suave hover:bg-marca-tenue hover:text-marca"
                      >
                        <Ban className="h-4 w-4" aria-hidden />
                      </button>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </Tarjeta>

      <Dialogo
        abierto={emitiendo}
        alCerrar={() => setEmitiendo(false)}
        titulo="Emitir comprobante fiscal"
        descripcion={`${paciente.nombres} ${paciente.apellidos}`}
        ancho="lg"
      >
        <FormularioFactura
          paciente={paciente}
          facturables={data.facturables}
          alCerrar={() => setEmitiendo(false)}
        />
      </Dialogo>
      <DialogoMotivo
        abierto={anulando !== null}
        alCerrar={() => setAnulando(null)}
        titulo="Anular comprobante"
        descripcion={anulando ? `${anulando.numero} · ${moneda(anulando.total)}` : undefined}
        explicacion="El número no se reutiliza: queda anulado y se declara así. Sus líneas vuelven a poder facturarse."
        accion="Anular comprobante"
        alConfirmar={async (motivo) => {
          if (!anulando) return
          await anular.mutateAsync({ id: anulando.id, motivo })
          avisar(`Comprobante ${anulando.numero} anulado`)
        }}
      />
    </section>
  )
}
