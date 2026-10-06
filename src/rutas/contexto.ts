import { useOutletContext } from "react-router-dom"

import type { CitaInicial } from "../features/agenda/DialogoCita"

export type ContextoLayout = {
  nuevoPaciente: () => void
  /** Abre el formulario de cita del marco, el mismo de `F2`. Con `cita`, la edita. */
  abrirCita: (inicial?: CitaInicial) => void
}

/** Para que una pantalla abra los diálogos del marco en lugar de duplicarlos. */
export function useLayout(): ContextoLayout {
  return useOutletContext<ContextoLayout>()
}
