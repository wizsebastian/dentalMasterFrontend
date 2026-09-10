import { ISOTIPOS, type VersionIsotipo } from "./isotipos"

const TAMANOS = {
  sm: { caja: "h-8 w-8", radio: "rounded-lg" },
  md: { caja: "h-14 w-14", radio: "rounded-xl" },
  lg: { caja: "h-24 w-24", radio: "rounded-2xl" },
} as const

/** Duración de la vuelta completa. Cada versión ocupa la misma fracción. */
const CICLO_MS = 4200

type CargandoProps = {
  size?: keyof typeof TAMANOS
  /** Qué se está esperando. Se anuncia a lectores de pantalla. */
  label?: string
  /** Qué versiones se relevan. Por defecto, las seis. */
  versiones?: VersionIsotipo[]
  className?: string
}

/**
 * Indicador de carga: las seis versiones del isotipo se relevan.
 *
 * Todas ocupan exactamente el mismo tiempo —el retardo de cada una es su
 * posición dividida entre el total— y se solapan lo justo para fundirse.
 *
 * La versión positiva es blanca, así que lleva su propio fondo azul marino: es
 * la única forma de que se vea sin romper el manual de marca.
 */
export function Cargando({
  size = "md",
  label = "Cargando",
  versiones = ISOTIPOS,
  className,
}: CargandoProps) {
  const medida = TAMANOS[size]

  return (
    <span role="status" aria-live="polite" className={`inline-flex ${className ?? ""}`}>
      <span className={`relative block ${medida.caja}`}>
        {versiones.map((version, indice) => (
          <span
            key={version.archivo}
            className={`isotipo-relevo absolute inset-0 grid place-items-center ${medida.radio}
              ${version.fondo === "oscuro" ? "bg-marca" : ""}`}
            style={{
              animationDuration: `${CICLO_MS}ms`,
              animationDelay: `${(indice * CICLO_MS) / versiones.length}ms`,
              opacity: 0,
            }}
          >
            <img
              src={version.archivo}
              alt=""
              aria-hidden
              className={version.fondo === "oscuro" ? "h-[70%] w-auto" : "h-full w-auto"}
            />
          </span>
        ))}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  )
}
