import { useEffect, useState } from "react"
import {
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  CalendarPlus,
  Home,
  LogOut,
  Package,
  Receipt,
  Search,
  Settings,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"

import type { RolUsuario } from "../api/tipos"
import { DialogoCita, type CitaInicial } from "../features/agenda/DialogoCita"
import { useAuth } from "../features/auth/contexto"
import { BuscadorPacientes } from "../features/pacientes/BuscadorPacientes"
import { DialogoPaciente } from "../features/pacientes/DialogoPaciente"
import { rol } from "../lib/formato"
import type { ContextoLayout } from "./contexto"
import { useClinicaConLogo } from "../features/clinica/consultas"
import { useOnboarding } from "../features/onboarding/consultas"

type Enlace = {
  a: string
  icono: LucideIcon
  etiqueta: string
  /** Sin `roles`, lo ve cualquiera con sesión. Con lista vacía, sólo administración. */
  roles?: RolUsuario[]
  /** Sólo para la cuenta de un doctor: es su reporte, no el de la clínica. */
  soloDoctor?: boolean
}

/* Sólo lo que ya existe: un enlace a una pantalla por construir es peor que
   ninguno. Cada fase añade aquí los suyos. */
const NAVEGACION: Enlace[] = [
  { a: "/inicio", icono: Home, etiqueta: "Hoy" },
  { a: "/agenda", icono: CalendarDays, etiqueta: "Agenda" },
  { a: "/pacientes", icono: Users, etiqueta: "Pacientes" },
  {
    a: "/caja",
    icono: Wallet,
    etiqueta: "Caja",
    roles: ["recepcion", "facturacion", "doctor", "asistente"],
  },
  { a: "/gastos", icono: Receipt, etiqueta: "Gastos", roles: ["facturacion"] },
  { a: "/informes", icono: BarChart3, etiqueta: "Informes", roles: ["facturacion"] },
  { a: "/mi-produccion", icono: BarChart3, etiqueta: "Mi producción", soloDoctor: true },
  { a: "/inventario", icono: Package, etiqueta: "Inventario" },
  { a: "/catalogo", icono: BookOpen, etiqueta: "Catálogo" },
  { a: "/configuracion", icono: Settings, etiqueta: "Configuración", roles: [] },
]

// Quien da de alta pacientes y agenda, según la API.
const ROLES_ALTA: RolUsuario[] = ["doctor", "asistente", "recepcion"]

const ES_MAC = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)

function Tecla({ children }: { children: string }) {
  return (
    <kbd className="rounded border border-linea-fuerte px-1 font-sans text-[11px] text-tinta-suave">
      {children}
    </kbd>
  )
}

/**
 * El logo de la clínica, y sólo el suyo: el que se sube en Configuración. Sin logo
 * no se pone el de ninguna marca: sale el nombre de la clínica, y en cuanto se
 * sube uno ocupa su lugar.
 */
function LogoDeLaClinica() {
  const { clinica, logo } = useClinicaConLogo()
  if (logo) {
    return <img src={logo} alt={clinica?.nombre ?? "Clínica"} className="h-10 w-auto max-w-44 object-contain" />
  }
  return (
    <span className="flex items-center gap-2 text-base font-semibold tracking-tight">
      <Building2 className="h-5 w-5 shrink-0 text-marca" aria-hidden />
      <span className="truncate">{clinica?.nombre ?? ""}</span>
    </span>
  )
}

