/**
 * Alias sobre los tipos generados en `schema.d.ts`.
 *
 * Ese archivo se regenera con `npm run gen:api` y no se edita a mano. Aquí sólo
 * se le ponen nombres cortos a lo que el resto de la app usa, de modo que un
 * cambio de forma en la API rompa la compilación en un sitio y no en veinte.
 */
import type { components } from "./schema"

type Esquemas = components["schemas"]

export type UsuarioActual = Esquemas["UsuarioActual"]
export type Tokens = Esquemas["Tokens"]
export type RolUsuario = Esquemas["RolUsuario"]

export type PacienteResumen = Esquemas["PacienteResumen"]
export type PacienteDetalle = Esquemas["PacienteDetalle"]
export type PacienteCrear = Esquemas["PacienteCrear"]
export type PacienteActualizar = Esquemas["PacienteActualizar"]
export type PaginaPacientes = Esquemas["Pagina_PacienteResumen_"]
export type Alerta = Esquemas["Alerta"]

export type Ficha = Esquemas["FichaLeer"]
export type FichaGuardar = Esquemas["FichaGuardar"]

export type Catalogos = Esquemas["Catalogos"]
export type Diente = Esquemas["DienteLeer"]
export type Superficie = Esquemas["SuperficieLeer"]
export type CondicionDental = Esquemas["CondicionDentalLeer"]

export type Odontograma = Esquemas["OdontogramaLeer"]
export type OdontogramaResumen = Esquemas["OdontogramaResumen"]
export type Hallazgo = Esquemas["HallazgoLeer"]
export type HallazgoCrear = Esquemas["HallazgoCrear"]
export type EstadoHallazgo = Esquemas["EstadoHallazgo"]
// FastAPI emite dos variantes porque el Decimal de sondaje/recesión se
// serializa distinto al leer que al escribir.
export type DienteEstado = Esquemas["DienteEstado-Output"]
export type DienteEstadoEscribir = Esquemas["DienteEstado-Input"]
