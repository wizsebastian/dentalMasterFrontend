/** Consultas del catálogo de servicios y de la configuración de la clínica. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { apiFetch } from "../../api/client"
import type {
  Alergia,
  Categoria,
  CondicionMedica,
  Doctor,
  DoctorActualizar,
  DoctorCrear,
  Especialidad,
  ListaPrecio,
  ListaPrecioCrear,
  Servicio,
  ServicioActualizar,
  ServicioCrear,
  Unidad,
  UnidadActualizar,
  UnidadCrear,
  Usuario,
  UsuarioActualizar,
  UsuarioCrear,
} from "../../api/tipos"

const V1 = "/api/v1"

/**
 * Mutación que, al terminar bien, invalida todas las consultas cuya clave
 * empieza por alguna de `claves`. Es lo que repiten todas las de este módulo.
 */
function useMutacion<Entrada, Salida>(
  enviar: (datos: Entrada) => Promise<Salida>,
  claves: readonly string[],
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: enviar,
    onSuccess: () => {
      for (const clave of claves) queryClient.invalidateQueries({ queryKey: [clave] })
    },
  })
}

// --- Servicios -----------------------------------------------------------------

export function useServicios(incluirInactivos = false) {
  return useQuery({
    queryKey: ["servicios", incluirInactivos],
    queryFn: () =>
      apiFetch<Servicio[]>(`${V1}/servicios?incluir_inactivos=${incluirInactivos}`),
  })
}

export function useCategorias() {
  return useQuery({
    queryKey: ["categorias"],
    queryFn: () => apiFetch<Categoria[]>(`${V1}/categorias-servicio`),
  })
}

export function useListasPrecio() {
  return useQuery({
    queryKey: ["listas-precio"],
    queryFn: () => apiFetch<ListaPrecio[]>(`${V1}/listas-precio`),
    staleTime: Infinity,
  })
}

/** Una tarifa nueva trae precio para todos los servicios: el catálogo se recarga. */
export function useGuardarLista() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, datos }: { id?: number; datos: ListaPrecioCrear | { nombre?: string; activo?: boolean } }) =>
      id === undefined
        ? apiFetch<ListaPrecio>(`${V1}/listas-precio`, { method: "POST", body: datos })
        : apiFetch<ListaPrecio>(`${V1}/listas-precio/${id}`, { method: "PATCH", body: datos }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listas-precio"] })
      queryClient.invalidateQueries({ queryKey: ["servicios"] })
    },
  })
}

// Un servicio nuevo o movido cambia el conteo de su categoría.
const TRAS_SERVICIO = ["servicios", "categorias"] as const

export function useCrearServicio() {
  return useMutacion(
    (datos: ServicioCrear) => apiFetch<Servicio>(`${V1}/servicios`, { method: "POST", body: datos }),
    TRAS_SERVICIO,
  )
}

export function useActualizarServicio() {
  return useMutacion(
    ({ id, datos }: { id: number; datos: ServicioActualizar }) =>
      apiFetch<Servicio>(`${V1}/servicios/${id}`, { method: "PATCH", body: datos }),
    TRAS_SERVICIO,
  )
}

export function useBorrarServicio() {
  return useMutacion(
    (id: number) => apiFetch<void>(`${V1}/servicios/${id}`, { method: "DELETE" }),
    TRAS_SERVICIO,
  )
}

export function useGuardarCategoria() {
  return useMutacion(
    ({ id, nombre }: { id?: number; nombre: string }) =>
      id === undefined
        ? apiFetch<Categoria>(`${V1}/categorias-servicio`, { method: "POST", body: { nombre } })
        : apiFetch<Categoria>(`${V1}/categorias-servicio/${id}`, {
            method: "PATCH",
            body: { nombre },
          }),
    TRAS_SERVICIO,
  )
}

export function useBorrarCategoria() {
  return useMutacion(
    (id: number) => apiFetch<void>(`${V1}/categorias-servicio/${id}`, { method: "DELETE" }),
    ["categorias"],
  )
}

// --- Especialidades ------------------------------------------------------------

export function useEspecialidades(incluirInactivas = false) {
  return useQuery({
    queryKey: ["especialidades", incluirInactivas],
    queryFn: () =>
      apiFetch<Especialidad[]>(`${V1}/especialidades?incluir_inactivas=${incluirInactivas}`),
  })
}

