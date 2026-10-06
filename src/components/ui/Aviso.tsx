import { useCallback, useRef, useState, type ReactNode } from "react"
import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from "lucide-react"

import { ContextoAvisos, type Avisar } from "./avisos"

export type TonoAviso = "error" | "advertencia" | "exito" | "info"

const TONOS: Record<TonoAviso, { icono: LucideIcon; clases: string }> = {
  error: { icono: CircleAlert, clases: "border-error bg-error-tenue" },
  advertencia: { icono: TriangleAlert, clases: "border-aviso bg-aviso-tenue" },
  exito: { icono: CircleCheck, clases: "border-exito bg-exito-tenue" },
  info: { icono: Info, clases: "border-info bg-info-tenue" },
}

const COLOR_ICONO: Record<TonoAviso, string> = {
  error: "text-error",
  advertencia: "text-aviso",
  exito: "text-exito",
  info: "text-info",
}

/**
 * Mensaje dentro de la página: un error al guardar, una advertencia.
 *
 * El tono es el único sitio de la interfaz, junto con las alertas clínicas,
 * donde el chrome lleva color: borde izquierdo grueso, fondo tenue e icono. Por
 * defecto es un error, que es lo que casi siempre se muestra aquí.
 */
export function Aviso({
  children,
  className = "",
  tono = "error",
}: {
  children: ReactNode
  className?: string
  tono?: TonoAviso
}) {
  const { icono: Icono, clases } = TONOS[tono]
  return (
    <div
      role={tono === "error" || tono === "advertencia" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-lg border border-l-4 px-3 py-2 text-sm ${clases} ${className}`}
    >
      <Icono className={`mt-0.5 h-4 w-4 shrink-0 ${COLOR_ICONO[tono]}`} aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

const DURACION_MS = 4000

/**
 * Confirmaciones pasajeras («Servicio guardado»).
 *
 * Sólo para lo que salió bien: un error se queda en la página, junto a lo que
 * lo causó, hasta que se corrija.
 */
export function ProveedorAvisos({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<{ id: number; mensaje: string }[]>([])
  const siguiente = useRef(0)

  const avisar = useCallback<Avisar>((mensaje) => {
    const id = ++siguiente.current
    setAvisos((previos) => [...previos, { id, mensaje }])
    setTimeout(() => setAvisos((previos) => previos.filter((a) => a.id !== id)), DURACION_MS)
  }, [])

  return (
    <ContextoAvisos.Provider value={avisar}>
      {children}
      <div
        aria-live="polite"
        className="no-imprimir pointer-events-none fixed inset-x-0 bottom-5 z-50 flex flex-col items-center gap-2 px-4"
      >
        {avisos.map((aviso) => (
          <p
            key={aviso.id}
            className="pointer-events-auto rounded-lg bg-tinta px-4 py-2 text-sm text-esmalte shadow-lg"
          >
            {aviso.mensaje}
          </p>
        ))}
      </div>
    </ContextoAvisos.Provider>
  )
}
