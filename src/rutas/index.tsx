import { Navigate, createBrowserRouter } from "react-router-dom"

import { ExpedientePaciente } from "../features/pacientes/ExpedientePaciente"
import { ListaPacientes } from "../features/pacientes/ListaPacientes"
import { Protegido } from "./Protegido"

export const router = createBrowserRouter([
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
