import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react"

/* Primitivas de interfaz. Deliberadamente pocas y sin variantes de color: la
   saturación está reservada al dato clínico. */

type BotonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: "solido" | "contorno" | "plano"
}

const ESTILOS_BOTON = {
  solido: "bg-marca text-esmalte hover:bg-marca-viva",
  contorno: "border border-linea-fuerte bg-superficie hover:border-tinta-suave",
  plano: "text-tinta-suave hover:bg-marca-tenue hover:text-marca",
} as const

export function Boton({ variante = "solido", className = "", ...props }: BotonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2
        text-sm font-medium transition-colors disabled:cursor-not-allowed
        disabled:opacity-50 ${ESTILOS_BOTON[variante]} ${className}`}
      {...props}
    />
  )
}

type CampoProps = InputHTMLAttributes<HTMLInputElement> & {
  etiqueta: string
  error?: string
}

export function Campo({ etiqueta, error, className = "", id, ...props }: CampoProps) {
  const campoId = id ?? `campo-${etiqueta.toLowerCase().replace(/\s+/g, "-")}`

  return (
    <div className={className}>
      <label htmlFor={campoId} className="block text-sm font-medium">
        {etiqueta}
      </label>
      <input
        id={campoId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${campoId}-error` : undefined}
        className={`mt-1.5 block w-full rounded-lg border bg-superficie px-3 py-2 text-sm
          placeholder:text-tinta-suave/60
          ${error ? "border-tinta" : "border-linea-fuerte"}`}
        {...props}
      />
      {error && (
        <p id={`${campoId}-error`} className="mt-1.5 text-sm text-tinta">
          {error}
        </p>
      )}
    </div>
  )
}

export function Tarjeta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-linea bg-superficie ${className}`}>{children}</div>
  )
}

/** Estado vacío. Es una invitación a actuar, no un mensaje de error. */
export function Vacio({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string
  descripcion?: string
  accion?: ReactNode
}) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="font-medium">{titulo}</p>
      {descripcion && <p className="mt-1.5 text-sm text-tinta-suave">{descripcion}</p>}
      {accion && <div className="mt-5">{accion}</div>}
    </div>
  )
}

/** Error de carga, con el detalle que devolvió la API. */
export function ErrorCarga({ error, className = "" }: { error: unknown; className?: string }) {
  const mensaje = error instanceof Error ? error.message : "No se pudo cargar la información"

  return (
    <div className={`rounded-lg border border-linea-fuerte bg-superficie p-4 ${className}`}>
      <p className="text-sm font-medium">No se pudo cargar</p>
      <p className="mt-1 text-sm text-tinta-suave">{mensaje}</p>
    </div>
  )
}

export { VolverAtras } from "./VolverAtras"
