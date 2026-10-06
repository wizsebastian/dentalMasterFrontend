import { useState } from "react"
import { Printer } from "lucide-react"
import { Navigate } from "react-router-dom"

import { Boton } from "../../components/ui"
import { useAuth } from "../auth/contexto"
import { ReporteDoctor } from "./ReporteDoctor"
import { SelectorTramo } from "./SelectorTramo"
import { esteMes } from "./tramos"

/** El reporte del doctor que ha iniciado sesión: el suyo, y sólo el suyo. */
export function PantallaMiProduccion() {
  const { usuario } = useAuth()
  const [tramo, setTramo] = useState(esteMes)

  // Una cuenta sin doctor asociado no tiene producción que enseñar.
  if (!usuario?.doctor_id) return <Navigate to="/" replace />

  return (
    <div>
      <div className="no-imprimir">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Mi producción</h1>
            <p className="mt-1 text-sm text-tinta-suave">
              Lo que hiciste, lo que se cobró por ello y lo que te corresponde.
            </p>
          </div>
          <Boton variante="contorno" onClick={() => window.print()}>
            <Printer className="h-4 w-4" aria-hidden />
            Imprimir
          </Boton>
        </div>
        <div className="mt-5">
          <SelectorTramo tramo={tramo} alCambiar={setTramo} />
        </div>
      </div>

      <ReporteDoctor doctorId={usuario.doctor_id} tramo={tramo} />
    </div>
  )
}
