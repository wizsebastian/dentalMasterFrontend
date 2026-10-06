import { ListaEditable } from "./ListaEditable"
import { useBorrarCategoria, useCategorias, useGuardarCategoria } from "./consultas"

/** Las categorías son un catálogo, no texto libre: no caben dos con el mismo nombre. */
export function PanelCategorias({ edita }: { edita: boolean }) {
  const { data, isPending, error } = useCategorias()
  const guardar = useGuardarCategoria()
  const borrar = useBorrarCategoria()

  return (
    <ListaEditable
      elementos={data}
      cargando={isPending}
      error={error}
      edita={edita}
      nombreSingular="categoría"
      placeholder="Blanqueamiento"
      detalle={(c) => (c.servicios === 1 ? "1 servicio" : `${c.servicios} servicios`)}
      puedeBorrar={(c) => c.servicios === 0}
      motivoNoBorrar="Tiene servicios: muévelos a otra categoría antes"
      alGuardar={(datos) => guardar.mutateAsync(datos)}
      alBorrar={(id) => borrar.mutateAsync(id)}
      vacio="Todavía no hay categorías"
    />
  )
}
