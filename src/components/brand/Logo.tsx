import { LOGOTIPOS } from "./isotipos"

type LogoProps = {
  /** `blanco` para cabeceras oscuras. */
  variante?: "color" | "blanco"
  className?: string
}

/** Logotipo completo: isotipo, filete malva y firma. */
export function Logo({ variante = "color", className }: LogoProps) {
  return (
    <img
      src={variante === "blanco" ? LOGOTIPOS.blanco : LOGOTIPOS.color}
      alt="Dr. Gabriel Martínez, implantólogo"
      className={`h-10 w-auto ${className ?? ""}`}
    />
  )
}
