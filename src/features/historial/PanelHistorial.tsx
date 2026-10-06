import { useState } from "react"
import { FolderPlus, Pencil, Plus, Trash2 } from "lucide-react"
import { Link } from "react-router-dom"

import { ApiError } from "../../api/client"
import type { Consulta, PacienteDetalle, PlanConConsultas } from "../../api/tipos"
import {
  Aviso,
  Boton,
  ErrorCarga,
  EsqueletoTabla,
  Insignia,
  Tarjeta,
  Vacio,
  useAviso,
} from "../../components/ui"
import { doctor, fecha, moneda } from "../../lib/formato"
import { FotosConsulta } from "../archivos/Archivos"
import { DialogoImplante, type ImplanteInicial } from "../implantes/Implantes"
import { useAuth } from "../auth/contexto"
import { DialogoPago, type PagoInicial } from "../caja/DialogoPago"
import { DialogoConsulta, type ConsultaInicial } from "./DialogoConsulta"
import { DialogoPlan } from "./DialogoPlan"
import { useBorrarConsulta, useHistorial } from "./consultas"
import { ESTADO_PLAN, pieza } from "./textos"

function Progreso({ plan }: { plan: PlanConConsultas }) {
  const total = Number(plan.total)
  const hecho = Number(plan.ejecutado)
  const fraccion = total > 0 ? Math.min(hecho / total, 1) : 0
  const cumplidos = plan.items.filter((i) => i.ejecutado).length

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 text-xs text-tinta-suave">
        <span>
          {plan.items.length === 0
            ? "Sin ítems cotizados"
            : `${cumplidos} de ${plan.items.length} ítems hechos`}
        </span>
        <span className="tabular">
          {moneda(plan.ejecutado)} de {moneda(plan.total)}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-linea" aria-hidden>
        <div className="h-full rounded-full bg-marca" style={{ width: `${fraccion * 100}%` }} />
      </div>
    </div>
  )
}

