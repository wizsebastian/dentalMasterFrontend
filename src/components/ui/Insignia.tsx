import type { CSSProperties, ReactNode } from "react"

/**
 * Etiqueta de estado.
 *
 * Sin `color` es acromática, como el resto de la interfaz. Con `color` toma el
 * tono que le llega **del catálogo de la API** —nunca uno escrito a mano— y lo
 * usa apagado: texto y borde en ese tono, fondo casi blanco. Así un estado se
 * distingue sin competir con los colores del odontograma.
 */
export function Insignia({
  children,
  color,
  className = "",
}: {
  children: ReactNode
  color?: string
  className?: string
}) {
  const estilo: CSSProperties | undefined = color
    ? {
        color,
        borderColor: `color-mix(in srgb, ${color} 35%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${color} 8%, transparent)`,
      }
    : undefined

  return (
    <span
      style={estilo}
      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-medium
        ${color ? "" : "border-linea-fuerte text-tinta-suave"} ${className}`}
    >
      {children}
    </span>
  )
}
