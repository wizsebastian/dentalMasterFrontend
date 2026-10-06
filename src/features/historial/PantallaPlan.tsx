import { useState, type FormEvent } from "react"
import { ArrowLeft, Pencil, Plus, Printer, Trash2 } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { ApiError } from "../../api/client"
import type { Plan, PlanItem, ValorEstadoPlan } from "../../api/tipos"
import { Cargando } from "../../components/brand"
import {
  Aviso,
  Boton,
  Campo,
  Dialogo,
  ErrorCarga,
  Insignia,
  PieDialogo,
  Selector,
  Tarjeta,
  useAviso,
} from "../../components/ui"
import { doctor, fecha, fechaLarga, moneda, telefono } from "../../lib/formato"
import { useAuth } from "../auth/contexto"
import { useServicios } from "../catalogo/consultas"
import { usePaciente } from "../pacientes/consultas"
import { DialogoPlan } from "./DialogoPlan"
import {
  useActualizarItem,
  useBorrarItem,
  useBorrarPlan,
  useCrearItem,
  useGuardarPlan,
  usePlan,
} from "./consultas"
import { ACCION_PLAN, ESTADO_PLAN, IMPORTE, pieza } from "./textos"
import { Membrete } from "../clinica/Membrete"

/** Las caras que acepta el servidor: mesial, distal, vestibular, lingual, oclusal, incisal. */
const CARAS = /^[MDVLOI]*$/

/**
 * Alta de un ítem: el servicio en su propia fila y debajo lo que ese servicio
 * pide. Un servicio que se hace sobre una pieza (o una cara) marca esos campos
 * como obligatorios y no deja añadir hasta que se llenan, diciendo por qué.
 */
