import { useState } from "react"

import { Casilla, Insignia } from "../../components/ui"
import { ListaEditable } from "./ListaEditable"
import { useBorrarEspecialidad, useEspecialidades, useGuardarEspecialidad } from "./consultas"

function uso(planes: number, doctores: number): string {
  if (planes === 0 && doctores === 0) return "Sin uso"
  const partes = []
  if (planes > 0) partes.push(planes === 1 ? "1 plan" : `${planes} planes`)
  if (doctores > 0) partes.push(doctores === 1 ? "1 doctor" : `${doctores} doctores`)
  return partes.join(" · ")
}

/** Con qué especialidad se abre un plan de tratamiento. No llevan precio. */
export function PanelEspecialidades({ edita }: { edita: boolean }) {
  const [inactivas, setInactivas] = useState(false)
  const { data, isPending, error } = useEspecialidades(inactivas)
  const guardar = useGuardarEspecialidad()
  const borrar = useBorrarEspecialidad()

  return (
    <div>
      <p className="max-w-3xl text-sm text-tinta-suave">
        Con una especialidad se abre el plan de tratamiento de un paciente. No llevan precio: el
        precio lo ponen los servicios que se registran en cada consulta.
      </p>
      <Casilla
        className="mt-4"
        etiqueta="Mostrar inactivas"
        checked={inactivas}
        onChange={(e) => setInactivas(e.target.checked)}
      />
      <div className="mt-4">
        <ListaEditable
          elementos={data}
          cargando={isPending}
          error={error}
          edita={edita}
          nombreSingular="especialidad"
          placeholder="Operatoria"
          detalle={(e) => (
            <>
              {uso(e.planes, e.doctores)}
              {!e.activo && <Insignia className="ml-2">Inactiva</Insignia>}
            </>
          )}
          extra={(e) => (
            <button
              type="button"
              onClick={() => guardar.mutate({ id: e.id, activo: !e.activo })}
              className="rounded-lg px-2 py-1 text-xs text-tinta-suave hover:bg-marca-tenue hover:text-marca"
            >
              {e.activo ? "Desactivar" : "Activar"}
            </button>
          )}
          puedeBorrar={(e) => e.planes === 0 && e.doctores === 0}
          motivoNoBorrar="Tiene planes o doctores: desactívala"
          alGuardar={(datos) => guardar.mutateAsync(datos)}
          alBorrar={(id) => borrar.mutateAsync(id)}
          vacio="Todavía no hay especialidades"
        />
      </div>
    </div>
  )
}
