import { useState, type FormEvent } from "react"
import { Ban, Pencil, Plus, Printer } from "lucide-react"
import { Link } from "react-router-dom"

import { ApiError } from "../../api/client"
import type { PacienteDetalle, Pago } from "../../api/tipos"
import {
  Boton,
  Campo,
  Dialogo,
  ErrorCarga,
  EsqueletoTabla,
  Insignia,
  PieDialogo,
  Tarjeta,
  Vacio,
  useAviso,
} from "../../components/ui"
import { fecha, moneda } from "../../lib/formato"
import { Comprobante } from "../archivos/Archivos"
import { useAuth } from "../auth/contexto"
import { SeccionFacturas } from "../fiscal/SeccionFacturas"
import { DialogoPago, type PagoInicial } from "./DialogoPago"
import { useAnularPago, useCorregirPago, useCuenta } from "./consultas"
import { metodo, numeroDeRecibo } from "./textos"

function Cifra({ etiqueta, valor, fuerte }: { etiqueta: string; valor: string; fuerte?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-tinta-suave">{etiqueta}</dt>
      <dd className={`tabular mt-0.5 ${fuerte ? "text-xl font-semibold" : "text-base"}`}>{valor}</dd>
    </div>
  )
}

/** Anular exige decir por qué: el motivo queda junto al recibo. */
function DialogoAnular({
  pago,
  pacienteId,
  alCerrar,
}: {
  pago: Pago | null
  pacienteId: number
  alCerrar: () => void
}) {
  const avisar = useAviso()
  const anular = useAnularPago(pacienteId)
  const [motivo, setMotivo] = useState("")
  const [fallo, setFallo] = useState<string | null>(null)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (!pago) return
    setFallo(null)
    try {
      await anular.mutateAsync({ id: pago.id, motivo })
      avisar(`Recibo ${numeroDeRecibo(pago.numero_recibo)} anulado`)
      setMotivo("")
      alCerrar()
    } catch (e) {
      setFallo(e instanceof ApiError ? e.detail : "No se pudo anular el pago")
    }
  }

  return (
    <Dialogo
      abierto={pago !== null}
      alCerrar={alCerrar}
      titulo="Anular pago"
      descripcion={
        pago ? `Recibo ${numeroDeRecibo(pago.numero_recibo)} · ${moneda(pago.monto)}` : undefined
      }
      ancho="sm"
    >
      <form onSubmit={enviar} noValidate>
        <p className="mb-4 text-sm text-tinta-suave">
          El pago no se borra: conserva su número de recibo, queda marcado como anulado y deja de
          contar en el saldo. Para corregir un monto, anula y registra otro.
        </p>
        <Campo
          etiqueta="Motivo"
          autoFocus
          placeholder="Se cobró dos veces, error de digitación…"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          error={fallo ?? undefined}
        />
        <PieDialogo>
          <Boton type="button" variante="contorno" onClick={alCerrar}>
            No anular
          </Boton>
          <Boton type="submit" disabled={anular.isPending || motivo.trim().length < 3}>
            Anular pago
          </Boton>
        </PieDialogo>
      </form>
    </Dialogo>
  )
}

/** Con el recibo emitido sólo se corrige lo que no cambia el dinero. */
function DialogoConcepto({
  pago,
  pacienteId,
  alCerrar,
}: {
  pago: Pago | null
  pacienteId: number
  alCerrar: () => void
}) {
  return (
    <Dialogo
      abierto={pago !== null}
      alCerrar={alCerrar}
      titulo="Corregir el recibo"
      descripcion={
        pago ? `Recibo ${numeroDeRecibo(pago.numero_recibo)} · ${moneda(pago.monto)}` : undefined
      }
      ancho="sm"
    >
      {pago && <FormularioConcepto pago={pago} pacienteId={pacienteId} alCerrar={alCerrar} />}
    </Dialogo>
  )
}

