import { LogOut, Users } from "lucide-react"
import { NavLink, Outlet } from "react-router-dom"

import { Logo } from "../components/brand"
import { useAuth } from "../features/auth/contexto"

const NAVEGACION = [{ a: "/pacientes", icono: Users, etiqueta: "Pacientes" }]

export function Layout() {
  const { usuario, salir } = useAuth()

  return (
    <div className="min-h-dvh">
      <header className="border-b border-linea bg-superficie">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-3 px-6 py-3">
          <Logo />

          <nav className="flex gap-1">
            {NAVEGACION.map(({ a, icono: Icono, etiqueta }) => (
              <NavLink
                key={a}
                to={a}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors
                   ${isActive ? "bg-marca-tenue font-medium text-marca" : "text-tinta-suave hover:bg-esmalte"}`
                }
              >
                <Icono className="h-4 w-4" aria-hidden />
                {etiqueta}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-tinta-suave">
              {usuario?.doctor_nombre ?? usuario?.email}
              <span className="ml-2 text-xs">({usuario?.rol})</span>
            </span>
            <button
              type="button"
              onClick={salir}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-tinta-suave transition-colors hover:bg-esmalte hover:text-tinta"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