function NuevoItem({ pacienteId, plan }: { pacienteId: number; plan: Plan }) {
  const avisar = useAviso()
  const { data: servicios } = useServicios()
  const crear = useCrearItem(pacienteId, plan.id)
  const [servicioId, setServicioId] = useState("")
  const [codigoFdi, setCodigoFdi] = useState("")
  const [superficies, setSuperficies] = useState("")
  const [cantidad, setCantidad] = useState("1")
  const [precio, setPrecio] = useState("")
  const [fase, setFase] = useState("1")
  const [fallo, setFallo] = useState<string | null>(null)

  const servicio = servicios?.find((s) => String(s.id) === servicioId)
  const deTarifa = servicio?.precios.find((p) => p.lista_precio_id === plan.lista_precio_id)?.precio

  const piezaObligatoria = Boolean(servicio?.requiere_diente || servicio?.requiere_superficie)
  const carasObligatorias = Boolean(servicio?.requiere_superficie)
  const faltaPieza = piezaObligatoria && !codigoFdi.trim()
  const faltaCara = carasObligatorias && !superficies.trim()
  const carasSinPieza = Boolean(superficies.trim()) && !codigoFdi.trim()
  const precioMalo = Boolean(precio) && !IMPORTE.test(precio)
  const incompleto = !servicio || faltaPieza || faltaCara || carasSinPieza || precioMalo

  // Qué le falta al ítem, dicho con el nombre del servicio.
  const motivo = !servicio
    ? null
    : faltaPieza && faltaCara
      ? `«${servicio.nombre}» pide pieza y al menos una cara.`
      : faltaPieza
        ? `«${servicio.nombre}» se hace sobre una pieza: indica cuál.`
        : faltaCara
          ? `«${servicio.nombre}» pide al menos una cara (M, D, V, L, O o I).`
          : carasSinPieza
            ? "Indica la pieza a la que pertenecen las caras."
            : null

  const grupos = new Map<string, NonNullable<typeof servicios>>()
  for (const s of servicios ?? []) {
    grupos.set(s.categoria_nombre, [...(grupos.get(s.categoria_nombre) ?? []), s])
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setFallo(null)
    if (incompleto) return
    try {
      await crear.mutateAsync({
        servicio_id: Number(servicioId),
        codigo_fdi: codigoFdi ? Number(codigoFdi) : null,
        superficies: superficies.trim() || null,
        cantidad: Number(cantidad) || 1,
        precio_unit: precio ? precio.replace(",", ".") : null,
        descuento_pct: "0",
        fase: Number(fase) || 1,
        prioridad: 3,
        aprobado: false,
      })
      avisar(`«${servicio?.nombre}» añadido al plan`)
      setServicioId("")
      setCodigoFdi("")
      setSuperficies("")
      setCantidad("1")
      setPrecio("")
    } catch (e) {
      setFallo(e instanceof ApiError ? e.detail : "No se pudo añadir el ítem")
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="no-imprimir border-t border-linea bg-esmalte/60 px-4 py-4">
      <p className="mb-3 text-sm font-medium">Añadir al plan</p>

      <Selector
        etiqueta="Servicio a cotizar"
        value={servicioId}
        onChange={(e) => setServicioId(e.target.value)}
      >
        <option value="">Elige un servicio…</option>
        {[...grupos].map(([categoria, lista]) => (
          <optgroup key={categoria} label={categoria}>
            {lista.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </optgroup>
        ))}
      </Selector>

      <div className="mt-3 grid items-start gap-3 sm:grid-cols-[4rem_6rem_7rem_5rem_9rem_auto]">
        <Campo
          etiqueta="Fase"
          type="number"
          min={1}
          max={9}
          value={fase}
          onChange={(e) => setFase(e.target.value)}
          className="[&_input]:tabular"
        />
        <Campo
          etiqueta={piezaObligatoria ? "Pieza (FDI) *" : "Pieza (FDI)"}
          inputMode="numeric"
          placeholder="Ej. 26"
          value={codigoFdi}
          disabled={!servicio}
          error={faltaPieza || carasSinPieza ? "Obligatoria" : undefined}
          onChange={(e) => setCodigoFdi(e.target.value.replace(/\D/g, "").slice(0, 2))}
          className="[&_input]:tabular [&_input]:font-mono"
        />
        <Campo
          etiqueta={carasObligatorias ? "Caras *" : "Caras"}
          placeholder="Ej. MOD"
          value={superficies}
          disabled={!servicio}
          error={faltaCara ? "Obligatoria" : !CARAS.test(superficies) ? "Sólo M D V L O I" : undefined}
          onChange={(e) =>
            setSuperficies(e.target.value.toUpperCase().replace(/[^MDVLOI]/g, ""))
          }
          className="[&_input]:font-mono [&_input]:uppercase"
        />
        <Campo
          etiqueta="Cantidad"
          type="number"
          min={1}
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          className="[&_input]:tabular"
        />
        <Campo
          etiqueta="Precio"
          inputMode="decimal"
          placeholder={deTarifa ?? "De la tarifa"}
          value={precio}
          error={precioMalo ? "No es un importe" : undefined}
          onChange={(e) => setPrecio(e.target.value)}
          className="[&_input]:tabular [&_input]:text-right"
        />
        <div className="sm:pt-6">
          <Boton type="submit" disabled={incompleto || crear.isPending} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" aria-hidden />
            Añadir
          </Boton>
        </div>
      </div>

      {/* Lo que falta, dicho antes y junto al botón, no sólo tras fallar. */}
      {motivo && <Aviso tono="advertencia" className="mt-3">{motivo}</Aviso>}
      {fallo && <Aviso className="mt-3">{fallo}</Aviso>}
    </form>
  )
}

/** Corregir un ítem ya cotizado, sin quitarlo y volverlo a añadir. */
function FormularioItem({
  item,
  pacienteId,
  planId,
  alCerrar,
}: {
  item: PlanItem
  pacienteId: number
  planId: number
  alCerrar: () => void
}) {
  const avisar = useAviso()
  const actualizar = useActualizarItem(pacienteId, planId)
  const [codigoFdi, setCodigoFdi] = useState(item.codigo_fdi ? String(item.codigo_fdi) : "")
  const [superficies, setSuperficies] = useState(item.superficies ?? "")
  const [cantidad, setCantidad] = useState(String(item.cantidad))
  const [precio, setPrecio] = useState(String(Number(item.precio_unit)))
  const [descuento, setDescuento] = useState(String(Number(item.descuento_pct)))
  const [fase, setFase] = useState(String(item.fase))
  const [fallo, setFallo] = useState<string | null>(null)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setFallo(null)
    if (!item.ejecutado && !IMPORTE.test(precio)) {
      setFallo("El precio no es un importe válido")
      return
    }
    try {
      await actualizar.mutateAsync({
        itemId: item.id,
        // Lo ya ejecutado está cobrado con esa pieza y ese precio: sólo cambia de fase.
        datos: item.ejecutado
          ? { fase: Number(fase) || 1 }
          : {
              codigo_fdi: codigoFdi ? Number(codigoFdi) : null,
              superficies: superficies.trim() || null,
              cantidad: Number(cantidad) || 1,
              precio_unit: precio.replace(",", "."),
              descuento_pct: descuento.replace(",", ".") || "0",
              fase: Number(fase) || 1,
            },
      })
      avisar("Ítem actualizado")
      alCerrar()
    } catch (e) {
      setFallo(e instanceof ApiError ? e.detail : "No se pudo guardar el ítem")
    }
  }

  return (
    <form onSubmit={enviar} noValidate>
      {item.ejecutado && (
        <p className="mb-4 text-sm text-tinta-suave">
          Este ítem ya se ejecutó en una consulta: lo único que se puede cambiar es su fase.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        {!item.ejecutado && (
          <>
            <Campo
              etiqueta="Pieza (FDI)"
              inputMode="numeric"
              value={codigoFdi}
              onChange={(e) => setCodigoFdi(e.target.value.replace(/\D/g, "").slice(0, 2))}
            />
            <Campo
              etiqueta="Caras"
              value={superficies}
              placeholder="MOD"
              onChange={(e) => setSuperficies(e.target.value.toUpperCase().replace(/[^MDVLOI]/g, ""))}
            />
            <Campo
              etiqueta="Cantidad"
              inputMode="numeric"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value.replace(/\D/g, "").slice(0, 2))}
            />
            <Campo
              etiqueta="Precio unitario"
              inputMode="decimal"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
            />
            <Campo
              etiqueta="Descuento %"
              inputMode="decimal"
              value={descuento}
              onChange={(e) => setDescuento(e.target.value.replace(/[^\d.,]/g, "").slice(0, 5))}
            />
          </>
        )}
        <Campo
          etiqueta="Fase"
          inputMode="numeric"
          value={fase}
          onChange={(e) => setFase(e.target.value.replace(/\D/g, "").slice(0, 1))}
        />
      </div>

      {fallo && <Aviso className="mt-4">{fallo}</Aviso>}

      <PieDialogo>
        <Boton type="button" variante="contorno" onClick={alCerrar}>
          Cancelar
        </Boton>
        <Boton type="submit" disabled={actualizar.isPending}>
          Guardar
        </Boton>
      </PieDialogo>
    </form>
  )
}

/**
 * El plan de tratamiento: lo cotizado, cuánto va hecho y su presupuesto.
 *
 * La misma página es el editor y el documento: al imprimir desaparecen los
 * controles y queda el presupuesto con el membrete de la clínica.
 */
export function PantallaPlan() {
  const { id, planId } = useParams<{ id: string; planId: string }>()
  const pacienteId = Number(id)
  const navegar = useNavigate()
  const avisar = useAviso()
  const { puede } = useAuth()

  const { data: plan, isPending, error } = usePlan(Number(planId))
  const { data: paciente } = usePaciente(pacienteId)
  const guardar = useGuardarPlan(pacienteId)
  const borrarItem = useBorrarItem(pacienteId, Number(planId))
  const borrarPlan = useBorrarPlan(pacienteId)
  const [editando, setEditando] = useState(false)
  const [itemEditado, setItemEditado] = useState<PlanItem | null>(null)
  const [fallo, setFallo] = useState<string | null>(null)

  const edita = puede("doctor", "asistente")

  if (isPending) {
    return (
      <div className="grid place-items-center py-24 text-marca">
        <Cargando size="lg" label="Cargando el plan" />
      </div>
    )
  }
  if (error) return <ErrorCarga error={error} />

  const abierto = plan.estado !== "finalizado" && plan.estado !== "rechazado"
  const volver = `/pacientes/${pacienteId}`
  const descuento = Number(plan.cotizado) - Number(plan.total)

  async function intentar(accion: () => Promise<unknown>, hecho?: string) {
    setFallo(null)
    try {
      await accion()
      if (hecho) avisar(hecho)
      return true
    } catch (e) {
      setFallo(e instanceof ApiError ? e.detail : "No se pudo guardar")
      return false
    }
  }

  const pasarA = (estado: ValorEstadoPlan) =>
    intentar(
      () => guardar.mutateAsync({ id: plan.id, datos: { estado } }),
      `Plan: ${ESTADO_PLAN[estado].toLowerCase()}`,
    )

  return (
    <div className="space-y-5">
      <Link
        to={volver}
        className="no-imprimir inline-flex items-center gap-1.5 text-sm text-tinta-suave hover:text-tinta"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {paciente ? `${paciente.nombres} ${paciente.apellidos}` : "Expediente"}
      </Link>

      <header className="no-imprimir flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {plan.titulo ?? plan.especialidad_nombre ?? "Plan de tratamiento"}
            </h1>
            <span className="tabular font-mono text-sm text-tinta-suave">{plan.codigo}</span>
            <Insignia>{ESTADO_PLAN[plan.estado]}</Insignia>
          </div>
          <p className="mt-1 text-sm text-tinta-suave">
            {doctor(plan.doctor_nombre)}
            {plan.titulo && plan.especialidad_nombre && ` · ${plan.especialidad_nombre}`}
            {` · abierto el ${fecha(plan.fecha)}`}
          </p>
          {plan.notas && <p className="mt-2 max-w-[70ch] text-sm">{plan.notas}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Boton variante="contorno" onClick={() => window.print()}>
            <Printer className="h-4 w-4" aria-hidden />
            Imprimir presupuesto
          </Boton>
          {edita && abierto && (
            <Boton variante="contorno" onClick={() => setEditando(true)}>
              <Pencil className="h-4 w-4" aria-hidden />
              Editar plan
            </Boton>
          )}
        </div>
      </header>

      {fallo && <Aviso className="no-imprimir">{fallo}</Aviso>}

      {/* Membrete del presupuesto: sólo en papel. */}
      <div className="solo-imprimir">
        <Membrete
          titulo="Presupuesto"
          className="mb-0"
          detalle={
            <>
              <p className="font-mono">{plan.codigo}</p>
              <p className="text-xs first-letter:uppercase">{fechaLarga(new Date())}</p>
            </>
          }
        />
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <div>
            <dt className="text-xs">Paciente</dt>
            <dd className="font-medium">
              {paciente ? `${paciente.nombres} ${paciente.apellidos}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-xs">Doctor</dt>
            <dd>{doctor(plan.doctor_nombre)}</dd>
          </div>
          <div>
            <dt className="text-xs">Cédula</dt>
            <dd className="font-mono">{paciente?.documento ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs">Teléfono</dt>
            <dd className="font-mono">{telefono(paciente?.celular)}</dd>
          </div>
        </dl>
      </div>

      <Tarjeta className="hoja overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-linea text-left text-tinta-suave">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">Fase</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Servicio</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Pieza</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Cant.</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Precio</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Total</th>
                <th scope="col" className="no-imprimir px-4 py-2.5 font-medium">Estado</th>
                <th scope="col" className="no-imprimir px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {plan.items.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-tinta-suave">
                    El plan todavía no tiene nada cotizado.
                  </td>
                </tr>
              )}
              {plan.items.map((item) => (
                <tr key={item.id} className="border-b border-linea last:border-0">
                  <td className="tabular px-4 py-2.5 text-tinta-suave">{item.fase}</td>
                  <td className="px-4 py-2.5">
                    <span className="font-medium">{item.servicio_nombre}</span>
                    <span className="no-imprimir tabular ml-2 font-mono text-xs text-tinta-suave">
                      {item.servicio_codigo}
                    </span>
                  </td>
                  <td className="tabular px-4 py-2.5 font-mono">{pieza(item) || "—"}</td>
                  <td className="tabular px-4 py-2.5 text-right">{item.cantidad}</td>
                  <td className="tabular whitespace-nowrap px-4 py-2.5 text-right">
                    {moneda(item.precio_unit)}
                  </td>
                  <td className="tabular whitespace-nowrap px-4 py-2.5 text-right">
                    {moneda(item.total)}
                  </td>
                  <td className="no-imprimir px-4 py-2.5">
                    <Insignia>{item.ejecutado ? "Hecho" : "Pendiente"}</Insignia>
                  </td>
                  <td className="no-imprimir whitespace-nowrap px-4 py-2.5 text-right">
                    {edita && abierto && (
                      <button
                        type="button"
                        onClick={() => setItemEditado(item)}
                        aria-label={`Editar ${item.servicio_nombre}`}
                        className="rounded-lg p-1.5 text-tinta-suave hover:bg-marca-tenue hover:text-marca"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </button>
                    )}
                    {edita && abierto && (
                      <button
                        type="button"
                        onClick={() => intentar(() => borrarItem.mutateAsync(item.id))}
                        disabled={item.ejecutado}
                        title={item.ejecutado ? "Ya se ejecutó en una consulta" : undefined}
                        aria-label={`Quitar ${item.servicio_nombre} del plan`}
                        className="rounded-lg p-1.5 text-tinta-suave hover:bg-marca-tenue hover:text-marca disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {edita && abierto && <NuevoItem pacienteId={pacienteId} plan={plan} />}

        <dl className="no-partir ml-auto w-full max-w-xs space-y-1 border-t border-linea px-4 py-3 text-sm">
          {descuento > 0 && (
            <>
              <div className="flex justify-between">
                <dt className="text-tinta-suave">Subtotal</dt>
                <dd className="tabular">{moneda(plan.cotizado)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-tinta-suave">Descuento {Number(plan.descuento_pct)} %</dt>
                <dd className="tabular">{moneda(-descuento)}</dd>
              </div>
            </>
          )}
          <div className="flex justify-between text-base font-semibold">
            <dt>Total</dt>
            <dd className="tabular">{moneda(plan.total)}</dd>
          </div>
          {/* Sólo con la tarifa de una ARS: lo que cubre es una estimación hasta que autorice. */}
          {plan.aseguradora_nombre && Number(plan.cobertura_estimada) > 0 && (
            <>
              <div className="flex justify-between">
                <dt className="text-tinta-suave">Cubre {plan.aseguradora_nombre} (estimado)</dt>
                <dd className="tabular">{moneda(-Number(plan.cobertura_estimada))}</dd>
              </div>
              <div className="flex justify-between font-semibold">
                <dt>A pagar por el paciente</dt>
                <dd className="tabular">
                  {moneda(Number(plan.total) - Number(plan.cobertura_estimada))}
                </dd>
              </div>
            </>
          )}
          <div className="no-imprimir flex justify-between text-tinta-suave">
            <dt>Ya ejecutado</dt>
            <dd className="tabular">{moneda(plan.ejecutado)}</dd>
          </div>
        </dl>
      </Tarjeta>

      <footer className="solo-imprimir no-partir text-xs">
        <p>
          Presupuesto sujeto a evaluación clínica. Válido por 30 días a partir de la fecha de
          emisión.
        </p>
        <div className="mt-14 flex justify-between gap-10">
          <p className="w-56 border-t border-black pt-1 text-center">Firma del paciente</p>
          <p className="w-56 border-t border-black pt-1 text-center">Firma y sello</p>
        </div>
      </footer>

      {edita && (
        <div className="no-imprimir flex flex-wrap items-center gap-2">
          {plan.siguientes.map((estado, i) => (
            <Boton
              key={estado}
              variante={i === 0 ? "solido" : "contorno"}
              disabled={guardar.isPending}
              onClick={() => pasarA(estado)}
            >
              {ACCION_PLAN[estado]}
            </Boton>
          ))}
          <Boton
            variante="plano"
            className="ml-auto"
            onClick={async () => {
              if (await intentar(() => borrarPlan.mutateAsync(plan.id), "Plan eliminado")) {
                navegar(volver)
              }
            }}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Eliminar plan
          </Boton>
        </div>
      )}

      <Dialogo
        abierto={itemEditado !== null}
        alCerrar={() => setItemEditado(null)}
        titulo="Editar ítem del plan"
        descripcion={itemEditado?.servicio_nombre}
      >
        {itemEditado && (
          <FormularioItem
            item={itemEditado}
            pacienteId={pacienteId}
            planId={plan.id}
            alCerrar={() => setItemEditado(null)}
          />
        )}
      </Dialogo>
      <DialogoPlan
        abierto={editando}
        alCerrar={() => setEditando(false)}
        pacienteId={pacienteId}
        plan={plan}
      />
    </div>
  )
}
