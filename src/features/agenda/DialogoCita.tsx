import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { ApiError } from "../../api/client"
import type { Cita } from "../../api/tipos"
import { Cargando } from "../../components/brand"
import {
  AreaTexto,
  Aviso,
  Boton,
  Campo,
  CampoFecha,
  Casilla,
  Dialogo,
  PieDialogo,
  Selector,
  useAviso,
} from "../../components/ui"
import { doctor as tratamiento } from "../../lib/formato"
import { aplicarErrorApi, numeroONulo, oNulo } from "../../lib/formularios"
import { useAuth } from "../auth/contexto"
import { useDoctores, useServicios, useUnidades } from "../catalogo/consultas"
import { SelectorPaciente } from "../pacientes/SelectorPaciente"
import { useActualizarCita, useCrearCita } from "./consultas"
import { aFechaISO, aHoraISO, minutosEntre, unirFechaHora } from "./tiempo"

/** Con qué llega prellenado el diálogo: desde un hueco, un expediente o una cita. */
export type CitaInicial = {
  cita?: Cita
  paciente?: { id: number; nombre: string; doctorTratanteId?: number | null }
  inicio?: Date
  doctorId?: number | null
  unidadId?: number | null
}

const DURACIONES = [15, 20, 30, 40, 45, 60, 75, 90, 120, 180]

const esquema = z.object({
  fecha: z.string().min(1, "Elige el día"),
  hora: z.string().min(1, "Elige la hora"),
  duracion_min: z.string(),
  doctor_id: z.string().min(1, "Elige el doctor"),
  unidad_id: z.string(),
  servicio_id: z.string(),
  motivo: z.string(),
  notas: z.string(),
  sobrecupo: z.boolean(),
  sobrecupo_motivo: z.string(),
  motivo_cambio: z.string(),
})

type Valores = z.infer<typeof esquema>

const CAMPOS = ["doctor_id", "unidad_id", "servicio_id", "motivo", "notas"] as const

export function DialogoCita({
  inicial,
  alCerrar,
}: {
  /** `null` = cerrado. */
  inicial: CitaInicial | null
  alCerrar: () => void
}) {
  return (
    <Dialogo
      abierto={inicial !== null}
      alCerrar={alCerrar}
      titulo={inicial?.cita ? "Editar cita" : "Nueva cita"}
      descripcion={inicial?.cita?.paciente_nombre}
      ancho="lg"
    >
      {inicial && <Formulario inicial={inicial} alCerrar={alCerrar} />}
    </Dialogo>
  )
}

