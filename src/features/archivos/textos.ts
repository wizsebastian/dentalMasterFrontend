import type { TipoArchivo } from "../../api/tipos"

export const TIPOS_ARCHIVO: Record<TipoArchivo, string> = {
  foto: "Fotografía",
  radiografia_periapical: "Radiografía periapical",
  panoramica: "Panorámica",
  cbct: "Tomografía (CBCT)",
  laboratorio: "Laboratorio",
  otro: "Otro",
}

export function tipoArchivo(valor: string): string {
  return TIPOS_ARCHIVO[valor as TipoArchivo] ?? valor
}

/** Lo que el servidor acepta; el tipo real lo decide él por el contenido. */
export const ACEPTA = "image/jpeg,image/png,image/webp,application/pdf"

/** `1.4 MB` */
export function peso(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
