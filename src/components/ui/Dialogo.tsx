import { useEffect, useRef, type ReactNode } from "react"
import { X } from "lucide-react"

const ANCHOS = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" } as const

/**
 * Ventana modal sobre el `<dialog>` nativo.
 *
 * `showModal()` ya atrapa el foco, cierra con Escape, devuelve el foco al
 * elemento que la abrió y deja inerte el resto de la página: nada de eso hay
 * que reimplementarlo. El contenido sólo se monta mientras está abierta, para
 * que un formulario empiece siempre limpio.
 */
export function Dialogo({
  abierto,
  alCerrar,
  titulo,
  descripcion,
  ancho = "md",
  children,
}: {
  abierto: boolean
  alCerrar: () => void
  titulo: string
  descripcion?: string
  ancho?: keyof typeof ANCHOS
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return
    if (abierto && !dialogo.open) dialogo.showModal()
    if (!abierto && dialogo.open) dialogo.close()
  }, [abierto])

  return (
    <dialog
      ref={ref}
      onClose={alCerrar}
      // Un clic en el velo cierra; uno dentro del panel no llega hasta aquí
      // como destino del evento.
      onClick={(e) => {
        if (e.target === ref.current) alCerrar()
      }}
      aria-labelledby="dialogo-titulo"
      className={`dialogo m-auto w-[calc(100%-2rem)] ${ANCHOS[ancho]} rounded-xl border
        border-linea bg-superficie p-0 text-tinta shadow-xl backdrop:bg-tinta/40`}
    >
      {abierto && (
        <div className="flex max-h-[calc(100dvh-4rem)] flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-linea px-5 py-4">
            <div>
              <h2 id="dialogo-titulo" className="text-base font-semibold">
                {titulo}
              </h2>
              {descripcion && <p className="mt-0.5 text-sm text-tinta-suave">{descripcion}</p>}
            </div>
            <button
              type="button"
              onClick={alCerrar}
              aria-label="Cerrar"
              className="-mr-1.5 rounded-lg p-1.5 text-tinta-suave transition-colors hover:bg-esmalte hover:text-tinta"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </header>
          <div className="overflow-y-auto px-5 py-5">{children}</div>
        </div>
      )}
    </dialog>
  )
}

/** Pie de un formulario dentro de un diálogo: acciones a la derecha. */
export function PieDialogo({ children }: { children: ReactNode }) {
  return <div className="mt-6 flex flex-wrap justify-end gap-2">{children}</div>
}