function FormularioConcepto({
  pago,
  pacienteId,
  alCerrar,
}: {
  pago: Pago
  pacienteId: number
  alCerrar: () => void
}) {
  const avisar = useAviso()
  const corregir = useCorregirPago(pacienteId)
  const [concepto, setConcepto] = useState(pago.concepto ?? "")
  const [referencia, setReferencia] = useState(pago.referencia ?? "")
  const [fallo, setFallo] = useState<string | null>(null)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setFallo(null)
    try {
      await corregir.mutateAsync({
        id: pago.id,
        datos: { concepto: concepto.trim() || null, referencia: referencia.trim() || null },
      })
      avisar("Recibo corregido")
      alCerrar()
    } catch (e) {
      setFallo(e instanceof ApiError ? e.detail : "No se pudo corregir el recibo")
    }
  }

  return (
    <form onSubmit={enviar} noValidate>
      <p className="mb-4 text-sm text-tinta-suave">
        El monto y la fecha no se cambian: para eso se anula el pago y se registra otro.
      </p>
      <div className="space-y-4">
        <Campo
          etiqueta="Concepto"
          autoFocus
          value={concepto}
          placeholder="Tratamiento odontológico"
          onChange={(e) => setConcepto(e.target.value)}
        />
        <Campo
          etiqueta="Referencia"
          value={referencia}
          placeholder="N.º de aprobación o de transferencia"
          onChange={(e) => setReferencia(e.target.value)}
          error={fallo ?? undefined}
        />
      </div>
      <PieDialogo>
        <Boton type="button" variante="contorno" onClick={alCerrar}>
          Cancelar
        </Boton>
        <Boton type="submit" disabled={corregir.isPending}>
          Guardar
        </Boton>
      </PieDialogo>
    </form>
  )
}

