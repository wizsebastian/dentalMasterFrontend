import { CalendarDays, UserPlus, Users } from "lucide-react"
import { Link, Navigate } from "react-router-dom"

import { Tarjeta } from "../../components/ui"
import { useLayout } from "../../rutas/contexto"
import { useAuth } from "../auth/contexto"
import { AnilloProgreso } from "./AnilloProgreso"
import { CheckAnimado } from "./CheckAnimado"
import { useOnboarding } from "./consultas"
import { PASOS } from "./pasos"

/** El cierre: qué quedó configurado y por dónde seguir a trabajar. */
export function PantallaListo() {
  const { puede } = useAuth()
  const { nuevoPaciente, abrirCita } = useLayout()
  const { data: guia } = useOnboarding()

  if (!puede()) return <Navigate to="/inicio" replace />
  if (!guia) return null

  const hechos = new Map(guia.pasos.map((p) => [p.id, p.hecho]))
  const accesos = [
    { icono: UserPlus, titulo: "Crear mi primer paciente", nota: "Atajo: F1", alPulsar: nuevoPaciente },
    { icono: CalendarDays, titulo: "Agendar la primera cita", nota: "Atajo: F2", alPulsar: () => abrirCita() },
  ]

  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="guia-pop mx-auto w-fit">
        <AnilloProgreso hechos={guia.hechos} total={guia.total} tamano={132} />
      </div>
      <h1 className="guia-sube mt-6 text-3xl font-semibold tracking-tight" style={{ animationDelay: "150ms" }}>
        Tu clínica está lista
      </h1>
      <p className="guia-sube mt-2 text-tinta-suave" style={{ animationDelay: "230ms" }}>
        Ya puedes registrar pacientes, agendar y cobrar. Lo que dejaste pendiente lo puedes
        completar cuando quieras desde Configuración.
      </p>

      <Tarjeta className="guia-sube mt-8 p-5 text-left">
        <ul className="grid gap-2 sm:grid-cols-2">
          {PASOS.map((p) => (
            <li key={p.id} className="flex items-center gap-2 text-sm">
              {hechos.get(p.id) ? (
                <CheckAnimado tamano={20} />
              ) : (
                <span className="h-5 w-5 rounded-full border border-linea-fuerte" aria-hidden />
              )}
              <span className={hechos.get(p.id) ? "" : "text-tinta-suave"}>{p.titulo}</span>
              {!hechos.get(p.id) && (
                <Link to={`/bienvenida/${p.id}`} className="ml-auto text-xs text-marca hover:underline">
                  Completar
                </Link>
              )}
            </li>
          ))}
        </ul>
      </Tarjeta>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          ...accesos.map((a) => ({ ...a, a: undefined as string | undefined })),
          { icono: Users, titulo: "Ir a la agenda", nota: "Semana, día y mes", alPulsar: undefined, a: "/agenda" },
        ].map((acceso, i) => {
          const Icono = acceso.icono
          const clases =
            "guia-sube flex flex-col items-center gap-2 rounded-xl border border-linea bg-superficie p-5 text-center transition-colors hover:border-marca"
          const contenido = (
            <>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-marca-tenue text-marca">
                <Icono className="h-5 w-5" aria-hidden />
              </span>
              <span className="font-medium">{acceso.titulo}</span>
              <span className="text-xs text-tinta-suave">{acceso.nota}</span>
            </>
          )
          const estilo = { animationDelay: `${320 + i * 90}ms` }
          return acceso.a ? (
            <Link key={acceso.titulo} to={acceso.a} className={clases} style={estilo}>
              {contenido}
            </Link>
          ) : (
            <button key={acceso.titulo} type="button" onClick={acceso.alPulsar} className={clases} style={estilo}>
              {contenido}
            </button>
          )
        })}
      </div>
    </div>
  )
}
