import { useState } from "react"
import { Search, UserPlus } from "lucide-react"
import { Link } from "react-router-dom"

import type { PacienteResumen } from "../../api/tipos"
import {
  Boton,
  ErrorCarga,
  EsqueletoTabla,
  Paginacion,
  Tabla,
  Tarjeta,
  Vacio,
  type Columna,
} from "../../components/ui"
import { useAuth } from "../auth/contexto"
import { doctor, edad, telefono } from "../../lib/formato"
import { useLayout } from "../../rutas/contexto"
import { usePacientes } from "./consultas"

const POR_PAGINA = 25

const COLUMNAS: Columna<PacienteResumen>[] = [
  {
    id: "expediente",
    titulo: "Expediente",
    celda: (p) => (
      <Link to={`/pacientes/${p.id}`} className="tabular font-mono text-marca hover:underline">
        {p.codigo}
      </Link>
    ),
  },
  {
    id: "paciente",
    titulo: "Paciente",
    className: "font-medium",
    celda: (p) => `${p.apellidos}, ${p.nombres}`,
  },
  {
    id: "cedula",
    titulo: "Cédula",
    className: "tabular font-mono text-tinta-suave",
    celda: (p) => p.documento ?? "—",
  },
  { id: "edad", titulo: "Edad", className: "tabular text-tinta-suave", celda: (p) => edad(p.edad) },
  {
    id: "celular",
    titulo: "Celular",
    className: "tabular font-mono text-tinta-suave",
    celda: (p) => telefono(p.celular),
  },
  {
    id: "doctor",
    titulo: "Doctor tratante",
    className: "text-tinta-suave",
    celda: (p) => doctor(p.doctor_tratante_nombre),
  },
]

export function ListaPacientes() {
  const { puede } = useAuth()
  const { nuevoPaciente } = useLayout()
  const [buscar, setBuscar] = useState("")
  const [offset, setOffset] = useState(0)
  const { data, isPending, isFetching, error } = usePacientes(buscar, offset, POR_PAGINA)

  const puedeAlta = puede("doctor", "asistente", "recepcion")

  function alBuscar(valor: string) {
    setBuscar(valor)
    setOffset(0) // un filtro nuevo empieza por la primera página
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pacientes</h1>
          {data && (
            <p className="mt-1 text-sm text-tinta-suave">
              <span className="tabular font-mono">{data.total}</span>
              {data.total === 1 ? " expediente" : " expedientes"}
              {buscar.trim() && " coinciden con la búsqueda"}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-suave"
              aria-hidden
            />
            <input
              type="search"
              value={buscar}
              onChange={(e) => alBuscar(e.target.value)}
              placeholder="Nombre, expediente, cédula o teléfono"
              aria-label="Buscar pacientes"
              className="w-80 max-w-full rounded-lg border border-linea-fuerte bg-superficie py-2 pl-9 pr-3 text-sm placeholder:text-tinta-suave/60"
            />
          </div>
          {puedeAlta && (
            <Boton onClick={nuevoPaciente}>
              <UserPlus className="h-4 w-4" aria-hidden />
              Nuevo paciente
            </Boton>
          )}
        </div>
      </div>

      <Tarjeta className="mt-6 overflow-hidden">
        {isPending ? (
          <EsqueletoTabla />
        ) : error ? (
          <ErrorCarga error={error} className="m-4 border-0" />
        ) : data.items.length === 0 ? (
          <Vacio
            titulo={buscar.trim() ? "Ningún paciente coincide" : "Todavía no hay pacientes"}
            descripcion={
              buscar.trim()
                ? "Prueba con el número de expediente, la cédula o el teléfono."
                : "Los expedientes que registres aparecerán aquí."
            }
            accion={
              puedeAlta && !buscar.trim() ? (
                <Boton onClick={nuevoPaciente}>Crear el primer expediente</Boton>
              ) : undefined
            }
          />
        ) : (
          <Tabla columnas={COLUMNAS} filas={data.items} clave={(p) => p.id} atenuada={isFetching} />
        )}
      </Tarjeta>

      {data && (
        <Paginacion offset={offset} limite={POR_PAGINA} total={data.total} alCambiar={setOffset} />
      )}
    </div>
  )
}