/** Lo que el paciente debe, lo que ha pagado y sus recibos. */
export function PanelCuenta({ paciente }: { paciente: PacienteDetalle }) {
  const { puede } = useAuth()
  const { data: cuenta, isPending, error } = useCuenta(paciente.id)
  const [pago, setPago] = useState<PagoInicial | null>(null)
  const [anulando, setAnulando] = useState<Pago | null>(null)
  const [corrigiendo, setCorrigiendo] = useState<Pago | null>(null)

  const cobra = puede("recepcion", "facturacion", "doctor", "asistente")
  const anula = puede("facturacion")
  const nombre = `${paciente.nombres} ${paciente.apellidos}`

  if (isPending) {
    return (
      <Tarjeta>
        <EsqueletoTabla filas={4} />
      </Tarjeta>
    )
  }
  if (error) return <ErrorCarga error={error} />

  const balance = Number(cuenta.balance)

  return (
    <div className="space-y-5">
      <Tarjeta className="flex flex-wrap items-end justify-between gap-4 p-4">
        <dl className="flex flex-wrap gap-x-10 gap-y-3">
          <Cifra etiqueta="Total de consultas" valor={moneda(cuenta.cargos)} />
          <Cifra etiqueta="Pagado" valor={moneda(cuenta.pagado)} />
          <Cifra
            etiqueta={balance < 0 ? "Crédito a favor" : "Balance pendiente"}
            valor={moneda(Math.abs(balance))}
            fuerte
          />
        </dl>
        {cobra && (
          <Boton onClick={() => setPago({ pacienteId: paciente.id, pacienteNombre: nombre })}>
            <Plus className="h-4 w-4" aria-hidden />
            Registrar pago
          </Boton>
        )}
      </Tarjeta>

      {cuenta.pendientes.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold">Consultas con saldo</h2>
          <Tarjeta className="overflow-hidden">
            <ul>
              {cuenta.pendientes.map((p) => (
                <li
                  key={p.consulta_id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-linea px-4 py-2.5 text-sm last:border-0"
                >
                  <span>
                    <span className="tabular font-medium">{fecha(p.fecha)}</span>
                    <span className="ml-2 text-tinta-suave">{p.descripcion}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-right">
                      <span className="tabular font-semibold">{moneda(p.saldo)}</span>
                      {Number(p.aplicado) > 0 && (
                        <span className="tabular block text-xs text-tinta-suave">
                          abonado {moneda(p.aplicado)} de {moneda(p.total)}
                        </span>
                      )}
                    </span>
                    {cobra && (
                      <Boton
                        variante="contorno"
                        className="py-1.5"
                        onClick={() =>
                          setPago({
                            pacienteId: paciente.id,
                            pacienteNombre: nombre,
                            consultaId: p.consulta_id,
                          })
                        }
                      >
                        Cobrar
                      </Boton>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </Tarjeta>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold">Pagos</h2>
        <Tarjeta className="overflow-hidden">
          {cuenta.pagos.length === 0 ? (
            <Vacio titulo="Sin pagos registrados" />
          ) : (
            <ul>
              {cuenta.pagos.map((p) => {
                const anulado = p.anulado_en !== null
                return (
                  <li
                    key={p.id}
                    className={`flex flex-wrap items-center justify-between gap-3 border-b border-linea px-4 py-2.5 text-sm last:border-0 ${
                      anulado ? "text-tinta-suave" : ""
                    }`}
                  >
                    <span>
                      <span className="tabular font-mono">{numeroDeRecibo(p.numero_recibo)}</span>
                      <span className="tabular ml-3">{fecha(p.fecha)}</span>
                      <span className="ml-3 text-tinta-suave">{metodo(p.metodo)}</span>
                      {p.concepto && <span className="ml-3 text-tinta-suave">{p.concepto}</span>}
                      {anulado && <Insignia className="ml-3">Anulado</Insignia>}
                      {anulado && p.motivo_anulacion && (
                        <span className="block text-xs">Motivo: {p.motivo_anulacion}</span>
                      )}
                      {!anulado && Number(p.sin_aplicar) > 0 && (
                        <span className="tabular block text-xs text-tinta-suave">
                          {moneda(p.sin_aplicar)} sin aplicar: crédito a favor
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className={`tabular mr-2 font-semibold ${anulado ? "line-through" : ""}`}>
                        {moneda(p.monto)}
                      </span>
                      <Comprobante
                        de="pagos"
                        id={p.id}
                        comprobanteId={p.comprobante_id}
                        edita={cobra && !anulado}
                      />
                      {cobra && !anulado && (
                        <button
                          type="button"
                          onClick={() => setCorrigiendo(p)}
                          aria-label={`Corregir el recibo ${numeroDeRecibo(p.numero_recibo)}`}
                          title="Corregir concepto o referencia"
                          className="rounded-lg p-1.5 text-tinta-suave hover:bg-marca-tenue hover:text-marca"
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                        </button>
                      )}
                      <Link
                        to={`/recibos/${p.id}`}
                        aria-label={`Recibo ${numeroDeRecibo(p.numero_recibo)}`}
                        title="Ver e imprimir el recibo"
                        className="rounded-lg p-1.5 text-tinta-suave hover:bg-marca-tenue hover:text-marca"
                      >
                        <Printer className="h-4 w-4" aria-hidden />
                      </Link>
                      {anula && !anulado && (
                        <button
                          type="button"
                          onClick={() => setAnulando(p)}
                          aria-label={`Anular el recibo ${numeroDeRecibo(p.numero_recibo)}`}
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
      </section>

      <SeccionFacturas paciente={paciente} />

      <DialogoPago inicial={pago} alCerrar={() => setPago(null)} />
      <DialogoAnular pago={anulando} pacienteId={paciente.id} alCerrar={() => setAnulando(null)} />
      <DialogoConcepto
        pago={corrigiendo}
        pacienteId={paciente.id}
        alCerrar={() => setCorrigiendo(null)}
      />
    </div>
  )
}
