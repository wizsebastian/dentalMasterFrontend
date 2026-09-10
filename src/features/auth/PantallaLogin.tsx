import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"

import { ApiError } from "../../api/client"
import { Logo, Cargando } from "../../components/brand"
import { Boton, Campo } from "../../components/ui"
import { useAuth } from "./contexto"

const PRUEBAS = [
  { a: "/odontogram", titulo: "En arcada", nota: "Propio, marcado por cara" },
  { a: "/odontogram-especial", titulo: "Con librería", nota: "react-advanced-odontogram" },
]

export function PantallaLogin() {
  const { entrar } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setError(null)
    setEnviando(true)

    try {
      await entrar(email, password)
    } catch (fallo) {
      setError(
        fallo instanceof ApiError ? fallo.detail : "No se pudo conectar con el servidor",
      )
      setEnviando(false)
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center px-6 py-10">
      <div className="w-full max-w-sm">
        <Logo />

        <h1 className="mt-9 text-2xl font-semibold tracking-tight">Entra a la clínica</h1>
        <p className="mt-2 text-sm leading-relaxed text-tinta-suave">
          Usa el correo con el que te registró la administración.
        </p>

        <form onSubmit={enviar} className="mt-7 space-y-4" noValidate>
          <Campo
            etiqueta="Correo"
            type="email"
            autoComplete="username"
            autoFocus
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nombre@correo.com"
          />
          <Campo
            etiqueta="Contraseña"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <p role="alert" className="rounded-lg border border-linea-fuerte px-3 py-2 text-sm">
              {error}
            </p>
          )}

          <Boton type="submit" disabled={enviando} className="w-full">
            {enviando ? (
              <>
                <Cargando size="sm" label="Entrando" />
                Entrando…
              </>
            ) : (
              "Entrar"
            )}
          </Boton>
        </form>

        {/* Bancos de pruebas del odontograma. No necesitan sesión: son sólo
            representación, con datos locales. */}
        <div className="mt-10 border-t border-linea pt-5">
          <p className="text-sm text-tinta-suave">Probar el odontograma sin entrar</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {PRUEBAS.map((prueba) => (
              <Link
                key={prueba.a}
                to={prueba.a}
                className="rounded-lg border border-linea-fuerte bg-superficie px-3 py-2.5
                  text-sm transition-colors hover:border-marca hover:bg-marca-tenue"
              >
                <span className="block font-medium">{prueba.titulo}</span>
                <span className="mt-0.5 block text-xs text-tinta-suave">{prueba.nota}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
