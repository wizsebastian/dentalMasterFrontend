/**
 * Aritmética de calendario de la agenda.
 *
 * Todo en la hora local del navegador: la clínica y quien agenda están en la
 * misma zona. A la API viaja siempre el instante con su desfase.
 */

/** La rejilla va de las 7:00 a las 21:00. */
export const HORA_INICIO = 7
export const HORA_FIN = 21
export const MINUTOS_REJILLA = (HORA_FIN - HORA_INICIO) * 60

export function inicioDelDia(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
}

export function sumarDias(fecha: Date, dias: number): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + dias)
}

/** La semana empieza el lunes: el domingo, que no se atiende, queda al final. */
export function inicioDeSemana(fecha: Date): Date {
  const dia = (fecha.getDay() + 6) % 7
  return sumarDias(fecha, -dia)
}

export function mismoDia(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  )
}

const DOS = (n: number) => String(n).padStart(2, "0")

/** `2026-10-03`, para `<input type="date">` y para claves. */
export function aFechaISO(fecha: Date): string {
  return `${fecha.getFullYear()}-${DOS(fecha.getMonth() + 1)}-${DOS(fecha.getDate())}`
}

/** `14:30`, para `<input type="time">`. */
export function aHoraISO(fecha: Date): string {
  return `${DOS(fecha.getHours())}:${DOS(fecha.getMinutes())}`
}

/** Une lo que dan los dos campos del formulario en un instante local. */
export function unirFechaHora(fecha: string, hora: string): Date {
  const [anio, mes, dia] = fecha.split("-").map(Number)
  const [h, m] = hora.split(":").map(Number)
  return new Date(anio, mes - 1, dia, h, m)
}

export function minutosEntre(inicio: string | Date, fin: string | Date): number {
  return Math.round((new Date(fin).getTime() - new Date(inicio).getTime()) / 60000)
}

/** Minutos desde el borde superior de la rejilla. */
export function minutosDesdeApertura(momento: Date): number {
  return (momento.getHours() - HORA_INICIO) * 60 + momento.getMinutes()
}

const DIA_CORTO = new Intl.DateTimeFormat("es-DO", { weekday: "short" })
const MES_CORTO = new Intl.DateTimeFormat("es-DO", { month: "short" })
const MES_LARGO = new Intl.DateTimeFormat("es-DO", { month: "long", year: "numeric" })

export function diaCorto(fecha: Date): string {
  return DIA_CORTO.format(fecha).replace(".", "")
}

/** `28 sept – 4 oct 2026`, o `3 de octubre de 2026` si el tramo es un día. */
export function rotuloDeTramo(desde: Date, dias: number): string {
  if (dias === 1) {
    return new Intl.DateTimeFormat("es-DO", { dateStyle: "full" }).format(desde)
  }
  const hasta = sumarDias(desde, dias - 1)
  if (desde.getMonth() === hasta.getMonth()) {
    return `${desde.getDate()} – ${hasta.getDate()} de ${MES_LARGO.format(hasta)}`
  }
  const mes = (f: Date) => MES_CORTO.format(f).replace(".", "")
  return `${desde.getDate()} ${mes(desde)} – ${hasta.getDate()} ${mes(hasta)} ${hasta.getFullYear()}`
}
