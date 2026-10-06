export const TIPOS_NCF = [
  { id: "B02", etiqueta: "Consumo", ayuda: "Para el paciente como consumidor final" },
  { id: "B01", etiqueta: "Crédito fiscal", ayuda: "Para una empresa o un profesional con RNC" },
  { id: "B14", etiqueta: "Régimen especial", ayuda: "Zonas francas y exentos" },
  { id: "B15", etiqueta: "Gubernamental", ayuda: "Instituciones del Estado" },
] as const

export type TipoNcf = (typeof TIPOS_NCF)[number]["id"]

export function tipoNcf(valor: string | null | undefined): string {
  return TIPOS_NCF.find((t) => t.id === valor)?.etiqueta ?? valor ?? "Comprobante"
}
