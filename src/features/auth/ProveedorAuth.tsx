import { useCallback, useMemo, type ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { apiFetch } from "../../api/client"
import { guardarTokens, leerTokens, limpiarSesion } from "../../api/sesion"
import type { Tokens, UsuarioActual } from "../../api/tipos"
import { ContextoAuth, type Sesion } from "./contexto"

export function ProveedorAuth({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const hayTokens = leerTokens() !== null

  const { data: usuario, isPending } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => apiFetch<UsuarioActual>("/api/v1/auth/me"),
    enabled: hayTokens,
    retry: false,
    staleTime: Infinity,
  })

  const login = useMutation({
    mutationFn: (credenciales: { email: string; password: string }) =>
      apiFetch<Tokens>("/api/v1/auth/login", { method: "POST", body: credenciales }),
    onSuccess: (tokens) => {
      guardarTokens(tokens)
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
    },
  })

  const { mutateAsync } = login
  const entrar = useCallback(
    async (email: string, password: string) => {
      await mutateAsync({ email, password })
    },
    [mutateAsync],
  )

  const salir = useCallback(() => {
    limpiarSesion()
    // Se vacía la caché entera: sus datos son de un paciente y un usuario
    // concretos, y en una clínica el siguiente turno usa el mismo equipo.
    queryClient.clear()
  }, [queryClient])

  const valor = useMemo<Sesion>(
    () => ({
      usuario: usuario ?? null,
      cargando: hayTokens && isPending,
      entrar,
      salir,
      puede: (...roles) =>
        usuario ? usuario.rol === "admin" || roles.includes(usuario.rol) : false,
    }),
    [usuario, hayTokens, isPending, entrar, salir],
  )

  return <ContextoAuth.Provider value={valor}>{children}</ContextoAuth.Provider>
}
