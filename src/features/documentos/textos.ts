export const TIPOS: Record<string, string> = {
  constancia: "Constancia",
  licencia: "Licencia médica",
  postoperatorio: "Cuidados postoperatorios",
  consentimiento: "Consentimiento informado",
  consentimiento_datos: "Consentimiento de datos personales",
}

/** Lo que una plantilla puede pedir. La lista la fija la API: una variable de fuera se rechaza. */
export const VARIABLES = [
  "paciente.nombre",
  "paciente.documento",
  "paciente.edad",
  "paciente.telefono",
  "doctor.nombre",
  "doctor.licencia",
  "clinica.nombre",
  "clinica.ciudad",
  "clinica.telefono",
  "fecha",
  "consulta.fecha",
  "consulta.servicios",
  "plan.codigo",
  "plan.titulo",
]
