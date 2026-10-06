export const METODOS = [
  { id: "efectivo", etiqueta: "Efectivo" },
  { id: "tarjeta", etiqueta: "Tarjeta" },
  { id: "transferencia", etiqueta: "Transferencia" },
  { id: "cheque", etiqueta: "Cheque" },
  { id: "seguro", etiqueta: "Seguro" },
  { id: "otro", etiqueta: "Otro" },
] as const

export type Metodo = (typeof METODOS)[number]["id"]

export function metodo(valor: string): string {
  return METODOS.find((m) => m.id === valor)?.etiqueta ?? valor
}

/** `000006`: el número de recibo se lee siempre con seis cifras. */
export function numeroDeRecibo(numero: number): string {
  return String(numero).padStart(6, "0")
}
