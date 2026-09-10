import { Navigate, createBrowserRouter } from "react-router-dom"

import { ExpedientePaciente } from "../features/pacientes/ExpedientePaciente"
import { ListaPacientes } from "../features/pacientes/ListaPacientes"
import { BancoArcada, BancoLibreria } from "./bancos-de-pruebas"
import { Protegido } from "./Protegido"

export const router = createBrowserRouter([
  // Bancos de pruebas de la representación del odontograma. Van fuera de la
  // sesión a propósito: no leen ni escriben datos de ningún paciente.
  { path: "/odontogram", element: <BancoArcada /> },
  { path: "/odontogram-especial", element: <BancoLibreria /> },
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