export function Layout() {
  const { usuario, salir, puede } = useAuth()
  const navegar = useNavigate()
  const { pathname } = useLocation()
  const { data: guia } = useOnboarding()
  const [buscando, setBuscando] = useState(false)
  const [alta, setAlta] = useState(false)
  const [cita, setCita] = useState<CitaInicial | null>(null)
  const puedeAlta = puede(...ROLES_ALTA)

  // Atajos del marco, disponibles desde cualquier pantalla.
  useEffect(() => {
    function alTeclear(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setBuscando(true)
      } else if (e.key === "F1" && puedeAlta) {
        e.preventDefault()
        setAlta(true)
      } else if (e.key === "F2" && puedeAlta) {
        e.preventDefault()
        setCita({})
      }
    }
    window.addEventListener("keydown", alTeclear)
    return () => window.removeEventListener("keydown", alTeclear)
  }, [puedeAlta])

  // Una clínica recién entregada no se puede usar a medias: el administrador
  // configura lo básico antes de entrar a trabajar. Mientras tanto, sin menú y sin
  // salida a otras pantallas. El resto de roles trabaja con lo que haya.
  if (puede() && guia && !guia.cerrado) {
    if (!pathname.startsWith("/bienvenida")) return <Navigate to="/bienvenida" replace />
    return (
      <div className="min-h-dvh bg-esmalte">
        <header className="no-imprimir flex items-center justify-between gap-4 border-b border-linea bg-superficie px-6 py-3">
          <LogoDeLaClinica />
          <button
            type="button"
            onClick={salir}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-tinta-suave transition-colors hover:bg-esmalte hover:text-tinta"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Salir
          </button>
        </header>
        <main className="mx-auto w-full max-w-5xl px-6 py-8">
          <Outlet
            context={
              {
                nuevoPaciente: () => undefined,
                abrirCita: () => undefined,
              } satisfies ContextoLayout
            }
          />
        </main>
      </div>
    )
  }

  const enlaces = NAVEGACION.filter((enlace) =>
    enlace.soloDoctor
      ? usuario?.rol === "doctor" && Boolean(usuario.doctor_id)
      : !enlace.roles || puede(...enlace.roles),
  )

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_1fr]">
      <aside
        className="no-imprimir flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-linea
          bg-superficie px-4 py-3 lg:sticky lg:top-0 lg:h-dvh lg:flex-col lg:flex-nowrap
          lg:items-stretch lg:gap-0 lg:border-b-0 lg:border-r lg:px-3 lg:py-5"
      >
        <div className="lg:px-2">
          <LogoDeLaClinica />
        </div>

        <div className="flex gap-2 lg:mt-6 lg:flex-col">
          <button
            type="button"
            onClick={() => setBuscando(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-linea-fuerte px-3 py-2
              text-sm text-tinta-suave transition-colors hover:border-tinta-suave hover:text-tinta"
          >
            <Search className="h-4 w-4" aria-hidden />
            <span className="flex-1 text-left">Buscar paciente</span>
            <Tecla>{ES_MAC ? "⌘K" : "Ctrl K"}</Tecla>
          </button>
          {puedeAlta && (
            <button
              type="button"
              onClick={() => setAlta(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-marca px-3 py-2 text-sm
                font-medium text-esmalte transition-colors hover:bg-marca-viva"
            >
              <UserPlus className="h-4 w-4" aria-hidden />
              <span className="flex-1 text-left">Nuevo paciente</span>
              <kbd className="rounded border border-esmalte/40 px-1 font-sans text-[11px] text-esmalte/80">
                F1
              </kbd>
            </button>
          )}
          {puedeAlta && (
            <button
              type="button"
              onClick={() => setCita({})}
              className="inline-flex items-center gap-2 rounded-lg border border-linea-fuerte px-3 py-2
                text-sm transition-colors hover:border-tinta-suave"
            >
              <CalendarPlus className="h-4 w-4" aria-hidden />
              <span className="flex-1 text-left">Nueva cita</span>
              <Tecla>F2</Tecla>
            </button>
          )}
        </div>

        <nav className="flex gap-1 lg:mt-6 lg:flex-col" aria-label="Principal">
          {enlaces.map(({ a, icono: Icono, etiqueta }) => (
            <NavLink
              key={a}
              to={a}
              className={({ isActive }) =>
                `inline-flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-marca-tenue font-medium text-marca"
                    : "text-tinta-suave hover:bg-esmalte hover:text-tinta"
                }`
              }
            >
              <Icono className="h-4 w-4" aria-hidden />
              {etiqueta}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 text-sm lg:ml-0 lg:mt-auto lg:block lg:border-t lg:border-linea lg:px-2 lg:pt-4">
          <div className="min-w-0">
            <p className="truncate font-medium">{usuario?.doctor_nombre ?? usuario?.email}</p>
            <p className="text-xs text-tinta-suave">{rol(usuario?.rol)}</p>
          </div>
          <button
            type="button"
            onClick={salir}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-tinta-suave
              transition-colors hover:bg-esmalte hover:text-tinta lg:-ml-2 lg:mt-2"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Salir
          </button>
        </div>
      </aside>

      <main className="mx-auto w-full max-w-7xl px-6 py-8">
        <Outlet
          context={
            {
              nuevoPaciente: () => setAlta(true),
              abrirCita: (inicial) => setCita(inicial ?? {}),
            } satisfies ContextoLayout
          }
        />
      </main>

      <BuscadorPacientes abierto={buscando} alCerrar={() => setBuscando(false)} />
      <DialogoCita inicial={cita} alCerrar={() => setCita(null)} />
      <DialogoPaciente
        abierto={alta}
        alCerrar={() => setAlta(false)}
        alGuardar={(paciente) => {
          setAlta(false)
          navegar(`/pacientes/${paciente.id}`)
        }}
      />
    </div>
  )
}
