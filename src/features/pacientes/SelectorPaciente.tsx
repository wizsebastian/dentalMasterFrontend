import { useState } from "react"

import type { PacienteResumen } from "../../api/tipos"
import { Combobox } from "../../components/ui"
import { telefono } from "../../lib/formato"
import { usePacientes } from "./consultas"

/**
 * Elegir un paciente dentro de un formulario.
 *
 * Mientras no hay ninguno enseña el buscador; al elegir, lo sustituye por el
 * nombre con un «Cambiar». Así el formulario nunca envía un texto a medio
 * escribir como si fuera un paciente.
 */
export function SelectorPaciente({
  elegido,
  alElegir,
  error,
  fijo = false,
}: {
  elegido: { id: number; nombre: string } | null
  alElegir: (paciente: PacienteResumen | null) => void
  error?: string
  /** El paciente viene dado (se agenda desde su expediente) y no se cambia. */
  fijo?: boolean
}) {
  const [texto, setTexto] = useState("")
  const { data, isFetching, isPlaceholderData } = usePacientes(texto, 0, 6)
  const pacientes = texto.trim() && !isPlaceholderData ? (data?.items ?? []) : []

  if (elegido) {
    return (
      <div>
        <p className="text-sm font-medium">Paciente</p>
        <div className="mt-1.5 flex items-center justify-between gap-3 rounded-lg border border-linea-fuerte bg-esmalte px-3 py-2 text-sm">
          <span className="font-medium">{elegido.nombre}</span>
          {!fijo && (
            <button
              type="button"
              onClick={() => alElegir(null)}
              className="text-tinta-suave underline-offset-2 hover:text-tinta hover:underline"
            >
              Cambiar
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm font-medium">Paciente</p>
      <div className="mt-1.5">
        <Combobox
          etiqueta="Buscar paciente"
          autoFocus
          texto={texto}
          alEscribir={setTexto}
          placeholder="Nombre, expediente, cédula o teléfono"
          cargando={isFetching}
          vacio="Ningún paciente coincide. Créalo primero con F1."
          opciones={pacientes.map((p) => ({
            id: p.id,
            titulo: `${p.nombres} ${p.apellidos}`,
            detalle: (
              <span className="tabular font-mono text-xs">
                {p.codigo}
                {p.celular && ` · ${telefono(p.celular)}`}
              </span>
            ),
          }))}
          alElegir={(opcion) => {
            const paciente = pacientes.find((p) => p.id === opcion.id)
            if (paciente) alElegir(paciente)
          }}
        />
      </div>
      {error && <p className="mt-1.5 text-sm font-medium text-tinta">{error}</p>}
    </div>
  )
}
