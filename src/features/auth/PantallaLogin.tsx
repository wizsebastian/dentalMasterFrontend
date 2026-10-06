import { useState, type KeyboardEvent } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarDays, Eye, EyeOff, Receipt, ShieldCheck, Stethoscope } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { ApiError } from "../../api/client"
import { Cargando, Logo } from "../../components/brand"
import { Aviso, Boton, Campo } from "../../components/ui"
import { useAuth } from "./contexto"

const esquema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Escribe tu correo")
    .pipe(z.email("Ese correo no parece válido: revisa que tenga @ y dominio")),
  password: z.string().min(1, "Escribe tu contraseña"),
})

type Valores = z.infer<typeof esquema>

const PUNTOS = [
  { icono: Stethoscope, titulo: "Ficha y odontograma", texto: "Cada pieza con su historia, versionada y sin perder nada." },
  { icono: CalendarDays, titulo: "Agenda sin choques", texto: "Doctores y sillones, con las citas siempre en su sitio." },
  { icono: Receipt, titulo: "Cuenta y comprobantes", texto: "Cobros, recibos y NCF claros, hasta el cierre del día." },
]

export function PantallaLogin() {
  const { entrar } = useAuth()
  const [errorServidor, setErrorServidor] = useState<string | null>(null)
  const [verClave, setVerClave] = useState(false)
  const [mayusculas, setMayusculas] = useState(false)
  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<Valores>({
    resolver: zodResolver(esquema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  })

  const enviar = handleSubmit(async ({ email, password }) => {
    setErrorServidor(null)
    try {
      await entrar(email, password)
    } catch (fallo) {
      setErrorServidor(
        fallo instanceof ApiError ? fallo.detail : "No se pudo conectar con el servidor",
      )
      setFocus("password")
    }
  })

  // El aviso de «Bloq Mayús» sólo importa mientras se escribe la contraseña.
  const vigilarMayusculas = (e: KeyboardEvent<HTMLInputElement>) =>
    setMayusculas(e.getModifierState("CapsLock"))

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Panel de marca: sólo en pantallas anchas. */}
      <aside className="hidden flex-col justify-between border-r border-linea bg-esmalte p-12 lg:flex">
        <Logo className="h-14 self-start" />

        <div className="max-w-md">
          <p className="text-sm font-medium text-marca">Gestión clínica odontológica</p>
          <h2 className="mt-3 text-4xl font-semibold leading-tight tracking-tight">
            Tu clínica, en orden.
          </h2>
          <ul className="mt-10 space-y-6">
            {PUNTOS.map(({ icono: Icono, titulo, texto }) => (
              <li key={titulo} className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-marca-tenue text-marca">
                  <Icono className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span className="block font-medium">{titulo}</span>
                  <span className="block text-sm leading-relaxed text-tinta-suave">{texto}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="flex items-center gap-2 text-sm text-tinta-suave">
          <ShieldCheck className="h-4 w-4 text-acento" aria-hidden />
          Acceso sólo para el personal de la clínica.
        </p>
      </aside>

      <main className="grid place-items-center px-6 py-10">
        <div className="w-full max-w-sm">
          <Logo className="h-12 lg:hidden" />

          <h1 className="mt-9 text-2xl font-semibold tracking-tight lg:mt-0">Entra a la clínica</h1>
          <p className="mt-2 text-sm leading-relaxed text-tinta-suave">
            Usa el correo con el que te registró la administración.
          </p>

          <form onSubmit={enviar} className="mt-7 space-y-4" noValidate>
            <Campo
              etiqueta="Correo"
              type="email"
              autoComplete="username"
              autoFocus
              placeholder="nombre@correo.com"
              error={errors.email?.message}
              {...register("email", { onChange: () => setErrorServidor(null) })}
            />

            <div>
              <div className="relative">
                <Campo
                  etiqueta="Contraseña"
                  type={verClave ? "text" : "password"}
                  autoComplete="current-password"
                  error={errors.password?.message}
                  onKeyUp={vigilarMayusculas}
                  onKeyDown={vigilarMayusculas}
                  className="[&_input]:pr-11"
                  {...register("password", {
                    onChange: () => setErrorServidor(null),
                    onBlur: () => setMayusculas(false),
                  })}
                />
                <button
                  type="button"
                  onClick={() => setVerClave((v) => !v)}
                  aria-pressed={verClave}
                  aria-label={verClave ? "Ocultar" : "Mostrar"}
                  title={verClave ? "Ocultar" : "Mostrar"}
                  className="absolute right-2 top-[1.8rem] grid h-8 w-8 place-items-center rounded-md text-tinta-suave hover:text-tinta"
                >
                  {verClave ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                </button>
              </div>
              {mayusculas && (
                <p className="mt-1.5 text-sm text-aviso" role="status">
                  Tienes las mayúsculas activadas.
                </p>
              )}
            </div>

            {errorServidor && <Aviso>{errorServidor}</Aviso>}

            <Boton type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Cargando size="sm" label="Entrando" />
                  Entrando…
                </>
              ) : (
                "Entrar"
              )}
            </Boton>
          </form>
        </div>
      </main>
    </div>
  )
}