function FilaConsulta({
  consulta,
  edita,
  alEditar,
  alBorrar,
  alCobrar,
}: {
  consulta: Consulta
  edita: boolean
  alEditar: () => void
  alBorrar: () => void
  /** Sin él no se ofrece cobrar (el rol no cobra). */
  alCobrar?: () => void
}) {
  const saldo = Number(consulta.saldo)
  const aplicado = Number(consulta.aplicado)
  const [implante, setImplante] = useState<ImplanteInicial | null>(null)

  return (
    <li className="border-t border-linea px-4 py-3 first:border-0">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div className="text-sm">
          <span className="tabular font-medium">{fecha(consulta.fecha)}</span>
          <span className="ml-2 text-tinta-suave">
            {doctor(consulta.doctor_nombre)}
            {consulta.unidad_nombre && ` · ${consulta.unidad_nombre}`}
          </span>
          {consulta.motivo && <span className="block text-tinta-suave">{consulta.motivo}</span>}
        </div>

        <div className="flex items-center gap-3">
          {/* El saldo lo calcula la base: aquí sólo se nombra. */}
          <div className="text-right text-sm">
            {Number(consulta.total) === 0 ? (
              <span className="text-tinta-suave">Sin cargos</span>
            ) : saldo <= 0 ? (
              <span className="tabular">Pagada · {moneda(consulta.total)}</span>
            ) : (
              <>
                <span className="tabular font-semibold">Pendiente {moneda(consulta.saldo)}</span>
                {aplicado > 0 && (
                  <span className="tabular block text-xs text-tinta-suave">
                    abonado {moneda(consulta.aplicado)} de {moneda(consulta.total)}
                  </span>
                )}
              </>
            )}
          </div>
          {alCobrar && saldo > 0 && (
            <Boton variante="contorno" className="no-imprimir py-1.5" onClick={alCobrar}>
              {aplicado > 0 ? "Cobrar resto" : "Cobrar"}
            </Boton>
          )}
          {edita && (
            <span className="no-imprimir flex">
              <button
                type="button"
                onClick={alEditar}
                aria-label={`Editar la consulta del ${fecha(consulta.fecha)}`}
                className="rounded-lg p-1.5 text-tinta-suave hover:bg-marca-tenue hover:text-marca"
              >
                <Pencil className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={alBorrar}
                disabled={aplicado > 0}
                title={aplicado > 0 ? "Tiene pagos aplicados" : undefined}
                aria-label={`Eliminar la consulta del ${fecha(consulta.fecha)}`}
                className="rounded-lg p-1.5 text-tinta-suave hover:bg-marca-tenue hover:text-marca disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </span>
          )}
        </div>
      </div>

      {consulta.lineas.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-sm">
          {consulta.lineas.map((linea) => (
            <li key={linea.id} className="flex flex-wrap items-baseline justify-between gap-x-4">
              <span>
                {linea.cantidad > 1 && <span className="tabular">{linea.cantidad} × </span>}
                {linea.servicio_nombre}
                {pieza(linea) && (
                  <span className="tabular ml-2 font-mono text-xs text-tinta-suave">{pieza(linea)}</span>
                )}
                {/* Un implante sin lote no se puede rastrear: se pide aquí mismo. */}
                {linea.es_implante &&
                  (linea.implante_id !== null ? (
                    <span className="ml-2 text-xs text-tinta-suave">· lote registrado</span>
                  ) : (
                    edita && (
                      <button
                        type="button"
                        onClick={() =>
                          setImplante({
                            pacienteId: consulta.paciente_id,
                            procedimientoId: linea.id,
                            codigoFdi: linea.codigo_fdi,
                          })
                        }
                        className="no-imprimir ml-2 rounded-md border border-tinta px-1.5 py-0.5 text-xs font-medium hover:bg-marca-tenue"
                      >
                        Registrar lote
                      </button>
                    )
                  ))}
              </span>
              <span className="tabular text-tinta-suave">{moneda(linea.total)}</span>
            </li>
          ))}
        </ul>
      )}

      {(consulta.diagnostico || consulta.plan) && (
        <p className="mt-2 text-sm text-tinta-suave">
          {[consulta.diagnostico, consulta.plan].filter(Boolean).join(" · ")}
        </p>
      )}

      <FotosConsulta pacienteId={consulta.paciente_id} consultaId={consulta.id} edita={edita} />
      <DialogoImplante inicial={implante} alCerrar={() => setImplante(null)} />
    </li>
  )
}

/**
 * Lo que se le ha hecho al paciente y lo que debe por ello: sus planes de
 * tratamiento con sus consultas y, aparte, las consultas sueltas.
 */
