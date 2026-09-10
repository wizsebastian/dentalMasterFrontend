import { Navigate, createBrowserRouter } from "react-router-dom"

import { OdontogramaEspecial } from "../features/laboratorio/OdontogramaEspecial"
import { PruebaOdontograma } from "../features/laboratorio/PruebaOdontograma"
import { ExpedientePaciente } from "../features/pacientes/ExpedientePaciente"
import { ListaPacientes } from "../features/pacientes/ListaPacientes"
import { Protegido } from "./Protegido"

export const router = createBrowserRouter([
  // Banco de pruebas de la representación del odontograma. Va fuera de la
  // sesión a propósito: no lee ni escribe datos de ningún paciente.
  { path: "/odontogram", element: <PruebaOdontograma /> },
  { path: "/odontogram-especial", element: <OdontogramaEspecial /> },
  {
    path: "/",
    element: <Protegido />,
    children: [
      { index: true, element: <Navigate to="/pacientes" replace /> },
      { path: "pacientes", element: <ListaPacientes /> },
      { path: "pacientes/:id", element: <ExpedientePaciente /> },
    ],
  },
])
