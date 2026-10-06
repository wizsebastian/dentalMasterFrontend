import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"

import type { Alergia, CondicionMedica, Ficha, FichaGuardar } from "../../api/tipos"
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
  SelectorFiltro,
  useAviso,
} from "../../components/ui"
import { aplicarErrorApi, numeroONulo, oNulo } from "../../lib/formularios"
import { useAlergias, useCondicionesMedicas } from "../catalogo/consultas"
import { useGuardarFicha } from "./consultas"

/* Los doce interruptores de la ficha, en el orden en que se preguntan. */
const HABITOS = [
  ["fuma", "Fuma"],
  ["consume_alcohol", "Consume alcohol"],
  ["bruxismo", "Bruxismo"],
  ["onicofagia", "Onicofagia"],
  ["respirador_bucal", "Respirador bucal"],
  ["usa_hilo_dental", "Usa hilo dental"],
  ["sangrado_encias", "Sangrado de encías"],
  ["sensibilidad", "Sensibilidad"],
  ["dolor_atm", "Dolor de ATM"],
] as const

const SISTEMICO = [
  ["embarazada", "Embarazada", undefined],
  ["anticoagulantes", "Toma anticoagulantes", "Cambia el protocolo de cualquier cirugía."],
  ["bifosfonatos", "Toma bifosfonatos", "Riesgo de osteonecrosis en exodoncias e implantes."],
] as const

type Booleanos = (typeof HABITOS)[number][0] | (typeof SISTEMICO)[number][0]

type Valores = Record<Booleanos, boolean> & {
  motivo_consulta: string
  enfermedad_actual: string
  antecedentes_familiares: string
  ultima_visita_dental: string
  cepillados_dia: string
  cigarrillos_dia: string
  semanas_gestacion: string
  observaciones: string
  /** Por id del catálogo. Marcar una fila despliega su detalle. */
  condiciones: Record<string, { marcada: boolean; controlado: boolean; detalle: string }>
  alergias: Record<string, { marcada: boolean; severidad: string; reaccion: string }>
  /** `desde` no se edita aquí, pero viaja con su fila para no perderse al guardar. */
  medicamentos: { nombre: string; dosis: string; frecuencia: string; motivo: string; desde: string }[]
}

function iniciales(ficha: Ficha | undefined, condiciones: CondicionMedica[], alergias: Alergia[]): Valores {
  const booleanos = Object.fromEntries(
    [...HABITOS, ...SISTEMICO].map(([clave]) => [clave, ficha?.[clave] ?? false]),
  ) as Record<Booleanos, boolean>

  return {
    ...booleanos,
    motivo_consulta: ficha?.motivo_consulta ?? "",
    enfermedad_actual: ficha?.enfermedad_actual ?? "",
    antecedentes_familiares: ficha?.antecedentes_familiares ?? "",
    ultima_visita_dental: ficha?.ultima_visita_dental ?? "",
    cepillados_dia: ficha?.cepillados_dia?.toString() ?? "",
    cigarrillos_dia: ficha?.cigarrillos_dia?.toString() ?? "",
    semanas_gestacion: ficha?.semanas_gestacion?.toString() ?? "",
    observaciones: ficha?.observaciones ?? "",
    condiciones: Object.fromEntries(
      condiciones.map((c) => {
        const actual = ficha?.condiciones.find((f) => f.condicion_medica_id === c.id)
        return [
          String(c.id),
          {
            marcada: Boolean(actual),
            controlado: actual?.controlado ?? true,
            detalle: actual?.detalle ?? "",
          },
        ]
      }),
    ),
    alergias: Object.fromEntries(
      alergias.map((a) => {
        const actual = ficha?.alergias.find((f) => f.alergia_id === a.id)
        return [
          String(a.id),
          {
            marcada: Boolean(actual),
            severidad: actual?.severidad ?? "moderada",
            reaccion: actual?.reaccion ?? "",
          },
        ]
      }),
    ),
    // Sólo la medicación en curso; la que ya no toma se conserva aparte al guardar.
    medicamentos: (ficha?.medicamentos ?? [])
      .filter((m) => m.activo)
      .map((m) => ({
        nombre: m.nombre,
        dosis: m.dosis ?? "",
        frecuencia: m.frecuencia ?? "",
        motivo: m.motivo ?? "",
        desde: m.desde ?? "",
      })),
  }
}

