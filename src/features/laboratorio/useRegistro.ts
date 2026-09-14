import { useCallback, useState } from "react"

import type { Notacion } from "./notaciones"

/**
 * Lo que se ha ido marcando en el odontograma, en orden de registro.
 *
 * Es el único sitio donde vive la lista: el motor de la librería sabe el estado
 * de cada pieza, pero sólo lo devuelve como texto ya traducido
 * (`getToothStateSummary`), sin forma de saber qué llamada lo puso ahí. Sin eso
 * no se puede quitar una notación concreta, sólo reiniciar el diente entero.
 *
 * Como el registro sólo se llena desde el menú, y ni el registro ni el lienzo
 * sobreviven a una recarga, los dos se mantienen en el mismo estado.
 */

export type Anotacion = {
  id: string
  /** Piezas sobre las que se aplicó, en el momento de aplicarla. */
  piezas: number[]
  notacion: Notacion
  /** Cara, si la notación es de superficie. */
  cara?: string
  /** Valor elegido, si la notación tenía varios. */
  valor?: string
  etiquetaValor?: string
  cuando: string
}

let secuencia = 0

export function useRegistro() {
  const [anotaciones, setAnotaciones] = useState<Anotacion[]>([])

  const registrar = useCallback(
    (entrada: Omit<Anotacion, "id" | "cuando">) => {
      setAnotaciones((previas) => [
        ...previas,
        {
          ...entrada,
          id: `a${++secuencia}`,
          cuando: new Date().toLocaleTimeString("es-DO", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ])
    },
    [],
  )

  const olvidar = useCallback((id: string) => {
    setAnotaciones((previas) => previas.filter((a) => a.id !== id))
  }, [])

  const vaciar = useCallback(() => setAnotaciones([]), [])

  return { anotaciones, registrar, olvidar, vaciar }
}