export function useGuardarEspecialidad() {
  return useMutacion(
    ({ id, ...datos }: { id?: number; nombre?: string; descripcion?: string | null; activo?: boolean }) =>
      id === undefined
        ? apiFetch<Especialidad>(`${V1}/especialidades`, { method: "POST", body: datos })
        : apiFetch<Especialidad>(`${V1}/especialidades/${id}`, { method: "PATCH", body: datos }),
    ["especialidades"],
  )
}

export function useBorrarEspecialidad() {
  return useMutacion(
    (id: number) => apiFetch<void>(`${V1}/especialidades/${id}`, { method: "DELETE" }),
    ["especialidades"],
  )
}

// --- Unidades dentales ---------------------------------------------------------

export function useUnidades(incluirInactivas = false) {
  return useQuery({
    queryKey: ["unidades", incluirInactivas],
    queryFn: () => apiFetch<Unidad[]>(`${V1}/unidades?incluir_inactivas=${incluirInactivas}`),
  })
}

export function useGuardarUnidad() {
  return useMutacion(
    ({ id, datos }: { id?: number; datos: UnidadCrear | UnidadActualizar }) =>
      id === undefined
        ? apiFetch<Unidad>(`${V1}/unidades`, { method: "POST", body: datos })
        : apiFetch<Unidad>(`${V1}/unidades/${id}`, { method: "PATCH", body: datos }),
    ["unidades"],
  )
}

export function useBorrarUnidad() {
  return useMutacion(
    (id: number) => apiFetch<void>(`${V1}/unidades/${id}`, { method: "DELETE" }),
    ["unidades"],
  )
}

// --- Doctores ------------------------------------------------------------------

export function useDoctores(incluirInactivos = false) {
  return useQuery({
    queryKey: ["doctores", incluirInactivos],
    queryFn: () => apiFetch<Doctor[]>(`${V1}/doctores?incluir_inactivos=${incluirInactivos}`),
  })
}

// Las especialidades muestran cuántos doctores las ejercen.
const TRAS_DOCTOR = ["doctores", "especialidades", "usuarios"] as const

export function useGuardarDoctor() {
  return useMutacion(
    ({ id, datos }: { id?: number; datos: DoctorCrear | DoctorActualizar }) =>
      id === undefined
        ? apiFetch<Doctor>(`${V1}/doctores`, { method: "POST", body: datos })
        : apiFetch<Doctor>(`${V1}/doctores/${id}`, { method: "PATCH", body: datos }),
    TRAS_DOCTOR,
  )
}

// --- Usuarios ------------------------------------------------------------------

export function useUsuarios() {
  return useQuery({
    queryKey: ["usuarios"],
    queryFn: () => apiFetch<Usuario[]>(`${V1}/usuarios`),
  })
}

export function useCrearUsuario() {
  return useMutacion(
    (datos: UsuarioCrear) => apiFetch<Usuario>(`${V1}/usuarios`, { method: "POST", body: datos }),
    ["usuarios"],
  )
}

export function useActualizarUsuario() {
  return useMutacion(
    ({ id, datos }: { id: number; datos: UsuarioActualizar }) =>
      apiFetch<Usuario>(`${V1}/usuarios/${id}`, { method: "PATCH", body: datos }),
    ["usuarios"],
  )
}

export function useCambiarPassword() {
  return useMutacion(
    ({ id, password }: { id: number; password: string }) =>
      apiFetch<void>(`${V1}/usuarios/${id}/password`, { method: "POST", body: { password } }),
    [],
  )
}

// --- Catálogos de la ficha -----------------------------------------------------

export function useCondicionesMedicas() {
  return useQuery({
    queryKey: ["catalogos", "condiciones-medicas"],
    queryFn: () => apiFetch<CondicionMedica[]>(`${V1}/catalogos/condiciones-medicas`),
    staleTime: Infinity,
  })
}

export function useAlergias() {
  return useQuery({
    queryKey: ["catalogos", "alergias"],
    queryFn: () => apiFetch<Alergia[]>(`${V1}/catalogos/alergias`),
    staleTime: Infinity,
  })
}
