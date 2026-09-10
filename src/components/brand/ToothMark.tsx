import { TOOTH_PATH, TOOTH_VIEWBOX } from "./tooth-path"

type ToothMarkProps = {
  /** `outline` acompaña a los iconos de lucide; `solid` es para el logo. */
  variant?: "outline" | "solid"
  className?: string
  title?: string
}

/** El molar de la marca. Hereda el color del texto mediante `currentColor`. */
export function ToothMark({ variant = "outline", className, title }: ToothMarkProps) {
  const solido = variant === "solid"
  return (
    <svg
      viewBox={TOOTH_VIEWBOX}
      className={className}
      fill={solido ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={solido ? 0 : 1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <path d={TOOTH_PATH} />
    </svg>
  )
}
