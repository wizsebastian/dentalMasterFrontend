import { useMemo, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"

import { ApiError } from "../../api/client"
import type { Consulta, PlanConConsultas, Servicio } from "../../api/tipos"
import { Cargando } from "../../components/brand"
import { Odontograma } from "../../components/odontograma/Odontograma"
import {
  AreaTexto,
  Aviso,
  Boton,
  Campo,
  Dialogo,
  PieDialogo,
  Selector,
  SelectorFiltro,
  useAviso,
} from "../../components/ui"
import { doctor as tratamiento, moneda } from "../../lib/formato"
import { numeroONulo, oNulo } from "../../lib/formularios"
import { aFechaISO, aHoraISO, unirFechaHora } from "../agenda/tiempo"
import { useAuth } from "../auth/contexto"
import { useDoctores, useListasPrecio, useServicios, useUnidades } from "../catalogo/consultas"
import { useCatalogos, useOdontograma } from "../pacientes/consultas"
import { useGuardarConsulta } from "./consultas"
import { ESTADO_PLAN, IMPORTE, aNumero, pieza } from "./textos"

type FilaLinea = {
  /** Id de la línea ya guardada, al editar. */
  lineaId: number | null
  servicio_id: string
  codigo_fdi: string
  superficies: string
  cantidad: string
  precio: string
  descuento_pct: string
  plan_item_id: number | null
}

type Valores = {
  doctor_id: string
  fecha: string
  hora: string
  unidad_id: string
  plan_id: string
  motivo: string
  diagnostico: string
  plan: string
  notas: string
  lineas: FilaLinea[]
}

const LINEA_VACIA: FilaLinea = {
  lineaId: null,
  servicio_id: "",
  codigo_fdi: "",
  superficies: "",
  cantidad: "1",
  precio: "",
  descuento_pct: "",
  plan_item_id: null,
}

export type ConsultaInicial = {
  consulta?: Consulta
  /** Plan del que colgará una consulta nueva. */
  planId?: number | null
  citaId?: number | null
  doctorId?: number | null
  unidadId?: number | null
}

const ENTRADA =
  "min-w-0 rounded-lg border border-linea-fuerte bg-superficie px-2 py-1.5 text-sm placeholder:text-tinta-suave/60 aria-invalid:border-tinta"

/**
 * Registrar o editar una consulta: quién atendió, qué se hizo, en qué piezas y
 * cuánto cuesta.
 *
 * Lo que aquí se registre sobre una pieza queda dibujado en el odontograma al
 * guardar: no hay que pintarlo aparte.
 */
export function DialogoConsulta({
  inicial,
  alCerrar,
  pacienteId,
  planes,
  doctorTratanteId,
}: {
  /** `null` = cerrado. */
  inicial: ConsultaInicial | null
  alCerrar: () => void
  pacienteId: number
  planes: PlanConConsultas[]
  doctorTratanteId?: number | null
}) {
  return (
    <Dialogo
      abierto={inicial !== null}
      alCerrar={alCerrar}
      titulo={inicial?.consulta ? "Editar consulta" : "Nueva consulta"}
      ancho="lg"
    >
      {inicial && (
        <Formulario
          inicial={inicial}
          alCerrar={alCerrar}
          pacienteId={pacienteId}
          planes={planes}
          doctorTratanteId={doctorTratanteId}
        />
      )}
    </Dialogo>
  )
}

function Formulario({
  inicial,
  alCerrar,
  pacienteId,
  planes,
  doctorTratanteId,
}: {
  inicial: ConsultaInicial
  alCerrar: () => void
  pacienteId: number
  planes: PlanConConsultas[]
  doctorTratanteId?: number | null
}) {
  const { consulta } = inicial
  const avisar = useAviso()
  const { usuario } = useAuth()
  const { data: doctores } = useDoctores()
  const { data: unidades } = useUnidades()
  const { data: servicios } = useServicios()
  const { data: listas } = useListasPrecio()
  const { data: catalogos } = useCatalogos()
  const { data: odontograma } = useOdontograma(pacienteId)
  const guardar = useGuardarConsulta(pacienteId)

  const [general, setGeneral] = useState<string | null>(null)
  /** La fila que recibe la pieza al pulsar en el odontograma. */
  const [activa, setActiva] = useState(0)
  const [conDibujo, setConDibujo] = useState(false)

  const cuando = consulta ? new Date(consulta.fecha) : new Date()
  const planInicial = consulta?.plan_id ?? inicial.planId ?? null
  const doctorInicial =
    consulta?.doctor_id ??
    inicial.doctorId ??
    usuario?.doctor_id ??
    planes.find((p) => p.id === planInicial)?.doctor_id ??
    doctorTratanteId

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Valores>({
    defaultValues: {
      doctor_id: doctorInicial ? String(doctorInicial) : "",
      fecha: aFechaISO(cuando),
      hora: aHoraISO(cuando),
      unidad_id: String(consulta?.unidad_id ?? inicial.unidadId ?? ""),
      plan_id: planInicial ? String(planInicial) : "",
      motivo: consulta?.motivo ?? "",
      diagnostico: consulta?.diagnostico ?? "",
      plan: consulta?.plan ?? "",
      notas: consulta?.notas ?? "",
      lineas: consulta?.lineas.length
        ? consulta.lineas.map((l) => ({
            lineaId: l.id,
            servicio_id: String(l.servicio_id),
            codigo_fdi: l.codigo_fdi?.toString() ?? "",
            superficies: l.superficies ?? "",
            cantidad: String(l.cantidad),
            precio: l.precio,
            descuento_pct: Number(l.descuento_pct) ? String(Number(l.descuento_pct)) : "",
            plan_item_id: l.plan_item_id ?? null,
          }))
        : [LINEA_VACIA],
    },
  })
  const filas = useFieldArray({ control, name: "lineas" })
  const lineas = useWatch({ control, name: "lineas" })
  const planId = useWatch({ control, name: "plan_id" })

  const plan = planes.find((p) => String(p.id) === planId)
  const particular = listas?.find((l) => l.aseguradora_id === null)?.id
  const tarifa = plan?.lista_precio_id ?? particular

  const porId = useMemo(
    () => new Map((servicios ?? []).map((s) => [String(s.id), s])),
    [servicios],
  )
  const grupos = useMemo(() => {
    const mapa = new Map<string, Servicio[]>()
    for (const s of servicios ?? []) {
      mapa.set(s.categoria_nombre, [...(mapa.get(s.categoria_nombre) ?? []), s])
    }
    return [...mapa]
  }, [servicios])

  function precioDeTarifa(servicio: Servicio | undefined): string {
    if (!servicio) return ""
    const precio =
      servicio.precios.find((p) => p.lista_precio_id === tarifa) ??
      servicio.precios.find((p) => p.lista_precio_id === particular)
    return precio?.precio ?? ""
  }

  // Lo que el plan tiene cotizado y aún no se ha hecho ni está ya en este formulario.
  const pendientes = (plan?.items ?? []).filter(
    (item) => !item.ejecutado && !lineas.some((l) => l.plan_item_id === item.id),
  )

  function anadirDelPlan(item: (typeof pendientes)[number]) {
    if (!plan) return
    // El descuento del ítem y el del plan se combinan, como hace el servidor.
    const factor = (1 - Number(item.descuento_pct) / 100) * (1 - Number(plan.descuento_pct) / 100)
    const descuento = Math.round((1 - factor) * 10000) / 100
    const nueva: FilaLinea = {
      lineaId: null,
      servicio_id: String(item.servicio_id),
      codigo_fdi: item.codigo_fdi?.toString() ?? "",
      superficies: item.superficies ?? "",
      cantidad: String(item.cantidad),
      precio: item.precio_unit,
      descuento_pct: descuento ? String(descuento) : "",
      plan_item_id: item.id,
    }
    // Si sólo está la fila vacía inicial, se ocupa en vez de dejarla colgando.
    const unica = lineas.length === 1 && !lineas[0].servicio_id
    if (unica) filas.update(0, nueva)
    else filas.append(nueva)
  }

  function alElegirCara(codigoFdi: number, cara: string | null) {
    const i = Math.min(activa, lineas.length - 1)
    const fila = getValues(`lineas.${i}`)
    if (fila.codigo_fdi !== String(codigoFdi)) {
      setValue(`lineas.${i}.codigo_fdi`, String(codigoFdi))
      setValue(`lineas.${i}.superficies`, cara ?? "")
      return
    }
    // Misma pieza: la cara se añade o se quita.
    const actuales = fila.superficies.toUpperCase()
    if (cara === null) setValue(`lineas.${i}.superficies`, "")
    else {
      setValue(
        `lineas.${i}.superficies`,
        actuales.includes(cara) ? actuales.replace(cara, "") : actuales + cara,
      )
    }
  }

  const total = lineas.reduce((suma, l) => {
    const precio = IMPORTE.test(l.precio) ? aNumero(l.precio) : 0
    return suma + (Number(l.cantidad) || 0) * precio * (1 - (Number(l.descuento_pct) || 0) / 100)
  }, 0)

  async function enviar(v: Valores) {
    setGeneral(null)
    if (!v.doctor_id) {
      setError("doctor_id", { message: "Elige el doctor" })
      return
    }

    const completas = v.lineas.filter((l) => l.servicio_id)
    for (const [i, l] of v.lineas.entries()) {
      if (l.servicio_id && l.precio && !IMPORTE.test(l.precio)) {
        setError(`lineas.${i}.precio`, { message: "Importe no válido" })
        return
      }
    }

    const datos = {
      doctor_id: Number(v.doctor_id),
      fecha: unirFechaHora(v.fecha, v.hora || "00:00").toISOString(),
      unidad_id: numeroONulo(v.unidad_id),
      plan_id: numeroONulo(v.plan_id),
      motivo: oNulo(v.motivo),
      diagnostico: oNulo(v.diagnostico),
      plan: oNulo(v.plan),
      notas: oNulo(v.notas),
      lineas: completas.map((l) => ({
        ...(l.lineaId ? { id: l.lineaId } : {}),
        servicio_id: Number(l.servicio_id),
        codigo_fdi: numeroONulo(l.codigo_fdi),
        superficies: oNulo(l.superficies),
        cantidad: Number(l.cantidad) || 1,
        precio: l.precio ? l.precio.replace(",", ".") : null,
        descuento_pct: String(Number(l.descuento_pct) || 0),
        plan_item_id: l.plan_item_id,
      })),
    }

    try {
      await guardar.mutateAsync(
        consulta
          ? { id: consulta.id, datos }
          : { datos: { ...datos, cita_id: inicial.citaId ?? null } },
      )
      avisar(consulta ? "Consulta actualizada" : "Consulta registrada")
      alCerrar()
    } catch (fallo) {
      setGeneral(fallo instanceof ApiError ? fallo.detail : "No se pudo conectar con el servidor")
    }
  }

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Selector
          etiqueta="Doctor"
          className="sm:col-span-2"
          error={errors.doctor_id?.message}
          {...register("doctor_id")}
        >
          <option value="">Elige el doctor</option>
          {doctores?.map((d) => (
            <option key={d.id} value={d.id}>
              {tratamiento(d.nombre_completo)}
            </option>
          ))}
        </Selector>
        <Campo etiqueta="Fecha" type="date" max={aFechaISO(new Date())} {...register("fecha")} />
        <Campo etiqueta="Hora" type="time" {...register("hora")} />
        <Selector etiqueta="Plan de tratamiento" className="sm:col-span-2" {...register("plan_id")}>
          <option value="">Consulta suelta, sin plan</option>
          {planes
            // Un plan cerrado no admite consultas nuevas; el propio de la consulta sí se ve.
            .filter(
              (p) => (p.estado !== "finalizado" && p.estado !== "rechazado") || p.id === planInicial,
            )
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.codigo} · {p.titulo ?? p.especialidad_nombre ?? ESTADO_PLAN[p.estado]}
              </option>
            ))}
        </Selector>
        <Selector etiqueta="Unidad dental" opcional className="sm:col-span-2" {...register("unidad_id")}>
          <option value="">Sin especificar</option>
          {unidades?.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombre}
            </option>
          ))}
        </Selector>
      </div>

      <fieldset className="mt-5 border-t border-linea pt-4">
        <legend className="float-left mb-3 flex w-full items-baseline justify-between text-sm font-semibold">
          Lo que se hizo
          <span className="tabular text-base">{moneda(total)}</span>
        </legend>

        <div className="clear-both space-y-2">
          <div className="hidden gap-2 text-xs text-tinta-suave sm:grid sm:grid-cols-[minmax(0,3fr)_4rem_4.5rem_3.5rem_6rem_4rem_2rem]">
            <span>Servicio</span>
            <span>Pieza</span>
            <span>Caras</span>
            <span>Cant.</span>
            <span>Precio</span>
            <span>Desc. %</span>
            <span />
          </div>

          {filas.fields.map((campo, i) => {
            const servicio = porId.get(lineas[i]?.servicio_id ?? "")
            return (
              <div
                key={campo.id}
                onFocus={() => setActiva(i)}
                className={`grid items-center gap-2 rounded-lg sm:grid-cols-[minmax(0,3fr)_4rem_4.5rem_3.5rem_6rem_4rem_2rem] ${
                  conDibujo && activa === i ? "outline outline-2 outline-offset-2 outline-marca-tenue" : ""
                }`}
              >
                <SelectorFiltro
                  aria-label={`Servicio de la línea ${i + 1}`}
                  className="min-w-0"
                  {...register(`lineas.${i}.servicio_id`, {
                    onChange: (e) => {
                      // Elegir servicio trae su precio de la tarifa del plan.
                      const elegido = porId.get(e.target.value)
                      setValue(`lineas.${i}.precio`, precioDeTarifa(elegido))
                      setValue(`lineas.${i}.plan_item_id`, null)
                    },
                  })}
                >
                  <option value="">Elige el servicio</option>
                  {grupos.map(([categoria, lista]) => (
                    <optgroup key={categoria} label={categoria}>
                      {lista.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nombre}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </SelectorFiltro>
                <input
                  aria-label={`Pieza de la línea ${i + 1}`}
                  inputMode="numeric"
                  placeholder={servicio?.requiere_diente ? "FDI" : "—"}
                  className={`${ENTRADA} tabular font-mono`}
                  {...register(`lineas.${i}.codigo_fdi`)}
                />
                <input
                  aria-label={`Caras de la línea ${i + 1}`}
                  placeholder={servicio?.requiere_superficie ? "MOD" : "—"}
                  className={`${ENTRADA} font-mono uppercase`}
                  {...register(`lineas.${i}.superficies`)}
                />
                <input
                  aria-label={`Cantidad de la línea ${i + 1}`}
                  type="number"
                  min={1}
                  className={`${ENTRADA} tabular`}
                  {...register(`lineas.${i}.cantidad`)}
                />
                <input
                  aria-label={`Precio de la línea ${i + 1}`}
                  inputMode="decimal"
                  placeholder="0.00"
                  aria-invalid={errors.lineas?.[i]?.precio ? true : undefined}
                  className={`${ENTRADA} tabular text-right`}
                  {...register(`lineas.${i}.precio`)}
                />
                <input
                  aria-label={`Descuento de la línea ${i + 1}`}
                  inputMode="decimal"
                  placeholder="0"
                  className={`${ENTRADA} tabular text-right`}
                  {...register(`lineas.${i}.descuento_pct`)}
                />
                <button
                  type="button"
                  onClick={() => (filas.fields.length > 1 ? filas.remove(i) : filas.update(0, LINEA_VACIA))}
                  aria-label={`Quitar la línea ${i + 1}`}
                  className="justify-self-start rounded-lg p-1.5 text-tinta-suave hover:bg-marca-tenue hover:text-marca"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            )
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Boton
            type="button"
            variante="plano"
            className="-ml-2"
            onClick={() => {
              filas.append(LINEA_VACIA)
              setActiva(filas.fields.length)
            }}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Añadir servicio
          </Boton>
          {odontograma && catalogos && (
            <Boton type="button" variante="plano" onClick={() => setConDibujo(!conDibujo)}>
              {conDibujo ? "Ocultar el odontograma" : "Elegir pieza en el odontograma"}
            </Boton>
          )}
        </div>

        {pendientes.length > 0 && (
          <div className="mt-3 rounded-lg border border-linea p-3">
            <p className="text-xs font-medium text-tinta-suave">Pendiente en el plan {plan?.codigo}</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {pendientes.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => anadirDelPlan(item)}
                    className="rounded-lg border border-linea-fuerte px-2.5 py-1 text-left text-sm transition-colors hover:border-marca hover:bg-marca-tenue"
                  >
                    + {item.servicio_nombre}
                    {pieza(item) && <span className="ml-1.5 font-mono text-xs">{pieza(item)}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {conDibujo && odontograma && catalogos && (
          <div className="mt-3 rounded-lg border border-linea p-3">
            <p className="mb-2 text-xs text-tinta-suave">
              Pulsa una cara para llevar la pieza a la línea {Math.min(activa, lineas.length - 1) + 1}.
              Pulsa otra cara de la misma pieza para sumarla, o el número para toda la pieza.
            </p>
            <div className="overflow-x-auto">
              <Odontograma
                datos={odontograma}
                catalogos={catalogos}
                piezaSeleccionada={Number(lineas[Math.min(activa, lineas.length - 1)]?.codigo_fdi) || undefined}
                onElegirCara={alElegirCara}
              />
            </div>
          </div>
        )}
      </fieldset>

      <div className="mt-5 grid gap-4 border-t border-linea pt-4 sm:grid-cols-2">
        <Campo
          etiqueta="Motivo"
          opcional
          className="sm:col-span-2"
          placeholder="A qué vino el paciente"
          {...register("motivo")}
        />
        <AreaTexto etiqueta="Diagnóstico" opcional rows={2} {...register("diagnostico")} />
        <AreaTexto
          etiqueta="Tratamiento e indicaciones"
          opcional
          rows={2}
          {...register("plan")}
        />
        <AreaTexto etiqueta="Notas" opcional rows={2} className="sm:col-span-2" {...register("notas")} />
      </div>

      {general && <Aviso className="mt-5">{general}</Aviso>}

      <PieDialogo>
        <Boton type="button" variante="contorno" onClick={alCerrar}>
          Cancelar
        </Boton>
        <Boton type="submit" disabled={isSubmitting}>
          {isSubmitting && <Cargando size="sm" label="Guardando" />}
          {consulta ? "Guardar cambios" : "Registrar consulta"}
        </Boton>
      </PieDialogo>
    </form>
  )
}
