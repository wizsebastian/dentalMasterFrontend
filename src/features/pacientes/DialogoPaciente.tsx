import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import type { PacienteDetalle } from "../../api/tipos"
import { Cargando } from "../../components/brand"
import {
  AreaTexto,
  Aviso,
  Boton,
  Campo,
  CampoTelefono,
  CampoFecha,
  Dialogo,
  PieDialogo,
  Selector,
  useAviso,
} from "../../components/ui"
import { useDoctores } from "../catalogo/consultas"
import { aplicarErrorApi, numeroONulo, oNulo } from "../../lib/formularios"
import { doctor as tratamiento, mascaraTelefono } from "../../lib/formato"
import { useActualizarPaciente, useCrearPaciente } from "./consultas"

const HOY = new Date().toISOString().slice(0, 10)

const esquema = z.object({
  nombres: z.string().trim().min(1, "Escribe el nombre"),
  apellidos: z.string().trim().min(1, "Escribe los apellidos"),
  celular: z.string(),
  telefono: z.string(),
  documento: z.string(),
  fecha_nacimiento: z.string().refine((v) => !v || v <= HOY, "No puede estar en el futuro"),
  sexo: z.enum(["", "F", "M", "O"]),
  email: z.union([z.literal(""), z.email("El correo no es válido")]),
  doctor_tratante_id: z.string(),
  direccion: z.string(),
  ciudad: z.string(),
  ocupacion: z.string(),
  referido_por: z.string(),
  notas: z.string(),
})

type Valores = z.infer<typeof esquema>

const CAMPOS = Object.keys(esquema.shape) as (keyof Valores)[]

function iniciales(paciente?: PacienteDetalle): Valores {
  return {
    nombres: paciente?.nombres ?? "",
    apellidos: paciente?.apellidos ?? "",
    celular: mascaraTelefono(paciente?.celular ?? ""),
    telefono: mascaraTelefono(paciente?.telefono ?? ""),
    documento: paciente?.documento ?? "",
    fecha_nacimiento: paciente?.fecha_nacimiento ?? "",
    sexo: paciente?.sexo ?? "",
    email: paciente?.email ?? "",
    doctor_tratante_id: paciente?.doctor_tratante_id ? String(paciente.doctor_tratante_id) : "",
    direccion: paciente?.direccion ?? "",
    ciudad: paciente?.ciudad ?? "",
    ocupacion: paciente?.ocupacion ?? "",
    referido_por: paciente?.referido_por ?? "",
    notas: paciente?.notas ?? "",
  }
}

/**
 * Alta y edición de paciente, en un solo formulario.
 *
 * Sólo el nombre es obligatorio: recepción da el alta en el mostrador con lo
 * que tiene y el resto se completa después, aquí mismo. Los datos de salud no
 * van en este formulario sino en la ficha médica, para que haya un único
 * cuestionario y no dos que pidan cosas distintas.
 */
export function DialogoPaciente({
  abierto,
  alCerrar,
  alGuardar,
  paciente,
}: {
  abierto: boolean
  alCerrar: () => void
  alGuardar: (paciente: PacienteDetalle) => void
  /** Con paciente, edita; sin él, da de alta. */
  paciente?: PacienteDetalle
}) {
  return (
    <Dialogo
      abierto={abierto}
      alCerrar={alCerrar}
      titulo={paciente ? "Editar paciente" : "Nuevo paciente"}
      descripcion={
        paciente ? undefined : "Basta el nombre. Lo demás se puede completar después."
      }
      ancho="lg"
    >
      <Formulario paciente={paciente} alCerrar={alCerrar} alGuardar={alGuardar} />
    </Dialogo>
  )
}

