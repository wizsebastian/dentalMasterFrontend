import { ISOTIPOS } from "./isotipos"

const TAMANOS = { sm: "h-6", md: "h-9", lg: "h-14" } as const

type IsotipoProps = {
  /** Índice en `ISOTIPOS`; por defecto la versión principal. */
  version?: number
  size?: keyof typeof TAMANOS
  className?: string
}

/** El isotipo suelto: la G cuya contraforma es un molar. */
export function Isotipo({ version = 0, size = "md", className }: IsotipoProps) {
  const elegido = ISOTIPOS[version] ?? ISOTIPOS[0]

  return (
    <img
      src={elegido.archivo}
      alt=""
      aria-hidden
      className={`${TAMANOS[size]} w-auto ${className ?? ""}`}
    />
  )
}
