import { useSearchParams } from "react-router-dom"

import type { Pestana } from "./Pestanas"

/**
 * Pestaña activa guardada en la URL (`?pestana=ficha`).
 *
 * Así sobrevive a una recarga, se puede enlazar y el botón de atrás vuelve a la
 * pestaña anterior en lugar de salir de la pantalla.
 */
export function usePestana<T extends string>(pestanas: readonly Pestana<T>[], parametro = "pestana") {
  const [parametros, setParametros] = useSearchParams()
  const pedida = parametros.get(parametro)
  const activa = pestanas.find((p) => p.id === pedida)?.id ?? pestanas[0].id

  function cambiar(id: T) {
    const siguientes = new URLSearchParams(parametros)
    if (id === pestanas[0].id) siguientes.delete(parametro)
    else siguientes.set(parametro, id)
    setParametros(siguientes)
  }

  return [activa, cambiar] as const
}
