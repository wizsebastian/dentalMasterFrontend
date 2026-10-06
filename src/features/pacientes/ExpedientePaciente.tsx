import { useState } from "react"
import { ArrowLeft, Pencil } from "lucide-react"
import { Link, useParams } from "react-router-dom"

import { Cargando } from "../../components/brand"
import { Boton, ErrorCarga, Pestanas, usePestana } from "../../components/ui"
import { PanelCitas } from "../agenda/PanelCitas"
import { useAuth } from "../auth/contexto"
import { PanelCuenta } from "../caja/PanelCuenta"
import { useCuenta } from "../caja/consultas"
import { PanelDocumentos } from "../documentos/PanelDocumentos"
import { PanelHistorial } from "../historial/PanelHistorial"
import { SeccionImplantes } from "../implantes/Implantes"
import { doctor, edad, moneda, sexo, telefono } from "../../lib/formato"
import { BannerAlertas } from "./BannerAlertas"
import { DialogoPaciente } from "./DialogoPaciente"
import { PanelFicha } from "./PanelFicha"
import { PanelOdontograma } from "./PanelOdontograma"
import { ResumenPaciente } from "./ResumenPaciente"
import { useAlertas, usePaciente } from "./consultas"

// El historial va primero: es donde se trabaja al abrir un expediente.
const PESTANAS = [
  { id: "historial", etiqueta: "Historial" },
  { id: "odontograma", etiqueta: "Odontograma" },
  { id: "ficha", etiqueta: "Ficha médica" },
  { id: "documentos", etiqueta: "Documentos" },
  { id: "citas", etiqueta: "Citas" },
  { id: "cuenta", etiqueta: "Cuenta" },
] as const

export function ExpedientePaciente() {
  const { id } = useParams<{ id: string }>()
  const pacienteId = Number(id)

  const { puede } = useAuth()
  const { data: paciente, isPending, error } = usePaciente(pacienteId)
  const { data: alertas } = useAlertas(pacienteId)
  const { data: cuenta } = useCuenta(pacienteId)
  const [pestana, setPestana] = usePestana(PESTANAS)
  const [editando, setEditando] = useState(false)

  if (isPending) {
    return (
      <div className="grid place-items-center py-24 text-marca">
        <Cargando size="lg" label="Cargando el expediente" />
      </div>
    )
  }

  if (error) return <ErrorCarga error={error} />

  // Sólo lo que se conoce: un alta rápida puede no traer edad ni sexo.
  const datos = [
    paciente.edad !== null && edad(paciente.edad),
    paciente.sexo && sexo(paciente.sexo).toLowerCase(),
  ].filter(Boolean)

  return (
    <div className="space-y-5">
      <Link
        to="/pacientes"
        className="no-imprimir inline-flex items-center gap-1.5 text-sm text-tinta-suave hover:text-tinta"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Pacientes
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {paciente.nombres} {paciente.apellidos}
            </h1>
            <span className="tabular font-mono text-sm text-tinta-suave">{paciente.codigo}</span>
          </div>
          <p className="mt-1 flex flex-wrap gap-x-2 text-sm text-tinta-suave">
            {datos.length > 0 && <span>{datos.join(" · ")}</span>}
            {paciente.documento && (
              <span className="tabular font-mono">{paciente.documento}</span>
            )}
            {paciente.celular && (
              <span className="tabular font-mono">{telefono(paciente.celular)}</span>
            )}
            {paciente.doctor_tratante_nombre && (
              <span>{doctor(paciente.doctor_tratante_nombre)}</span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* El saldo, siempre a la vista: es lo primero que pregunta el mostrador. */}
          {cuenta && Number(cuenta.balance) !== 0 && (
            <button
              type="button"
              onClick={() => setPestana("cuenta")}
              className="text-right text-sm hover:underline"
            >
              <span className="block text-xs text-tinta-suave">
                {Number(cuenta.balance) < 0 ? "Crédito a favor" : "Balance pendiente"}
              </span>
              <span className="tabular text-lg font-semibold">
                {moneda(Math.abs(Number(cuenta.balance)))}
              </span>
            </button>
          )}
          {puede("doctor", "asistente", "recepcion") && (
            <Boton variante="contorno" onClick={() => setEditando(true)}>
              <Pencil className="h-4 w-4" aria-hidden />
              Editar paciente
            </Boton>
          )}
        </div>
      </header>

      {alertas && <BannerAlertas alertas={alertas} />}

      <ResumenPaciente pacienteId={pacienteId} alIrA={setPestana} />

      <Pestanas pestanas={PESTANAS} activa={pestana} alCambiar={setPestana} />

      {pestana === "historial" && <PanelHistorial paciente={paciente} />}
      {pestana === "odontograma" && (
        <div className="space-y-8">
          <PanelOdontograma pacienteId={pacienteId} />
          <SeccionImplantes pacienteId={pacienteId} />
        </div>
      )}
      {pestana === "ficha" && <PanelFicha pacienteId={pacienteId} />}
      {pestana === "documentos" && <PanelDocumentos paciente={paciente} />}
      {pestana === "citas" && <PanelCitas paciente={paciente} />}
      {pestana === "cuenta" && <PanelCuenta paciente={paciente} />}

      <DialogoPaciente
        abierto={editando}
        paciente={paciente}
        alCerrar={() => setEditando(false)}
        alGuardar={() => setEditando(false)}
      />
    </div>
  )
}
