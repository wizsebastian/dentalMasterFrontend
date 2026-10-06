import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { KeyRound, Pencil, Plus } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { ApiError } from "../../api/client"
import type { RolUsuario, Usuario } from "../../api/tipos"
import { Cargando } from "../../components/brand"
import {
  Aviso,
  Boton,
  Campo,
  Casilla,
  Dialogo,
  ErrorCarga,
  EsqueletoTabla,
  Insignia,
  PieDialogo,
  Selector,
  Tabla,
  Tarjeta,
  useAviso,
  type Columna,
} from "../../components/ui"
import { aplicarErrorApi, numeroONulo } from "../../lib/formularios"
import { doctor as tratamiento, fecha, rol } from "../../lib/formato"
import { useAuth } from "../auth/contexto"
import {
  useActualizarUsuario,
  useCambiarPassword,
  useCrearUsuario,
  useDoctores,
  useUsuarios,
} from "../catalogo/consultas"

const ROLES: RolUsuario[] = ["admin", "doctor", "asistente", "recepcion", "facturacion"]

const POLITICA = "Al menos 12 caracteres, sin secuencias ni palabras previsibles."

const esquema = z.object({
  email: z.email("El correo no es válido"),
  rol: z.enum(ROLES),
  doctor_id: z.string(),
  password: z.string(),
  activo: z.boolean(),
})

type Valores = z.infer<typeof esquema>

type Abierto = { tipo: "nuevo" } | { tipo: "editar" | "password"; usuario: Usuario } | null

export function PanelUsuarios() {
  const { usuario: yo } = useAuth()
  const { data, isPending, error } = useUsuarios()
  const [abierto, setAbierto] = useState<Abierto>(null)

  const columnas: Columna<Usuario>[] = [
    {
      id: "email",
      titulo: "Cuenta",
      celda: (u) => (
        <>
          <span className="font-medium">{u.email}</span>
          {u.id === yo?.id && <Insignia className="ml-2">Tú</Insignia>}
          {!u.activo && <Insignia className="ml-2">Desactivada</Insignia>}
          {u.doctor_nombre && (
            <span className="block text-xs text-tinta-suave">{tratamiento(u.doctor_nombre)}</span>
          )}
        </>
      ),
    },
    { id: "rol", titulo: "Rol", celda: (u) => rol(u.rol) },
    {
      id: "alta",
      titulo: "Alta",
      className: "tabular text-tinta-suave",
      celda: (u) => fecha(u.creado_en),
    },
    {
      id: "acciones",
      titulo: "",
      alinear: "derecha",
      className: "whitespace-nowrap",
      celda: (u) => (
        <>
          <button
            type="button"
            onClick={() => setAbierto({ tipo: "password", usuario: u })}
            aria-label={`Cambiar la contraseña de ${u.email}`}
            className="rounded-lg p-1.5 text-tinta-suave hover:bg-marca-tenue hover:text-marca"
          >
            <KeyRound className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setAbierto({ tipo: "editar", usuario: u })}
            aria-label={`Editar ${u.email}`}
            className="rounded-lg p-1.5 text-tinta-suave hover:bg-marca-tenue hover:text-marca"
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </button>
        </>
      ),
    },
  ]

  return (
    <div>
      <div className="flex justify-end">
        <Boton onClick={() => setAbierto({ tipo: "nuevo" })}>
          <Plus className="h-4 w-4" aria-hidden />
          Nuevo usuario
        </Boton>
      </div>

      <Tarjeta className="mt-4 overflow-hidden">
        {isPending ? (
          <EsqueletoTabla filas={5} />
        ) : error ? (
          <ErrorCarga error={error} className="m-4 border-0" />
        ) : (
          <Tabla
            columnas={columnas}
            filas={data}
            clave={(u) => u.id}
            claseFila={(u) => (u.activo ? undefined : "text-tinta-suave")}
          />
        )}
      </Tarjeta>

      <Dialogo
        abierto={abierto?.tipo === "nuevo" || abierto?.tipo === "editar"}
        alCerrar={() => setAbierto(null)}
        titulo={abierto?.tipo === "editar" ? "Editar usuario" : "Nuevo usuario"}
        descripcion={abierto?.tipo === "editar" ? abierto.usuario.email : undefined}
        ancho="sm"
      >
        <FormularioUsuario
          usuario={abierto?.tipo === "editar" ? abierto.usuario : undefined}
          esYo={abierto?.tipo === "editar" && abierto.usuario.id === yo?.id}
          alCerrar={() => setAbierto(null)}
        />
      </Dialogo>

      <Dialogo
        abierto={abierto?.tipo === "password"}
        alCerrar={() => setAbierto(null)}
        titulo="Cambiar contraseña"
        descripcion={abierto?.tipo === "password" ? abierto.usuario.email : undefined}
        ancho="sm"
      >
        {abierto?.tipo === "password" && (
          <FormularioPassword usuario={abierto.usuario} alCerrar={() => setAbierto(null)} />
        )}
      </Dialogo>
    </div>
  )
}