function Formulario({
  paciente,
  alCerrar,
  alGuardar,
}: {
  paciente?: PacienteDetalle
  alCerrar: () => void
  alGuardar: (paciente: PacienteDetalle) => void
}) {
  const avisar = useAviso()
  const { data: doctores } = useDoctores()
  const crear = useCrearPaciente()
  const actualizar = useActualizarPaciente(paciente?.id ?? 0)
  const [general, setGeneral] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Valores>({ resolver: zodResolver(esquema), defaultValues: iniciales(paciente) })

  async function enviar(valores: Valores) {
    setGeneral(null)
    const datos = {
      nombres: valores.nombres.trim(),
      apellidos: valores.apellidos.trim(),
      celular: oNulo(valores.celular),
      telefono: oNulo(valores.telefono),
      documento: oNulo(valores.documento),
      fecha_nacimiento: oNulo(valores.fecha_nacimiento),
      sexo: valores.sexo || null,
      email: oNulo(valores.email),
      doctor_tratante_id: numeroONulo(valores.doctor_tratante_id),
      direccion: oNulo(valores.direccion),
      ciudad: oNulo(valores.ciudad),
      ocupacion: oNulo(valores.ocupacion),
      referido_por: oNulo(valores.referido_por),
      notas: oNulo(valores.notas),
    }

    try {
      const guardado = paciente
        ? await actualizar.mutateAsync(datos)
        : await crear.mutateAsync(datos)
      avisar(paciente ? "Paciente actualizado" : `Expediente ${guardado.codigo} creado`)
      alGuardar(guardado)
    } catch (fallo) {
      setGeneral(aplicarErrorApi(fallo, setError, CAMPOS))
    }
  }

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          etiqueta="Nombres"
          autoFocus
          autoComplete="off"
          error={errors.nombres?.message}
          {...register("nombres")}
        />
        <Campo
          etiqueta="Apellidos"
          autoComplete="off"
          error={errors.apellidos?.message}
          {...register("apellidos")}
        />
        <CampoTelefono
          etiqueta="Celular"
          error={errors.celular?.message}
          {...register("celular")}
        />
        <Selector
          etiqueta="Doctor tratante"
          opcional
          error={errors.doctor_tratante_id?.message}
          {...register("doctor_tratante_id")}
        >
          <option value="">Sin asignar</option>
          {doctores?.map((d) => (
            <option key={d.id} value={d.id}>
              {tratamiento(d.nombre_completo)}
            </option>
          ))}
        </Selector>
      </div>

      <details className="mt-5 border-t border-linea pt-4" open={Boolean(paciente)}>
        <summary className="cursor-pointer text-sm font-medium text-marca">
          Datos personales y de contacto
        </summary>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Campo
            etiqueta="Cédula o pasaporte"
            placeholder="001-0000000-1"
            ayuda="Déjalo vacío si no se conoce."
            error={errors.documento?.message}
            {...register("documento")}
          />
          <CampoFecha
            etiqueta="Fecha de nacimiento"
            max={HOY}
            error={errors.fecha_nacimiento?.message}
            {...register("fecha_nacimiento")}
          />
          <Selector etiqueta="Sexo" error={errors.sexo?.message} {...register("sexo")}>
            <option value="">Sin especificar</option>
            <option value="F">Femenino</option>
            <option value="M">Masculino</option>
            <option value="O">Otro</option>
          </Selector>
          <CampoTelefono
            etiqueta="Teléfono fijo"
            error={errors.telefono?.message}
            {...register("telefono")}
          />
          <Campo
            etiqueta="Correo"
            type="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Campo etiqueta="Ocupación" error={errors.ocupacion?.message} {...register("ocupacion")} />
          <Campo
            etiqueta="Dirección"
            className="sm:col-span-2"
            error={errors.direccion?.message}
            {...register("direccion")}
          />
          <Campo etiqueta="Ciudad" error={errors.ciudad?.message} {...register("ciudad")} />
          <Campo
            etiqueta="Referido por"
            error={errors.referido_por?.message}
            {...register("referido_por")}
          />
          <AreaTexto
            etiqueta="Notas"
            className="sm:col-span-2"
            rows={2}
            error={errors.notas?.message}
            {...register("notas")}
          />
        </div>
      </details>

      {general && <Aviso className="mt-5">{general}</Aviso>}

      <PieDialogo>
        <Boton type="button" variante="contorno" onClick={alCerrar}>
          Cancelar
        </Boton>
        <Boton type="submit" disabled={isSubmitting}>
          {isSubmitting && <Cargando size="sm" label="Guardando" />}
          {paciente ? "Guardar cambios" : "Crear expediente"}
        </Boton>
      </PieDialogo>
    </form>
  )
}