/**
 * La ficha médica completa, en un solo formulario.
 *
 * Es el único cuestionario de salud de la aplicación: el alta de paciente no
 * pregunta nada de esto, así no hay dos formularios que pidan cosas distintas.
 * Condiciones y alergias salen del catálogo, que es el que sabe cuáles disparan
 * una alerta clínica.
 */
export function DialogoFicha({
  abierto,
  alCerrar,
  pacienteId,
  ficha,
}: {
  abierto: boolean
  alCerrar: () => void
  pacienteId: number
  ficha?: Ficha
}) {
  const { data: condiciones } = useCondicionesMedicas()
  const { data: alergias } = useAlergias()

  return (
    <Dialogo
      abierto={abierto}
      alCerrar={alCerrar}
      titulo={ficha ? "Editar ficha médica" : "Abrir ficha médica"}
      descripcion="Lo que se marque aquí alimenta las alertas del expediente."
      ancho="lg"
    >
      {condiciones && alergias ? (
        <Formulario
          pacienteId={pacienteId}
          ficha={ficha}
          condiciones={condiciones}
          alergias={alergias}
          alCerrar={alCerrar}
        />
      ) : (
        <div className="grid place-items-center py-10 text-marca">
          <Cargando label="Cargando los catálogos" />
        </div>
      )}
    </Dialogo>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-linea pt-4 first:border-0 first:pt-0">
      <legend className="float-left mb-3 w-full text-sm font-semibold">{titulo}</legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  )
}

