import { Navigate } from "react-router-dom"

import { Pestanas, usePestana } from "../../components/ui"
import { PanelClinica } from "../clinica/PanelClinica"
import { useAuth } from "../auth/contexto"
import { PanelDoctores } from "./PanelDoctores"
import { PanelPlantillas } from "./PanelPlantillas"
import { PanelSecuencias } from "./PanelSecuencias"
import { PanelUnidades } from "./PanelUnidades"
import { PanelUsuarios } from "./PanelUsuarios"

const PESTANAS = [
  { id: "clinica", etiqueta: "Clínica" },
  { id: "unidades", etiqueta: "Unidades dentales" },
  { id: "doctores", etiqueta: "Doctores" },
  { id: "usuarios", etiqueta: "Usuarios" },
  { id: "plantillas", etiqueta: "Plantillas" },
  { id: "ncf", etiqueta: "Comprobantes fiscales" },
] as const

/** Quién trabaja en la clínica, con qué cuenta entra y en qué sillones. */
export function PantallaConfiguracion() {
  const { puede } = useAuth()
  const [pestana, setPestana] = usePestana(PESTANAS)

  // La API ya lo impide; esto sólo evita enseñar una pantalla que fallaría.
  if (!puede()) return <Navigate to="/" replace />

  return (
    <div>
      <div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
          <p className="mt-1 text-sm text-tinta-suave">
            Datos y logo de la clínica, sillones, doctores, cuentas de acceso, plantillas de
            documento y secuencias de NCF.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <Pestanas pestanas={PESTANAS} activa={pestana} alCambiar={setPestana} />
      </div>

      <div className="mt-5">
        {pestana === "clinica" && <PanelClinica />}
        {pestana === "unidades" && <PanelUnidades />}
        {pestana === "doctores" && <PanelDoctores />}
        {pestana === "usuarios" && <PanelUsuarios />}
        {pestana === "plantillas" && <PanelPlantillas />}
        {pestana === "ncf" && <PanelSecuencias />}
      </div>
    </div>
  )
}
