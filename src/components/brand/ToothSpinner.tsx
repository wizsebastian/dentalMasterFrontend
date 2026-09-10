import { useId } from "react"
import { TOOTH_PATH, TOOTH_VIEWBOX } from "./tooth-path"

const TAMANOS = {
  sm: "h-5 w-5",
  md: "h-8 w-8",
  lg: "h-12 w-12",
} as const

type ToothSpinnerProps = {
  size?: keyof typeof TAMANOS
  /** Qué se está esperando. Se anuncia a lectores de pantalla. */
  label?: string
  className?: string
}

/**
 * Indicador de carga: el molar se llena desde la raíz hacia la corona.
 *
 * No gira. Una silueta dentada rotando se lee como una mancha a 20px, y el
 * llenado además sugiere progreso en lugar de mera espera. Con
 * `prefers-reduced-motion` el relleno se queda quieto y visible.
 */
export function ToothSpinner({ size = "md", label = "Cargando", className }: ToothSpinnerProps) {
  const clipId = useId().replace(/:/g, "")

  return (
    <span role="status" aria-live="polite" className={className}>
      <svg viewBox={TOOTH_VIEWBOX} className={TAMANOS[size]} aria-hidden="true">
        <defs>
          <clipPath id={clipId}>
            <path d={TOOTH_PATH} />
          </clipPath>
        </defs>

        {/* Contorno siempre visible: el diente existe aunque el relleno no esté */}
        <path
          d={TOOTH_PATH}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.7}
          strokeLinejoin="round"
          className="text-linea-fuerte"
        />

        <g clipPath={`url(#${clipId})`}>
          <rect
            x="0"
            y="0"
            width="24"
            height="24"
            className="diente-llenado fill-marca"
          />
        </g>
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  )
}
