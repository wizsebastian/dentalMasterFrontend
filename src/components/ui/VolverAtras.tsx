import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"

/** Vuelve al inicio desde una vista suelta, como los bancos de pruebas. */
export function VolverAtras({ a = "/", texto = "Volver" }: { a?: string; texto?: string }) {
  return (
    <Link
      to={a}
      className="inline-flex items-center gap-1.5 rounded-lg border border-linea-fuerte
        bg-superficie px-3 py-1.5 text-sm text-tinta-suave transition-colors
        hover:border-tinta-suave hover:text-tinta"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {texto}
    </Link>
  )
}
