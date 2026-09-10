import { createContext, useContext } from "react"

import type { RolUsuario, UsuarioActual } from "../../api/tipos"

export type Sesion = {
  usuario: UsuarioActual | null
  cargando: boolean
  entrar: (email: string, password: string) => Promise<void>
  salir: () => void
  /** `admin` pasa siempre: administra la clínica entera. */
  puede: (...roles: RolUsuario[]) => boolean
}

export const ContextoAuth = createContext<Sesion | null>(null)

export function useAuth(): Sesion {
  const sesion = useContext(ContextoAuth)
  if (!sesion) throw new Error("useAuth debe usarse dentro de ProveedorAuth")
  return sesion
}
