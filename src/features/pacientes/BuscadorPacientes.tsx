import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { Combobox, Dialogo } from "../../components/ui"
import { telefono } from "../../lib/formato"
import { usePacientes } from "./consultas"

/** Salto directo a un expediente desde cualquier pantalla (`⌘K`). */
export function BuscadorPacientes({ abierto, alCerrar }: { abierto: boolean; alCerrar: () => void }) {
  return (
    <Dialogo abierto={abierto} alCerrar={alCerrar} titulo="Buscar paciente" ancho="md">
      <Contenido alCerrar={alCerrar} />
    </Dialogo>
  )
}

// Aparte para que el texto empiece vacío cada vez: el diálogo desmonta su
// contenido al cerrarse.
function Contenido({ alCerrar }: { alCerrar: () => void }) {
  const navegar = useNavigate()
  const [texto, setTexto] = useState("")
  const { data, isFetching, isPlaceholderData } = usePacientes(texto, 0, 8)

  // Mientras llega la respuesta, la consulta conserva los resultados del texto
  // anterior. Aquí no se enseñan: un Enter rápido abriría el expediente de otro
  // paciente.
  const pacientes = texto.trim() && !isPlaceholderData ? (data?.items ?? []) : []

  return (
    <Combobox
      etiqueta="Buscar paciente"
      autoFocus
      texto={texto}
      alEscribir={setTexto}
      placeholder="Nombre, expediente, cédula o teléfono"
      cargando={isFetching}
      vacio="Ningún paciente coincide"
      opciones={pacientes.map((paciente) => ({
        id: paciente.id,
        titulo: `${paciente.nombres} ${paciente.apellidos}`,
        detalle: (
          <span className="tabular font-mono text-xs">
            {paciente.codigo}
            {paciente.celular && ` · ${telefono(paciente.celular)}`}
          </span>
        ),
      }))}
      alElegir={(opcion) => {
        alCerrar()
        navegar(`/pacientes/${opcion.id}`)
      }}
    />
  )
}
