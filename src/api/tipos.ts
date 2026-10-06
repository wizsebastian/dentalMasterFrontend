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

export type CondicionMedica = Esquemas["CondicionMedicaCatalogo"]
export type Alergia = Esquemas["AlergiaCatalogo"]
export type EstadoCita = Esquemas["EstadoCitaLeer"]

export type Servicio = Esquemas["ServicioLeer"]
export type ServicioCrear = Esquemas["ServicioCrear"]
export type ServicioActualizar = Esquemas["ServicioActualizar"]
export type Categoria = Esquemas["CategoriaLeer"]
export type ListaPrecio = Esquemas["ListaPrecioLeer"]

export type Especialidad = Esquemas["EspecialidadLeer"]
export type Unidad = Esquemas["UnidadLeer"]
export type UnidadCrear = Esquemas["UnidadCrear"]
export type UnidadActualizar = Esquemas["UnidadActualizar"]
export type Doctor = Esquemas["DoctorLeer"]
export type DoctorCrear = Esquemas["DoctorCrear"]
export type DoctorActualizar = Esquemas["DoctorActualizar"]
export type Usuario = Esquemas["UsuarioLeer"]
export type UsuarioCrear = Esquemas["UsuarioCrear"]
export type UsuarioActualizar = Esquemas["UsuarioActualizar"]

export type Cita = Esquemas["CitaLeer"]
export type CitaDetalle = Esquemas["CitaDetalle"]
export type CitaCrear = Esquemas["CitaCrear"]
export type CitaActualizar = Esquemas["CitaActualizar"]
export type ValorEstadoCita = Esquemas["EstadoCita"]
export type Clinica = Esquemas["ClinicaLeer"]

export type Historial = Esquemas["Historial"]
export type Plan = Esquemas["PlanLeer"]
export type PlanConConsultas = Esquemas["PlanConConsultas"]
export type PlanCrear = Esquemas["PlanCrear"]
export type PlanActualizar = Esquemas["PlanActualizar"]
export type PlanItem = Esquemas["ItemLeer"]
export type ItemEscribir = Esquemas["ItemEscribir"]
export type ValorEstadoPlan = Esquemas["EstadoPlan"]
export type Consulta = Esquemas["ConsultaLeer"]
export type ConsultaCrear = Esquemas["ConsultaCrear"]
export type ConsultaActualizar = Esquemas["ConsultaActualizar"]
export type Linea = Esquemas["LineaLeer"]
export type LineaEscribir = Esquemas["LineaEscribir"]

export type EstadoDeCuenta = Esquemas["EstadoDeCuenta"]
export type Pago = Esquemas["PagoLeer"]
export type PagoConPaciente = Esquemas["PagoConPaciente"]
export type PagoCrear = Esquemas["PagoCrear"]
export type Recibo = Esquemas["Recibo"]
export type CuentasPorCobrar = Esquemas["CuentasPorCobrar"]
export type CuentaPorCobrar = Esquemas["CuentaPorCobrar"]
export type Caja = Esquemas["Caja"]

export type Plantilla = Esquemas["PlantillaLeer"]
export type Borrador = Esquemas["Borrador"]
export type Documento = Esquemas["DocumentoLeer"]
export type DocumentoCrear = Esquemas["DocumentoCrear"]
export type DocumentosDelPaciente = Esquemas["DocumentosDelPaciente"]
export type DocumentoParaFirmar = Esquemas["DocumentoParaFirmar"]
export type Receta = Esquemas["RecetaLeer"]
export type RecetaCrear = Esquemas["RecetaCrear"]

export type Gastos = Esquemas["Gastos"]
export type Gasto = Esquemas["GastoLeer"]
export type GastoCrear = Esquemas["GastoCrear"]
export type Nombre = Esquemas["NombreLeer"]
export type Inventario = Esquemas["Inventario"]
export type Insumo = Esquemas["InsumoLeer"]
export type InsumoCrear = Esquemas["InsumoCrear"]
export type InsumoActualizar = Esquemas["InsumoActualizar"]
export type Movimiento = Esquemas["MovimientoLeer"]
export type MovimientoCrear = Esquemas["MovimientoCrear"]
export type RecetaInsumo = Esquemas["RecetaInsumoLeer"]
export type Resumen = Esquemas["Resumen"]


export type ArchivoClinico = Esquemas["ArchivoClinicoLeer"]
export type Archivo = Esquemas["ArchivoLeer"]
export type TipoArchivo = NonNullable<Esquemas["ArchivoClinicoActualizar"]["tipo"]>

export type Implante = Esquemas["ImplanteLeer"]
export type ImplanteCrear = Esquemas["ImplanteCrear"]
export type ImplanteConPaciente = Esquemas["ImplanteConPaciente"]
export type EventoImplanteCrear = Esquemas["EventoCrear"]
export type SistemaImplante = Esquemas["SistemaLeer"]
export type ValorEstadoImplante = Esquemas["EstadoImplante"]

export type Factura = Esquemas["FacturaLeer"]
export type FacturaImprimible = Esquemas["FacturaImprimible"]
export type FacturaCrear = Esquemas["FacturaCrear"]
export type FacturasDelPaciente = Esquemas["FacturasDelPaciente"]
export type SecuenciaNcf = Esquemas["SecuenciaLeer"]
export type SecuenciaNcfCrear = Esquemas["SecuenciaCrear"]
export type CajaDelDia = Esquemas["CajaDelDia"]
export type CierreCaja = Esquemas["CierreLeer"]

export type ResumenClinico = Esquemas["ResumenClinico"]
export type Seguro = Esquemas["SeguroLeer"]
export type SeguroEscribir = Esquemas["SeguroEscribir"]
export type Aseguradora = Esquemas["AseguradoraLeer"]
export type ListaPrecioCrear = Esquemas["ListaPrecioCrear"]
export type ItemActualizar = Esquemas["ItemActualizar"]

export type ReporteDoctor = Esquemas["ReporteDoctor"]

export type Onboarding = Esquemas["OnboardingLeer"]
export type PasoOnboarding = Esquemas["PasoLeer"]
