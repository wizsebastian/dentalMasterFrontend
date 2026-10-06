import { Navigate, createBrowserRouter } from "react-router-dom"

import { PantallaDocumento, PantallaReceta } from "../features/documentos/PantallaDocumento"
import { PantallaFirmar } from "../features/documentos/PantallaFirmar"
import { PantallaAgenda } from "../features/agenda/PantallaAgenda"
import { PantallaCaja } from "../features/caja/PantallaCaja"
import { PantallaRecibo } from "../features/caja/PantallaRecibo"
import { PantallaCatalogo } from "../features/catalogo/PantallaCatalogo"
import { PantallaFactura } from "../features/fiscal/PantallaFactura"
import { PantallaConfiguracion } from "../features/configuracion/PantallaConfiguracion"
import { PantallaPlan } from "../features/historial/PantallaPlan"
import { PantallaGastos } from "../features/gastos/PantallaGastos"
import { PantallaInformes } from "../features/informes/PantallaInformes"
import { PantallaMiProduccion } from "../features/informes/PantallaMiProduccion"
import { PantallaInicio } from "../features/inicio/PantallaInicio"
import { PantallaBienvenida } from "../features/onboarding/PantallaBienvenida"
import { PantallaListo } from "../features/onboarding/PantallaListo"
import { PantallaPaso } from "../features/onboarding/PantallaPaso"
import { PantallaInventario } from "../features/inventario/PantallaInventario"
import { ExpedientePaciente } from "../features/pacientes/ExpedientePaciente"
import { ListaPacientes } from "../features/pacientes/ListaPacientes"
import { BancoArcada, BancoLibreria } from "./bancos-de-pruebas"
import { Protegido } from "./Protegido"

export const router = createBrowserRouter([
  // Bancos de pruebas de la representación del odontograma. Van fuera de la
  // sesión a propósito: no leen ni escriben datos de ningún paciente.
  { path: "/odontogram", element: <BancoArcada /> },
  { path: "/odontogram-especial", element: <BancoLibreria /> },
  // Firma de un documento por enlace. Fuera de la sesión: quien firma no entra
  // a la aplicación; el enlace sólo abre ese documento.
  { path: "/firmar/:token", element: <PantallaFirmar /> },
  {
    path: "/",
    element: <Protegido />,
    children: [
      { index: true, element: <Navigate to="/inicio" replace /> },
      { path: "inicio", element: <PantallaInicio /> },
      { path: "bienvenida", element: <PantallaBienvenida /> },
      { path: "bienvenida/listo", element: <PantallaListo /> },
      { path: "bienvenida/:paso", element: <PantallaPaso /> },
      { path: "agenda", element: <PantallaAgenda /> },
      { path: "pacientes", element: <ListaPacientes /> },
      { path: "pacientes/:id", element: <ExpedientePaciente /> },
      { path: "pacientes/:id/planes/:planId", element: <PantallaPlan /> },
      { path: "caja", element: <PantallaCaja /> },
      { path: "recibos/:id", element: <PantallaRecibo /> },
      { path: "facturas/:id", element: <PantallaFactura /> },
      { path: "documentos/:id", element: <PantallaDocumento /> },
      { path: "pacientes/:id/recetas/:recetaId", element: <PantallaReceta /> },
      { path: "gastos", element: <PantallaGastos /> },
      { path: "informes", element: <PantallaInformes /> },
      { path: "mi-produccion", element: <PantallaMiProduccion /> },
      { path: "inventario", element: <PantallaInventario /> },
      { path: "catalogo", element: <PantallaCatalogo /> },
      { path: "configuracion", element: <PantallaConfiguracion /> },
    ],
  },
])
