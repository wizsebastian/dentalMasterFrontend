import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Pencil, Plus } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import type { Doctor } from "../../api/tipos"
import { Cargando } from "../../components/brand"
import {
  Aviso,
  Boton,
  Campo,
  CampoTelefono,
  Casilla,
  Dialogo,
  ErrorCarga,
  EsqueletoTabla,
  Insignia,
  PieDialogo,
  Selector,
  Tabla,
  Tarjeta,
  Vacio,
  useAviso,
  type Columna,
} from "../../components/ui"
import { aplicarErrorApi, oNulo } from "../../lib/formularios"
import { doctor as tratamiento, mascaraTelefono, telefono } from "../../lib/formato"
import { useDoctores, useEspecialidades, useGuardarDoctor } from "../catalogo/consultas"

const esquema = z.object({
  nombres: z.string().trim().min(1, "Escribe el nombre"),
  apellidos: z.string().trim().min(1, "Escribe los apellidos"),
  documento: z.string().trim().min(5, "Escribe la cédula"),
  licencia: z.string(),
  email: z.union([z.literal(""), z.email("El correo no es válido")]),
  telefono: z.string(),
  porcentaje_comision: z.coerce.number<string>().min(0, "Entre 0 y 100").max(100, "Entre 0 y 100"),
  principal: z.string(),
  otras: z.array(z.string()),
  activo: z.boolean(),
})

type Entrada = z.input<typeof esquema>
type Valores = z.output<typeof esquema>

const CAMPOS = [
  "nombres",
  "apellidos",
  "documento",
  "licencia",
  "email",
  "telefono",
  "porcentaje_comision",
] as const

export function PanelDoctores() {
  const { data, isPending, error } = useDoctores(true)
  const [editando, setEditando] = useState<Doctor | "nuevo" | null>(null)

  const columnas: Columna<Doctor>[] = [
    {
      id: "doctor",
      titulo: "Doctor",
      celda: (d) => (
        <>
          <span className="font-medium">{tratamiento(d.nombre_completo)}</span>
          {!d.activo && <Insignia className="ml-2">Inactivo</Insignia>}
          <span className="block text-xs text-tinta-suave">
            {d.especialidades.map((e) => e.nombre).join(" · ") || "Sin especialidad"}
          </span>
        </>
      ),
    },
    {
      id: "licencia",
      titulo: "Exequátur",
      className: "tabular font-mono text-tinta-suave",
      celda: (d) => d.licencia ?? "—",
    },
    {
      id: "telefono",
      titulo: "Teléfono",
      className: "tabular font-mono text-tinta-suave",
      celda: (d) => telefono(d.telefono),
    },
    {
      id: "comision",
      titulo: "Comisión",
      alinear: "derecha",
      className: "tabular",
      celda: (d) => `${Number(d.porcentaje_comision ?? 0)} %`,
    },
    {
      id: "acciones",
      titulo: "",
      alinear: "derecha",
      celda: (d) => (
        <button
          type="button"
          onClick={() => setEditando(d)}
          aria-label={`Editar a ${d.nombre_completo}`}
          className="rounded-lg p-1.5 text-tinta-suave hover:bg-marca-tenue hover:text-marca"
        >
          <Pencil className="h-4 w-4" aria-hidden />
        </button>
      ),
    },
  ]

  return (
    <div>
      <div className="flex justify-end">
        <Boton onClick={() => setEditando("nuevo")}>
          <Plus className="h-4 w-4" aria-hidden />
          Nuevo doctor
        </Boton>
      </div>

      <Tarjeta className="mt-4 overflow-hidden">
        {isPending ? (
          <EsqueletoTabla filas={4} />
        ) : error ? (
          <ErrorCarga error={error} className="m-4 border-0" />
        ) : data.length === 0 ? (
          <Vacio titulo="Todavía no hay doctores" />
        ) : (
          <Tabla
            columnas={columnas}
            filas={data}
            clave={(d) => d.id}
            claseFila={(d) => (d.activo ? undefined : "text-tinta-suave")}
          />
        )}
      </Tarjeta>

      <Dialogo
        abierto={editando !== null}
        alCerrar={() => setEditando(null)}
        titulo={editando === "nuevo" || editando === null ? "Nuevo doctor" : "Editar doctor"}
        ancho="lg"
      >
        <Formulario
          doctor={editando === "nuevo" || editando === null ? undefined : editando}
          alCerrar={() => setEditando(null)}
        />
      </Dialogo>
    </div>
  )
}

