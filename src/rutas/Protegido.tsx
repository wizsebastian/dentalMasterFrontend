import { ToothSpinner } from "../components/brand"
import { PantallaLogin } from "../features/auth/PantallaLogin"
import { useAuth } from "../features/auth/contexto"
import { Layout } from "./Layout"

/** Deja pasar sólo con sesión abierta; mientras se comprueba, muestra el diente. */
export function Protegido() {
  const { usuario, cargando } = useAuth()

  if (cargando) {
    return (
      <div className="grid min-h-dvh place-items-center text-marca">
        <ToothSpinner size="lg" label="Abriendo la sesión" />
      </div>
    )
  }

  return usuario ? <Layout /> : <PantallaLogin />
}
