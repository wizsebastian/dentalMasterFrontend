import { Pestanas, usePestana } from "../../components/ui"
import { useAuth } from "../auth/contexto"
import { PanelCategorias } from "./PanelCategorias"
import { PanelEspecialidades } from "./PanelEspecialidades"
import { PanelServicios } from "./PanelServicios"
import { PanelTarifas } from "./PanelTarifas"

const PESTANAS = [
  { id: "servicios", etiqueta: "Servicios y precios" },
  { id: "tarifas", etiqueta: "Tarifas" },
  { id: "categorias", etiqueta: "Categorías" },
  { id: "especialidades", etiqueta: "Especialidades" },
] as const

/**
 * Lo que la clínica ofrece y a qué precio.
 *
 * Lo consulta cualquiera; lo edita sólo administración, porque un precio
 * cambiado afecta a todos los planes y consultas que se abran después.
 */
export function PantallaCatalogo() {
  const { puede } = useAuth()
  const [pestana, setPestana] = usePestana(PESTANAS)
  const edita = puede()

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Catálogo</h1>
      <p className="mt-1 text-sm text-tinta-suave">
        Servicios de la clínica, su precio en cada tarifa y las especialidades con las que se
        abren los planes de tratamiento.
      </p>

      <div className="mt-6">
        <Pestanas pestanas={PESTANAS} activa={pestana} alCambiar={setPestana} />
      </div>

      <div className="mt-5">
        {pestana === "servicios" && <PanelServicios edita={edita} />}
        {pestana === "tarifas" && <PanelTarifas edita={edita} />}
        {pestana === "categorias" && <PanelCategorias edita={edita} />}
        {pestana === "especialidades" && <PanelEspecialidades edita={edita} />}
      </div>
    </div>
  )
}