function Formulario({ doctor, alCerrar }: { doctor?: Doctor; alCerrar: () => void }) {
  const avisar = useAviso()
  const { data: especialidades } = useEspecialidades()
  const guardar = useGuardarDoctor()
  const [general, setGeneral] = useState<string | null>(null)

  const principal = doctor?.especialidades.find((e) => e.principal)

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Entrada, unknown, Valores>({
    resolver: zodResolver(esquema),
    defaultValues: {
      nombres: doctor?.nombres ?? "",
      apellidos: doctor?.apellidos ?? "",
      documento: doctor?.documento ?? "",
      licencia: doctor?.licencia ?? "",
      email: doctor?.email ?? "",
      telefono: mascaraTelefono(doctor?.telefono ?? ""),
      porcentaje_comision: String(Number(doctor?.porcentaje_comision ?? 0)),
      principal: principal ? String(principal.especialidad_id) : "",
      otras:
        doctor?.especialidades.filter((e) => !e.principal).map((e) => String(e.especialidad_id)) ??
        [],
      activo: doctor?.activo ?? true,
    },
  })

  const principalElegida = useWatch({ control, name: "principal" })

  async function enviar({ principal, otras, activo, ...valores }: Valores) {
    setGeneral(null)
    // La API toma la primera como principal.
    const ids = [principal, ...otras.filter((id) => id !== principal)].filter(Boolean).map(Number)
    const datos = {
      ...valores,
      licencia: oNulo(valores.licencia),
      email: oNulo(valores.email),
      telefono: oNulo(valores.telefono),
      especialidad_ids: ids,
    }

    try {
      await guardar.mutateAsync(doctor ? { id: doctor.id, datos: { ...datos, activo } } : { datos })
      avisar(doctor ? "Doctor actualizado" : "Doctor creado")
      alCerrar()
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
          ayuda="Sin «Dr.» ni «Dra.»: el tratamiento lo pone la aplicación."
          error={errors.nombres?.message}
          {...register("nombres")}
        />
        <Campo etiqueta="Apellidos" error={errors.apellidos?.message} {...register("apellidos")} />
        <Campo
          etiqueta="Cédula"
          placeholder="001-0000000-1"
          error={errors.documento?.message}
          {...register("documento")}
        />
        <Campo
          etiqueta="Exequátur"
          opcional
          error={errors.licencia?.message}
          {...register("licencia")}
        />
        <Campo
          etiqueta="Correo"
          type="email"
          opcional
          error={errors.email?.message}
          {...register("email")}
        />
        <CampoTelefono
          etiqueta="Teléfono"
          opcional
          error={errors.telefono?.message}
          {...register("telefono")}
        />
        <Campo
          etiqueta="Comisión (%)"
          type="number"
          inputMode="decimal"
          min={0}
          max={100}
          step="0.5"
          ayuda="Parte de lo cobrado que le corresponde."
          error={errors.porcentaje_comision?.message}
          {...register("porcentaje_comision")}
        />
        <Selector etiqueta="Especialidad principal" opcional {...register("principal")}>
          <option value="">Sin especialidad</option>
          {especialidades?.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </Selector>
      </div>

      <fieldset className="mt-5 border-t border-linea pt-4">
        <legend className="float-left mb-3 w-full text-sm font-medium">Otras especialidades</legend>
        <div className="clear-both grid gap-2.5 sm:grid-cols-2">
          {especialidades
            ?.filter((e) => String(e.id) !== principalElegida)
            .map((e) => (
              <Casilla
                key={e.id}
                id={`especialidad-${e.id}`}
                etiqueta={e.nombre}
                value={e.id}
                {...register("otras")}
              />
            ))}
        </div>
      </fieldset>

      {doctor && (
        <Casilla
          className="mt-5"
          etiqueta="Activo"
          ayuda="Un doctor inactivo no se ofrece al agendar, pero conserva su histórico."
          {...register("activo")}
        />
      )}

      {general && <Aviso className="mt-5">{general}</Aviso>}

      <PieDialogo>
        <Boton type="button" variante="contorno" onClick={alCerrar}>
          Cancelar
        </Boton>
        <Boton type="submit" disabled={isSubmitting}>
          {isSubmitting && <Cargando size="sm" label="Guardando" />}
          {doctor ? "Guardar cambios" : "Crear doctor"}
        </Boton>
      </PieDialogo>
    </form>
  )
}
