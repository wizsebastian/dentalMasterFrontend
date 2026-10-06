import { createContext, useContext } from "react"

export type Avisar = (mensaje: string) => void

export const ContextoAvisos = createContext<Avisar | null>(null)

export function useAviso(): Avisar {
  const avisar = useContext(ContextoAvisos)
  if (!avisar) throw new Error("useAviso debe usarse dentro de ProveedorAvisos")
  return avisar
}
