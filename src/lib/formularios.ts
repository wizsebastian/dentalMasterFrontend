import type { FieldValues, Path, UseFormSetError } from "react-hook-form"

import { ApiError } from "../api/client"

/**
 * Lleva al formulario los errores que devolvió la API.
 *
 * Los de validación con campo conocido se pintan junto a su control; devuelve
 * el mensaje general para lo demás (un 409, un campo que el formulario no
 * tiene), o `null` si todo quedó repartido por campos.
 */
export function aplicarErrorApi<T extends FieldValues>(
  fallo: unknown,
  setError: UseFormSetError<T>,
  campos: readonly Path<T>[],
): string | null {
  if (!(fallo instanceof ApiError)) return "No se pudo conectar con el servidor"

  let pintados = 0
  for (const [campo, mensaje] of Object.entries(fallo.campos)) {
    if ((campos as readonly string[]).includes(campo)) {
      setError(campo as Path<T>, { message: mensaje })
      pintados++
    }
  }

  const total = Object.keys(fallo.campos).length
  return total > 0 && pintados === total ? null : fallo.detail
}

/** Un campo de texto vacío viaja como `null`, no como cadena vacía. */
export function oNulo(valor: string | null | undefined): string | null {
  const limpio = valor?.trim()
  return limpio ? limpio : null
}

/** Un `<select>` o un numérico sin elegir viaja como `null`. */
export function numeroONulo(valor: string | number | null | undefined): number | null {
  if (valor === "" || valor === null || valor === undefined) return null
  const n = Number(valor)
  return Number.isFinite(n) ? n : null
}