function FormularioUsuario({
  usuario,
  esYo,
  alCerrar,
}: {
  usuario?: Usuario
  esYo: boolean
  alCerrar: () => void
}) {
  const avisar = useAviso()
  const { data: doctores } = useDoctores()
  const crear = useCrearUsuario()
  const actualizar = useActualizarUsuario()
  const [general, setGeneral] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Valores>({
    resolver: zodResolver(esquema),
    defaultValues: {
      email: usuario?.email ?? "",
      rol: usuario?.rol ?? "recepcion",
      doctor_id: usuario?.doctor_id ? String(usuario.doctor_id) : "",
      password: "",
      activo: usuario?.activo ?? true,
    },
  })

  async function enviar(valores: Valores) {
    setGeneral(null)
    const doctor_id = numeroONulo(valores.doctor_id)

    try {
      if (usuario) {
        await actualizar.mutateAsync({
          id: usuario.id,
          datos: { rol: valores.rol, doctor_id, activo: valores.activo },
        })
      } else {
        await crear.mutateAsync({
          email: valores.email,
          rol: valores.rol,
          doctor_id,
          password: valores.password,
        })
      }
      avisar(usuario ? "Usuario actualizado" : "Usuario creado")
      alCerrar()
    } catch (fallo) {
      // La política de contraseñas la aplica la API y contesta «password: motivo».
      if (fallo instanceof ApiError && fallo.detail.startsWith("password:")) {
        setError("password", { message: `La contraseña ${fallo.detail.slice(10)}` })
      } else {
        setGeneral(aplicarErrorApi(fallo, setError, ["email", "rol", "doctor_id", "password"]))
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-4">
      {!usuario && (
        <Campo
          etiqueta="Correo"
          type="email"
          autoFocus
          autoComplete="off"
          error={errors.email?.message}
          {...register("email")}
        />
      )}
      <Selector
        etiqueta="Rol"
        disabled={esYo}
        ayuda={esYo ? "No puedes quitarte tu propio rol." : undefined}
        error={errors.rol?.message}
        {...register("rol")}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {rol(r)}
          </option>
        ))}
      </Selector>
      <Selector
        etiqueta="Doctor"
        opcional
        ayuda="Enlaza la cuenta con un doctor: firma lo que registra y ve «mis citas»."
        error={errors.doctor_id?.message}
        {...register("doctor_id")}
      >
        <option value="">Ninguno</option>
        {doctores?.map((d) => (
          <option key={d.id} value={d.id}>
            {tratamiento(d.nombre_completo)}
          </option>
        ))}
      </Selector>
      {!usuario && (
        <Campo
          etiqueta="Contraseña"
          type="password"
          autoComplete="new-password"
          ayuda={POLITICA}
          error={errors.password?.message}
          {...register("password")}
        />
      )}
      {usuario && !esYo && (
        <Casilla
          etiqueta="Cuenta activa"
          ayuda="Una cuenta desactivada no puede iniciar sesión."
          {...register("activo")}
        />
      )}

      {general && <Aviso>{general}</Aviso>}

      <PieDialogo>
        <Boton type="button" variante="contorno" onClick={alCerrar}>
          Cancelar
        </Boton>
        <Boton type="submit" disabled={isSubmitting}>
          {isSubmitting && <Cargando size="sm" label="Guardando" />}
          {usuario ? "Guardar cambios" : "Crear usuario"}
        </Boton>
      </PieDialogo>
    </form>
  )
}

function FormularioPassword({ usuario, alCerrar }: { usuario: Usuario; alCerrar: () => void }) {
  const avisar = useAviso()
  const cambiar = useCambiarPassword()
  const [password, setPassword] = useState("")
  const [fallo, setFallo] = useState<string | null>(null)

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    setFallo(null)
    try {
      await cambiar.mutateAsync({ id: usuario.id, password })
      avisar("Contraseña cambiada")
      alCerrar()
    } catch (e) {
      setFallo(
        e instanceof ApiError
          ? e.detail.replace(/^password: /, "La contraseña ")
          : "No se pudo cambiar la contraseña",
      )
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-4">
      <Campo
        etiqueta="Contraseña nueva"
        type="password"
        autoFocus
        autoComplete="new-password"
        ayuda={POLITICA}
        error={fallo ?? undefined}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <PieDialogo>
        <Boton type="button" variante="contorno" onClick={alCerrar}>
          Cancelar
        </Boton>
        <Boton type="submit" disabled={cambiar.isPending || !password}>
          {cambiar.isPending && <Cargando size="sm" label="Guardando" />}
          Cambiar contraseña
        </Boton>
      </PieDialogo>
    </form>
  )
}
