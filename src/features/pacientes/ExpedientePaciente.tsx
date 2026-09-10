import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Link, useParams } from "react-router-dom"

import { Cargando } from "../../components/brand"
import { ErrorCarga } from "../../components/ui"
import { BannerAlertas } from "./BannerAlertas"
import { PanelFicha } from "./PanelFicha"
import { PanelOdontograma } from "./PanelOdontograma"
import { useAlertas, usePaciente } from "./consultas"

const PESTANAS = [
  { id: "odontograma", etiqueta: "Odontograma" },
  { id: "ficha", etiqueta: "Ficha médica" },
] as const

type Pestana = (typeof PESTANAS)[number]["id"]

export function ExpedientePaciente() {
  const { id } = useParams<{ id: string }>()
  const pacienteId = Number(id)

  const { data: paciente, isPending, error } = usePaciente(pacienteId)
  const { data: alertas } = useAlertas(pacienteId)
  const [pestana, setPestana] = useState<Pestana>("odontograma")

  if (isPending) {
    return (
      <div className="grid place-items-center py-24 text-marca">
        <Cargando size="lg" label="Cargando el expediente" />
      </div>
    )
  }

  if (error) return <ErrorCarga error={error} />

  return (
    <div className="space-y-5">
      <Link
        to="/pacientes"
        className="inline-flex items-center gap-1.5 text-sm text-tinta-suave hover:text-tinta"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Pacientes
      </Link>

      <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {paciente.nombres} {paciente.apellidos}
        </h1>
        <span className="tabular font-mono text-sm text-tinta-suave">{paciente.codigo}</span>
        <span className="text-sm text-tinta-suave">
          {paciente.edad} años · {paciente.sexo === "F" ? "femenino" : paciente.sexo === "M" ? "masculino" : "otro"}
          {paciente.documento && (
            <>
              {" · "}
              <span className="tabular font-mono">{paciente.documento}</span>
            </>
          )}
        </span>
      </header>

      {alertas && <BannerAlertas alertas={alertas} />}

      <div className="border-b border-linea">
        <nav className="-mb-px flex gap-1" role="tablist">
          {PESTANAS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={pestana === item.id}
              onClick={() => setPestana(item.id)}
              className={`border-b-2 px-3 py-2 text-sm transition-colors
                ${
                  pestana === item.id
                    ? "border-marca font-medium text-marca"
                    : "border-transparent text-tinta-suave hover:text-tinta"
                }`}
            >
              {item.etiqueta}
            </button>
          ))}
        </nav>
      </div>

      {pestana === "odontograma" ? (
        <PanelOdontograma pacienteId={pacienteId} />
      ) : (
        <PanelFicha pacienteId={pacienteId} />
      )}
    </div>
  )
}