function Formulario({
  pacienteId,
  ficha,
  condiciones,
  alergias,
  alCerrar,
}: {
  pacienteId: number
  ficha?: Ficha
  condiciones: CondicionMedica[]
  alergias: Alergia[]
  alCerrar: () => void
}) {
  const avisar = useAviso()
  const guardar = useGuardarFicha(pacienteId)
  const [general, setGeneral] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Valores>({ defaultValues: iniciales(ficha, condiciones, alergias) })
  const medicamentos = useFieldArray({ control, name: "medicamentos" })

  const marcadas = useWatch({ control, name: "condiciones" })
  const alergicas = useWatch({ control, name: "alergias" })
  const fuma = useWatch({ control, name: "fuma" })
  const embarazada = useWatch({ control, name: "embarazada" })

  async function enviar(v: Valores) {
    setGeneral(null)

    const datos: FichaGuardar = {
      motivo_consulta: oNulo(v.motivo_consulta),
      enfermedad_actual: oNulo(v.enfermedad_actual),
      antecedentes_familiares: oNulo(v.antecedentes_familiares),
      ultima_visita_dental: oNulo(v.ultima_visita_dental),
      cepillados_dia: numeroONulo(v.cepillados_dia),
      observaciones: oNulo(v.observaciones),
      fuma: v.fuma,
      // Un dato que depende de un interruptor apagado no se guarda.
      cigarrillos_dia: v.fuma ? numeroONulo(v.cigarrillos_dia) : null,
      consume_alcohol: v.consume_alcohol,
      bruxismo: v.bruxismo,
      onicofagia: v.onicofagia,
      respirador_bucal: v.respirador_bucal,
      usa_hilo_dental: v.usa_hilo_dental,
      sangrado_encias: v.sangrado_encias,
      sensibilidad: v.sensibilidad,
      dolor_atm: v.dolor_atm,
      embarazada: v.embarazada,
      semanas_gestacion: v.embarazada ? numeroONulo(v.semanas_gestacion) : null,
      anticoagulantes: v.anticoagulantes,
      bifosfonatos: v.bifosfonatos,
      condiciones: Object.entries(v.condiciones)
        .filter(([, c]) => c.marcada)
        .map(([id, c]) => ({
          condicion_medica_id: Number(id),
          controlado: c.controlado,
          detalle: oNulo(c.detalle),
          // La ficha se guarda entera: lo que este formulario no enseña hay que
          // devolverlo tal cual, o se borraría.
          diagnosticado_en:
            ficha?.condiciones.find((f) => f.condicion_medica_id === Number(id))
              ?.diagnosticado_en ?? null,
        })),
      alergias: Object.entries(v.alergias)
        .filter(([, a]) => a.marcada)
        .map(([id, a]) => ({
          alergia_id: Number(id),
          severidad: a.severidad,
          reaccion: oNulo(a.reaccion),
        })),
      medicamentos: [
        ...v.medicamentos
          .filter((m) => m.nombre.trim())
          .map((m) => ({
            nombre: m.nombre.trim(),
            dosis: oNulo(m.dosis),
            frecuencia: oNulo(m.frecuencia),
            motivo: oNulo(m.motivo),
            desde: oNulo(m.desde),
            activo: true,
          })),
        // La medicación que ya dejó de tomar es historia clínica: se conserva.
        ...(ficha?.medicamentos ?? [])
          .filter((m) => !m.activo)
          .map(({ nombre, dosis, frecuencia, motivo, desde }) => ({
            nombre,
            dosis,
            frecuencia,
            motivo,
            desde,
            activo: false,
          })),
      ],
    }

    try {
      await guardar.mutateAsync(datos)
      avisar("Ficha médica guardada")
      alCerrar()
    } catch (fallo) {
      setGeneral(aplicarErrorApi(fallo, setError, []))
    }
  }

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-6">
      <Seccion titulo="Motivo y antecedentes">
        <div className="grid gap-4 sm:grid-cols-2">
          <AreaTexto
            etiqueta="Motivo de consulta"
            autoFocus
            rows={2}
            className="sm:col-span-2"
            {...register("motivo_consulta")}
          />
          <AreaTexto etiqueta="Enfermedad actual" rows={2} {...register("enfermedad_actual")} />
          <AreaTexto
            etiqueta="Antecedentes familiares"
            rows={2}
            {...register("antecedentes_familiares")}
          />
          <CampoFecha etiqueta="Última visita dental" {...register("ultima_visita_dental")} />
          <Campo
            etiqueta="Cepillados al día"
            type="number"
            inputMode="numeric"
            min={0}
            max={10}
            {...register("cepillados_dia")}
          />
        </div>
      </Seccion>

      <Seccion titulo="Condiciones médicas">
        <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {condiciones.map((c) => (
            <li key={c.id}>
              <Casilla
                id={`condicion-${c.id}`}
                etiqueta={c.nombre}
                ayuda={c.riesgo === "alto" ? "Riesgo alto: genera alerta" : undefined}
                {...register(`condiciones.${c.id}.marcada`)}
              />
              {marcadas[String(c.id)]?.marcada && (
                <div className="ml-6.5 mt-2 space-y-2">
                  <Casilla
                    id={`condicion-${c.id}-controlada`}
                    etiqueta="Controlada"
                    {...register(`condiciones.${c.id}.controlado`)}
                  />
                  <input
                    aria-label={`Detalle de ${c.nombre}`}
                    placeholder="Detalle (tratamiento, desde cuándo…)"
                    className="block w-full rounded-lg border border-linea-fuerte bg-superficie px-3 py-1.5 text-sm placeholder:text-tinta-suave/60"
                    {...register(`condiciones.${c.id}.detalle`)}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      </Seccion>

      <Seccion titulo="Alergias">
        <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {alergias.map((a) => (
            <li key={a.id}>
              <Casilla
                id={`alergia-${a.id}`}
                etiqueta={a.nombre}
                {...register(`alergias.${a.id}.marcada`)}
              />
              {alergicas[String(a.id)]?.marcada && (
                <div className="ml-6.5 mt-2 flex gap-2">
                  <SelectorFiltro
                    aria-label={`Severidad de la alergia a ${a.nombre}`}
                    className="w-36"
                    {...register(`alergias.${a.id}.severidad`)}
                  >
                    <option value="leve">Leve</option>
                    <option value="moderada">Moderada</option>
                    <option value="severa">Severa</option>
                  </SelectorFiltro>
                  <input
                    aria-label={`Reacción a ${a.nombre}`}
                    placeholder="Reacción"
                    className="block min-w-0 flex-1 rounded-lg border border-linea-fuerte bg-superficie px-3 py-1.5 text-sm placeholder:text-tinta-suave/60"
                    {...register(`alergias.${a.id}.reaccion`)}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      </Seccion>

      <Seccion titulo="Medicación actual">
        {medicamentos.fields.length === 0 && (
          <p className="text-sm text-tinta-suave">Ninguna registrada.</p>
        )}
        <ul className="space-y-2">
          {medicamentos.fields.map((campo, i) => (
            <li key={campo.id} className="grid items-center gap-2 sm:grid-cols-[2fr_1fr_1fr_2fr_auto]">
              <input
                aria-label="Medicamento"
                placeholder="Medicamento"
                aria-invalid={errors.medicamentos?.[i]?.nombre ? true : undefined}
                className="min-w-0 rounded-lg border border-linea-fuerte bg-superficie px-3 py-1.5 text-sm placeholder:text-tinta-suave/60 aria-invalid:border-tinta"
                {...register(`medicamentos.${i}.nombre`, { required: true })}
              />
              <input
                aria-label="Dosis"
                placeholder="Dosis"
                className="min-w-0 rounded-lg border border-linea-fuerte bg-superficie px-3 py-1.5 text-sm placeholder:text-tinta-suave/60"
                {...register(`medicamentos.${i}.dosis`)}
              />
              <input
                aria-label="Frecuencia"
                placeholder="Frecuencia"
                className="min-w-0 rounded-lg border border-linea-fuerte bg-superficie px-3 py-1.5 text-sm placeholder:text-tinta-suave/60"
                {...register(`medicamentos.${i}.frecuencia`)}
              />
              <input
                aria-label="Motivo"
                placeholder="Para qué la toma"
                className="min-w-0 rounded-lg border border-linea-fuerte bg-superficie px-3 py-1.5 text-sm placeholder:text-tinta-suave/60"
                {...register(`medicamentos.${i}.motivo`)}
              />
              <button
                type="button"
                onClick={() => medicamentos.remove(i)}
                aria-label="Quitar medicamento"
                className="justify-self-start rounded-lg p-1.5 text-tinta-suave hover:bg-marca-tenue hover:text-marca"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
        <Boton
          type="button"
          variante="plano"
          className="mt-2 -ml-2"
          onClick={() => medicamentos.append({ nombre: "", dosis: "", frecuencia: "", motivo: "", desde: "" })}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Añadir medicamento
        </Boton>
      </Seccion>

      <Seccion titulo="Hábitos y estado sistémico">
        <div className="grid gap-x-6 gap-y-2.5 sm:grid-cols-3">
          {HABITOS.map(([clave, etiqueta]) => (
            <Casilla key={clave} id={`habito-${clave}`} etiqueta={etiqueta} {...register(clave)} />
          ))}
        </div>
        <div className="mt-4 grid gap-x-6 gap-y-2.5 sm:grid-cols-3">
          {SISTEMICO.map(([clave, etiqueta, ayuda]) => (
            <Casilla
              key={clave}
              id={`sistemico-${clave}`}
              etiqueta={etiqueta}
              ayuda={ayuda}
              {...register(clave)}
            />
          ))}
        </div>
        {(fuma || embarazada) && (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {fuma && (
              <Campo
                etiqueta="Cigarrillos al día"
                type="number"
                inputMode="numeric"
                min={0}
                {...register("cigarrillos_dia")}
              />
            )}
            {embarazada && (
              <Campo
                etiqueta="Semanas de gestación"
                type="number"
                inputMode="numeric"
                min={0}
                max={45}
                {...register("semanas_gestacion")}
              />
            )}
          </div>
        )}
      </Seccion>

      <AreaTexto
        etiqueta="Observaciones"
        rows={2}
        className="border-t border-linea pt-4"
        {...register("observaciones")}
      />

      {general && <Aviso>{general}</Aviso>}

      <PieDialogo>
        <Boton type="button" variante="contorno" onClick={alCerrar}>
          Cancelar
        </Boton>
        <Boton type="submit" disabled={isSubmitting}>
          {isSubmitting && <Cargando size="sm" label="Guardando" />}
          Guardar ficha
        </Boton>
      </PieDialogo>
    </form>
  )
}
