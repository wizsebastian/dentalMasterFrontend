import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import type { Plan } from "../../api/tipos"
import { Cargando } from "../../components/brand"
import {
  AreaTexto,
  Aviso,
  Boton,
  Campo,
  Dialogo,
  PieDialogo,
  Selector,
  useAviso,
} from "../../components/ui"
import { doctor as tratamiento } from "../../lib/formato"
import { aplicarErrorApi, numeroONulo, oNulo } from "../../lib/formularios"
import { useAuth } from "../auth/contexto"
import { useDoctores, useEspecialidades, useListasPrecio } from "../catalogo/consultas"
import { useGuardarPlan } from "./consultas"

const esquema = z.object({
  titulo: z.string(),
  doctor_id: z.string().min(1, "Elige el doctor"),
  especialidad_id: z.string(),
  lista_precio_id: z.string(),
  descuento_pct: z.coerce.number<string>().min(0, "Entre 0 y 100").max(100, "Entre 0 y 100"),
  notas: z.string(),
})

type Entrada = z.input<typeof esquema>
type Valores = z.output<typeof esquema>

const CAMPOS = ["titulo", "doctor_id", "especialidad_id", "descuento_pct", "notas"] as const

/** Abrir un plan de tratamiento, o cambiar sus datos generales. */
export function DialogoPlan({
  abierto,
  alCerrar,
  alGuardar,
  pacienteId,
  doctorPorDefecto,
  plan,
}: {
  abierto: boolean
  alCerrar: () => void
  alGuardar?: (plan: Plan) => void
  pacienteId: number
  doctorPorDefecto?: number | null
  plan?: Plan
}) {
  return (
    <Dialogo
      abierto={abierto}
      alCerrar={alCerrar}
      titulo={plan ? `Editar ${plan.codigo}` : "Nuevo plan de tratamiento"}
      descripcion={
        plan
          ? undefined
          : "Agrupa las consultas de un tratamiento, se cotiza y se le puede hacer un presupuesto."
      }
      ancho="md"
    >
      <Formulario
        pacienteId={pacienteId}
        plan={plan}
        doctorPorDefecto={doctorPorDefecto}
        alCerrar={alCerrar}
        alGuardar={alGuardar}
      />
    </Dialogo>
  )
}

function Formulario({
  pacienteId,
  plan,
  doctorPorDefecto,
  alCerrar,
  alGuardar,
}: {
  pacienteId: number
  plan?: Plan
  doctorPorDefecto?: number | null
  alCerrar: () => void
  alGuardar?: (plan: Plan) => void
}) {
  const avisar = useAviso()
  const { usuario } = useAuth()
  const { data: doctores } = useDoctores()
  const { data: especialidades } = useEspecialidades()
  const { data: listas } = useListasPrecio()
  const guardar = useGuardarPlan(pacienteId)
  const [general, setGeneral] = useState<string | null>(null)

  const doctorInicial = plan?.doctor_id ?? usuario?.doctor_id ?? doctorPorDefecto

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Entrada, unknown, Valores>({
    resolver: zodResolver(esquema),
    defaultValues: {
      titulo: plan?.titulo ?? "",
      doctor_id: doctorInicial ? String(doctorInicial) : "",
      especialidad_id: plan?.especialidad_id ? String(plan.especialidad_id) : "",
      lista_precio_id: plan ? String(plan.lista_precio_id) : "",
      descuento_pct: String(Number(plan?.descuento_pct ?? 0)),
      notas: plan?.notas ?? "",
    },
  })

  async function enviar(v: Valores) {
    setGeneral(null)
    const comunes = {
      titulo: oNulo(v.titulo),
      doctor_id: Number(v.doctor_id),
      especialidad_id: numeroONulo(v.especialidad_id),
      descuento_pct: String(v.descuento_pct),
      notas: oNulo(v.notas),
    }
    try {
      const guardado = await guardar.mutateAsync(
        plan
          ? { id: plan.id, datos: comunes }
          : { datos: { ...comunes, lista_precio_id: numeroONulo(v.lista_precio_id) } },
      )
      avisar(plan ? "Plan actualizado" : `Plan ${guardado.codigo} abierto`)
      alGuardar?.(guardado)
      alCerrar()
    } catch (fallo) {
      setGeneral(aplicarErrorApi(fallo, setError, CAMPOS))
    }
  }

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-4">
      <Campo
        etiqueta="Título"
        opcional
        autoFocus
        placeholder="Rehabilitación del sector posterior"
        error={errors.titulo?.message}
        {...register("titulo")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Selector etiqueta="Doctor" error={errors.doctor_id?.message} {...register("doctor_id")}>
          <option value="">Elige el doctor</option>
          {doctores?.map((d) => (
            <option key={d.id} value={d.id}>
              {tratamiento(d.nombre_completo)}
            </option>
          ))}
        </Selector>
        <Selector
          etiqueta="Especialidad"
          opcional
          ayuda="Vacía si el plan cruza varias."
          {...register("especialidad_id")}
        >
          <option value="">Sin especialidad</option>
          {especialidades?.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </Selector>
        {/* La tarifa fija los precios de los ítems: no se cambia con el plan en marcha. */}
        <Selector
          etiqueta="Tarifa"
          disabled={Boolean(plan)}
          ayuda={plan ? "No se cambia una vez abierto el plan." : undefined}
          {...register("lista_precio_id")}
        >
          {!plan && <option value="">Particular</option>}
          {listas?.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nombre}
            </option>
          ))}
        </Selector>
        <Campo
          etiqueta="Descuento del plan (%)"
          type="number"
          inputMode="decimal"
          min={0}
          max={100}
          step="0.5"
          error={errors.descuento_pct?.message}
          {...register("descuento_pct")}
        />
      </div>
      <AreaTexto
        etiqueta="Notas"
        opcional
        rows={2}
        placeholder="Plan de tratamiento, observaciones…"
        {...register("notas")}
      />

      {general && <Aviso>{general}</Aviso>}

      <PieDialogo>
        <Boton type="button" variante="contorno" onClick={alCerrar}>
          Cancelar
        </Boton>
        <Boton type="submit" disabled={isSubmitting}>
          {isSubmitting && <Cargando size="sm" label="Guardando" />}
          {plan ? "Guardar cambios" : "Abrir plan"}
        </Boton>
      </PieDialogo>
    </form>
  )
}