function Formulario({ inicial, alCerrar }: { inicial: CitaInicial; alCerrar: () => void }) {
  const { cita } = inicial
  const avisar = useAviso()
  const { usuario } = useAuth()
  const { data: doctores } = useDoctores()
  const { data: unidades } = useUnidades()
  const { data: servicios } = useServicios()
  const crear = useCrearCita()
  const actualizar = useActualizarCita()

  const [paciente, setPaciente] = useState(
    cita ? { id: cita.paciente_id, nombre: cita.paciente_nombre } : (inicial.paciente ?? null),
  )
  const [faltaPaciente, setFaltaPaciente] = useState(false)
  const [general, setGeneral] = useState<string | null>(null)
  /** El último intento chocó con otra cita: se ofrece el sobrecupo. */
  const [choque, setChoque] = useState(false)

  const cuando = cita ? new Date(cita.inicio) : (inicial.inicio ?? null)
  // Quien agenda suele ser el doctor del paciente o el que tiene la sesión.
  const doctorPorDefecto =
    cita?.doctor_id ?? inicial.doctorId ?? inicial.paciente?.doctorTratanteId ?? usuario?.doctor_id

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    getValues,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<Valores>({
    resolver: zodResolver(esquema),
    defaultValues: {
      fecha: cuando ? aFechaISO(cuando) : aFechaISO(new Date()),
      hora: cuando ? aHoraISO(cuando) : "",
      duracion_min: cita ? String(minutosEntre(cita.inicio, cita.fin)) : "",
      doctor_id: doctorPorDefecto ? String(doctorPorDefecto) : "",
      unidad_id: String(cita?.unidad_id ?? inicial.unidadId ?? ""),
      servicio_id: String(cita?.servicio_id ?? ""),
      motivo: cita?.motivo ?? "",
      notas: cita?.notas ?? "",
      sobrecupo: cita?.sobrecupo ?? false,
      sobrecupo_motivo: cita?.sobrecupo_motivo ?? "",
      motivo_cambio: "",
    },
  })

  const servicioId = useWatch({ control, name: "servicio_id" })
  const sobrecupo = useWatch({ control, name: "sobrecupo" })
  const servicio = servicios?.find((s) => String(s.id) === servicioId)
  const seMueve = Boolean(cita && (dirtyFields.fecha || dirtyFields.hora || dirtyFields.duracion_min))

  // El servicio trae su duración; quien la haya cambiado a mano conserva la suya.
  const campoServicio = register("servicio_id", {
    onChange: (e) => {
      const elegido = servicios?.find((s) => String(s.id) === e.target.value)
      if (elegido && !dirtyFields.duracion_min) {
        setValue("duracion_min", String(elegido.duracion_min))
      }
    },
  })

  // Agrupados por categoría, en el orden del catálogo.
  const grupos = new Map<string, NonNullable<typeof servicios>>()
  for (const s of servicios ?? []) {
    grupos.set(s.categoria_nombre, [...(grupos.get(s.categoria_nombre) ?? []), s])
  }

  async function enviar(v: Valores) {
    setGeneral(null)
    if (!paciente) {
      setFaltaPaciente(true)
      return
    }

    const comunes = {
      doctor_id: Number(v.doctor_id),
      unidad_id: numeroONulo(v.unidad_id),
      servicio_id: numeroONulo(v.servicio_id),
      motivo: oNulo(v.motivo),
      notas: oNulo(v.notas),
      sobrecupo: v.sobrecupo,
      sobrecupo_motivo: v.sobrecupo ? oNulo(v.sobrecupo_motivo) : null,
    }
    const inicio = unirFechaHora(v.fecha, v.hora).toISOString()
    const duracion_min = numeroONulo(v.duracion_min)

    try {
      if (cita) {
        await actualizar.mutateAsync({
          id: cita.id,
          datos: {
            ...comunes,
            // El horario sólo viaja si cambió: tocarlo es reprogramar.
            ...(seMueve ? { inicio, duracion_min, motivo_cambio: oNulo(v.motivo_cambio) } : {}),
          },
        })
      } else {
        await crear.mutateAsync({
          ...comunes,
          paciente_id: paciente.id,
          inicio,
          duracion_min,
          estado: "agendada",
        })
      }
      avisar(cita ? (seMueve ? "Cita reprogramada" : "Cita actualizada") : "Cita agendada")
      alCerrar()
    } catch (fallo) {
      // 409 = el doctor o el sillón ya están ocupados. No es un error del
      // formulario: se explica y se ofrece la salida.
      if (fallo instanceof ApiError && fallo.status === 409) {
        setChoque(true)
        setGeneral(fallo.detail)
      } else if (fallo instanceof ApiError && fallo.detail.startsWith("sobrecupo_motivo:")) {
        setError("sobrecupo_motivo", { message: "Explica por qué se solapa" })
      } else {
        setGeneral(aplicarErrorApi(fallo, setError, CAMPOS))
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate>
      {!cita && (
        <div className="mb-4">
          <SelectorPaciente
            elegido={paciente}
            fijo={Boolean(inicial.paciente)}
            error={faltaPaciente && !paciente ? "Elige el paciente" : undefined}
            alElegir={(p) => {
              setPaciente(p ? { id: p.id, nombre: `${p.nombres} ${p.apellidos}` } : null)
              // El doctor tratante entra solo, salvo que ya se haya elegido otro.
              if (p?.doctor_tratante_id && !getValues("doctor_id")) {
                setValue("doctor_id", String(p.doctor_tratante_id))
              }
            }}
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <CampoFecha etiqueta="Día" error={errors.fecha?.message} {...register("fecha")} />
        <Campo
          etiqueta="Hora"
          type="time"
          step={300}
          error={errors.hora?.message}
          {...register("hora")}
        />
        <Selector etiqueta="Duración" {...register("duracion_min")}>
          <option value="">
            {servicio ? `Según el servicio (${servicio.duracion_min} min)` : "30 min"}
          </option>
          {DURACIONES.map((m) => (
            <option key={m} value={m}>
              {m < 60 ? `${m} min` : `${m / 60} h`.replace(".", ",")}
            </option>
          ))}
        </Selector>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Selector etiqueta="Doctor" error={errors.doctor_id?.message} {...register("doctor_id")}>
          <option value="">Elige el doctor</option>
          {doctores?.map((d) => (
            <option key={d.id} value={d.id}>
              {tratamiento(d.nombre_completo)}
            </option>
          ))}
        </Selector>
        <Selector etiqueta="Unidad dental" opcional {...register("unidad_id")}>
          <option value="">Sin asignar</option>
          {unidades?.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombre}
            </option>
          ))}
        </Selector>
        <Selector
          etiqueta="Servicio"
          opcional
          ayuda="A qué viene. Fija la duración de la cita."
          {...campoServicio}
        >
          <option value="">Sin especificar</option>
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
        <Campo
          etiqueta="Motivo"
          opcional
          placeholder="Lo que dijo el paciente al pedir la cita"
          {...register("motivo")}
        />
      </div>

      <AreaTexto
        etiqueta="Notas internas"
        opcional
        rows={2}
        className="mt-4"
        ayuda="No se imprimen ni se envían al paciente."
        {...register("notas")}
      />

      {seMueve && (
        <Campo
          etiqueta="Por qué se reprograma"
          opcional
          className="mt-4"
          placeholder="Lo pidió el paciente, cambió el doctor…"
          ayuda="Queda en el historial de la cita."
          {...register("motivo_cambio")}
        />
      )}

      {/* Un choque de agenda no es un error de captura: es una advertencia con salida. */}
      {general && (
        <Aviso tono={choque ? "advertencia" : "error"} className="mt-5">
          {general}
        </Aviso>
      )}

      {(choque || sobrecupo) && (
        <div className="mt-3 rounded-lg border border-linea-fuerte p-3">
          <Casilla
            etiqueta="Agendar como sobrecupo"
            ayuda="Se solapa a propósito con otra cita. Queda marcada en la agenda."
            {...register("sobrecupo")}
          />
          {sobrecupo && (
            <Campo
              etiqueta="Motivo del sobrecupo"
              className="mt-3"
              placeholder="Urgencia, control de cinco minutos…"
              error={errors.sobrecupo_motivo?.message}
              {...register("sobrecupo_motivo")}
            />
          )}
        </div>
      )}

      <PieDialogo>
        <Boton type="button" variante="contorno" onClick={alCerrar}>
          Cancelar
        </Boton>
        <Boton type="submit" disabled={isSubmitting}>
          {isSubmitting && <Cargando size="sm" label="Guardando" />}
          {cita ? (seMueve ? "Reprogramar" : "Guardar cambios") : "Agendar cita"}
        </Boton>
      </PieDialogo>
    </form>
  )
}
