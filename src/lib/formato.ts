/**
 * Un solo formato para cada tipo de dato, en toda la aplicación.
 *
 * Todo sale de `Intl` con `es-DO`: no hay librería de fechas. Las funciones
 * aceptan `null` y devuelven una raya, para que las tablas no tengan que
 * comprobarlo celda a celda.
 */

const LOCAL = "es-DO"
const VACIO = "—"

/**
 * Una fecha ISO sin hora (`2026-10-03`) es un día de calendario, no un instante.
 * `new Date("2026-10-03")` la leería como medianoche UTC y en Santo Domingo
 * caería en el día anterior, así que se construye en hora local.
 */
function aFecha(valor: string | Date): Date {
  if (valor instanceof Date) return valor
  const soloDia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor)
  if (soloDia) return new Date(Number(soloDia[1]), Number(soloDia[2]) - 1, Number(soloDia[3]))
  return new Date(valor)
}

const FECHA = new Intl.DateTimeFormat(LOCAL, { day: "numeric", month: "short", year: "numeric" })
const FECHA_LARGA = new Intl.DateTimeFormat(LOCAL, {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
})
const HORA = new Intl.DateTimeFormat(LOCAL, { hour: "numeric", minute: "2-digit", hour12: true })
const IMPORTE = new Intl.NumberFormat(LOCAL, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const NUMERO = new Intl.NumberFormat(LOCAL, { maximumFractionDigits: 2 })

/** `3 oct de 2026` */
export function fecha(valor: string | Date | null | undefined): string {
  return valor ? FECHA.format(aFecha(valor)) : VACIO
}

/** `sábado, 3 de octubre de 2026` */
export function fechaLarga(valor: string | Date | null | undefined): string {
  return valor ? FECHA_LARGA.format(aFecha(valor)) : VACIO
}

/** `7:19 p. m.` */
export function hora(valor: string | Date | null | undefined): string {
  return valor ? HORA.format(aFecha(valor)) : VACIO
}

/**
 * `RD$ 1,500.00`. Acepta el `Decimal` de la API, que llega como texto.
 *
 * El símbolo se escribe aquí y no se le pide a `Intl`: según el navegador, DOP
 * sale como `$`, `RD$` o `DOP`, y una clínica no puede enseñar tres monedas.
 */
export function moneda(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined || valor === "") return VACIO
  const importe = Number(valor)
  if (!Number.isFinite(importe)) return VACIO
  return `${importe < 0 ? "−" : ""}RD$ ${IMPORTE.format(Math.abs(importe))}`
}

export function numero(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined || valor === "") return VACIO
  const n = Number(valor)
  return Number.isFinite(n) ? NUMERO.format(n) : VACIO
}

/**
 * Los diez dígitos de un teléfono dominicano, sin el 1 de país si lo trae.
 * `null` si no son diez: no se inventa un número.
 */
function diezDigitos(valor: string): string | null {
  const digitos = valor.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "")
  return digitos.length === 10 ? digitos : null
}

/**
 * La máscara mientras se escribe: `(809) 555-0100`. Admite lo que se vaya
 * teclando o pegando (`8095550100`, `+1 809 555 0100`) y recorta a diez dígitos.
 */
export function mascaraTelefono(valor: string): string {
  let digitos = valor.replace(/\D/g, "")
  if (digitos.length > 10 && digitos.startsWith("1")) digitos = digitos.slice(1)
  digitos = digitos.slice(0, 10)
  if (digitos.length === 0) return ""
  if (digitos.length <= 3) return `(${digitos}`
  if (digitos.length <= 6) return `(${digitos.slice(0, 3)}) ${digitos.slice(3)}`
  return `(${digitos.slice(0, 3)}) ${digitos.slice(3, 6)}-${digitos.slice(6)}`
}

/**
 * `(809) 555-0100`, así se enseña y así se guarda. Lo que no tenga diez dígitos
 * se muestra tal cual, sin inventar un formato.
 */
export function telefono(valor: string | null | undefined): string {
  if (!valor) return VACIO
  const digitos = diezDigitos(valor)
  return digitos ? mascaraTelefono(digitos) : valor
}

/** Sólo los dígitos con prefijo de país, para `tel:` y `wa.me`. */
export function telefonoInternacional(valor: string | null | undefined): string | null {
  if (!valor) return null
  const digitos = valor.replace(/\D/g, "")
  if (digitos.length === 10) return `1${digitos}`
  if (digitos.length === 11 && digitos.startsWith("1")) return digitos
  return null
}

export function edad(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return VACIO
  return valor === 1 ? "1 año" : `${valor} años`
}

const SEXO: Record<string, string> = { F: "Femenino", M: "Masculino", O: "Otro" }

export function sexo(valor: string | null | undefined): string {
  return valor ? (SEXO[valor] ?? valor) : VACIO
}

const ROL: Record<string, string> = {
  admin: "Administración",
  doctor: "Doctor",
  asistente: "Asistente",
  recepcion: "Recepción",
  facturacion: "Facturación",
}

export function rol(valor: string | null | undefined): string {
  return valor ? (ROL[valor] ?? valor) : VACIO
}

/** «Dra.» no se puede deducir de un nombre: el tratamiento es siempre neutro. */
export function doctor(nombre: string | null | undefined): string {
  return nombre ? `Dr(a). ${nombre}` : VACIO
}