export function PanelHistorial({ paciente }: { paciente: PacienteDetalle }) {
  const avisar = useAviso()
  const { puede } = useAuth()
  const { data, isPending, error } = useHistorial(paciente.id)
  const borrar = useBorrarConsulta(paciente.id)
  const [consulta, setConsulta] = useState<ConsultaInicial | null>(null)
  const [nuevoPlan, setNuevoPlan] = useState(false)
  const [pago, setPago] = useState<PagoInicial | null>(null)
  const [fallo, setFallo] = useState<string | null>(null)

  // Lo clínico lo escribe quien atiende, igual que en la API.
  const edita = puede("doctor", "asistente")
  const cobra = puede("recepcion", "facturacion", "doctor", "asistente")

  const cobrar = (c: Consulta) =>
    cobra
      ? () =>
          setPago({
            pacienteId: paciente.id,
            pacienteNombre: `${paciente.nombres} ${paciente.apellidos}`,
            consultaId: c.id,
          })
      : undefined

  async function alBorrar(c: Consulta) {
    setFallo(null)
    try {
      await borrar.mutateAsync(c.id)
      avisar("Consulta eliminada")
    } catch (e) {
      setFallo(e instanceof ApiError ? e.detail : "No se pudo eliminar la consulta")
    }
  }

  if (isPending) {
    return (
      <Tarjeta>
        <EsqueletoTabla filas={4} />
      </Tarjeta>
    )
  }
  if (error) return <ErrorCarga error={error} />

  const vacio = data.planes.length === 0 && data.sueltas.length === 0

  return (
    <div>
      {edita && (
        <div className="mb-4 flex flex-wrap justify-end gap-2">
          <Boton variante="contorno" onClick={() => setNuevoPlan(true)}>
            <FolderPlus className="h-4 w-4" aria-hidden />
            Nuevo plan
          </Boton>
          <Boton onClick={() => setConsulta({})}>
            <Plus className="h-4 w-4" aria-hidden />
            Nueva consulta
          </Boton>
        </div>
      )}

      {fallo && <Aviso className="mb-4">{fallo}</Aviso>}

      {vacio ? (
        <Tarjeta>
          <Vacio
            titulo="Sin historial todavía"
            descripcion="Registra la primera consulta, o abre un plan si el tratamiento va a llevar varias visitas."
          />
        </Tarjeta>
      ) : (
        <div className="space-y-4">
          {data.planes.map((plan) => (
            <Tarjeta key={plan.id} className="overflow-hidden">
              <div className="px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/pacientes/${paciente.id}/planes/${plan.id}`}
                        className="tabular font-mono text-sm text-marca hover:underline"
                      >
                        {plan.codigo}
                      </Link>
                      <span className="font-medium">
                        {plan.titulo ?? plan.especialidad_nombre ?? "Plan de tratamiento"}
                      </span>
                      <Insignia>{ESTADO_PLAN[plan.estado]}</Insignia>
                    </div>
                    <p className="mt-0.5 text-sm text-tinta-suave">
                      {doctor(plan.doctor_nombre)}
                      {plan.titulo && plan.especialidad_nombre && ` · ${plan.especialidad_nombre}`}
                      {` · abierto el ${fecha(plan.fecha)}`}
                    </p>
                  </div>
                  <div className="no-imprimir flex flex-wrap gap-2">
                    <Link
                      to={`/pacientes/${paciente.id}/planes/${plan.id}`}
                      className="rounded-lg border border-linea-fuerte px-3 py-1.5 text-sm hover:border-tinta-suave"
                    >
                      Plan y presupuesto
                    </Link>
                    {edita && plan.estado !== "finalizado" && plan.estado !== "rechazado" && (
                      <Boton className="py-1.5" onClick={() => setConsulta({ planId: plan.id })}>
                        <Plus className="h-4 w-4" aria-hidden />
                        Consulta
                      </Boton>
                    )}
                  </div>
                </div>
                <Progreso plan={plan} />
              </div>

              {plan.consultas.length > 0 ? (
                <ul className="border-t border-linea bg-esmalte/60">
                  {plan.consultas.map((c) => (
                    <FilaConsulta
                      key={c.id}
                      consulta={c}
                      edita={edita}
                      alEditar={() => setConsulta({ consulta: c })}
                      alBorrar={() => alBorrar(c)}
                      alCobrar={cobrar(c)}
                    />
                  ))}
                </ul>
              ) : (
                <p className="border-t border-linea px-4 py-3 text-sm text-tinta-suave">
                  Todavía no tiene consultas.
                </p>
              )}
            </Tarjeta>
          ))}

          {data.sueltas.length > 0 && (
            <section>
              {data.planes.length > 0 && (
                <h2 className="mb-2 text-sm font-semibold">Consultas sueltas</h2>
              )}
              <Tarjeta className="overflow-hidden">
                <ul>
                  {data.sueltas.map((c) => (
                    <FilaConsulta
                      key={c.id}
                      consulta={c}
                      edita={edita}
                      alEditar={() => setConsulta({ consulta: c })}
                      alBorrar={() => alBorrar(c)}
                      alCobrar={cobrar(c)}
                    />
                  ))}
                </ul>
              </Tarjeta>
            </section>
          )}
        </div>
      )}

      <DialogoConsulta
        inicial={consulta}
        alCerrar={() => setConsulta(null)}
        pacienteId={paciente.id}
        planes={data.planes}
        doctorTratanteId={paciente.doctor_tratante_id}
      />
      <DialogoPago inicial={pago} alCerrar={() => setPago(null)} />
      <DialogoPlan
        abierto={nuevoPlan}
        alCerrar={() => setNuevoPlan(false)}
        pacienteId={paciente.id}
        doctorPorDefecto={paciente.doctor_tratante_id}
      />
    </div>
  )
}
