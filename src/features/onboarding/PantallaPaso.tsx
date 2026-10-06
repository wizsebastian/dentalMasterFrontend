import { useEffect, useRef } from "react"
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"

import { ApiError } from "../../api/client"
import { Aviso, Boton, ErrorCarga, Tarjeta, useAviso } from "../../components/ui"
import { useAuth } from "../auth/contexto"
import { AnilloProgreso } from "./AnilloProgreso"
import { CheckAnimado } from "./CheckAnimado"
import { useOnboarding, useRevisarCatalogo } from "./consultas"
import { omitirPaso, useAvance } from "./avance"
import { PASOS, pasoDe } from "./pasos"

/** El botón que hay que pulsar ahora dentro del panel: el principal, el sólido. */
const BOTON_PRINCIPAL = 'button[class*="bg-marca"][class*="text-esmalte"]:not([disabled])'

/**
 * Un paso de la guía: el texto corto arriba y, debajo, el panel de Configuración
 * de verdad. El botón principal del panel respira hasta que se usa, para que el
 * ojo vaya directo a lo que hay que hacer.
 */
export function PantallaPaso() {
  const avisar = useAviso()
  const navegar = useNavigate()
  const { puede } = useAuth()
  const { paso: id } = useParams<{ paso: string }>()
  const { data: guia, error } = useOnboarding()
  const revisar = useRevisarCatalogo()
  const zona = useRef<HTMLDivElement>(null)
  const avance = useAvance(guia)

  const paso = pasoDe(id)
  const estado = guia?.pasos.find((p) => p.id === id)
  const hecho = estado?.hecho ?? false
  const indice = PASOS.findIndex((p) => p.id === id)

  // Foco guiado: el botón principal del panel late hasta que se pulsa.
  useEffect(() => {
    const zonaActual = zona.current
    if (!zonaActual || hecho || !paso?.panel) return
    const boton = zonaActual.querySelector<HTMLButtonElement>(BOTON_PRINCIPAL)
    if (!boton) return
    boton.setAttribute("data-guia-pulso", "")
    const quitar = () => boton.removeAttribute("data-guia-pulso")
    boton.addEventListener("click", quitar, { once: true })
    return () => {
      boton.removeEventListener("click", quitar)
      quitar()
    }
  }, [paso, hecho, guia])

  if (!puede()) return <Navigate to="/inicio" replace />
  if (!paso) return <Navigate to="/bienvenida" replace />
  if (error) return <ErrorCarga error={error} />
  if (!guia) return null
  // Se hacen en orden: un paso adelantado devuelve al que toca.
  if (avance.cerrado(paso.id)) return <Navigate to={`/bienvenida/${PASOS[avance.turno].id}`} replace />

  const anterior = PASOS[indice - 1]
  const siguiente = PASOS[indice + 1]
  const destinoSiguiente = siguiente ? `/bienvenida/${siguiente.id}` : "/bienvenida"
  const Icono = paso.icono
  const puedeContinuar = hecho || !estado?.obligatorio

  async function marcarRevisado() {
    try {
      await revisar.mutateAsync()
      avisar("Servicios y precios revisados")
    } catch (e) {
      avisar(e instanceof ApiError ? e.detail : "No se pudo marcar")
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <nav aria-label="Pasos" className="guia-sube flex flex-wrap items-center gap-4">
        <Link to="/bienvenida" className="inline-flex items-center gap-1.5 text-sm text-tinta-suave hover:text-tinta">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Primeros pasos
        </Link>
        <ol className="ml-auto flex items-center gap-1.5" aria-label={`Paso ${indice + 1} de ${PASOS.length}`}>
          {PASOS.map((p, i) => {
            const listo = guia.pasos.find((x) => x.id === p.id)?.hecho
            return (
              <li key={p.id}>
                {avance.cerrado(p.id) ? (
                  <span
                    aria-label={`${i + 1}. ${p.titulo} (bloqueado)`}
                    className="block h-2.5 w-2.5 rounded-full bg-linea opacity-60"
                  />
                ) : (
                  <Link
                    to={`/bienvenida/${p.id}`}
                    aria-label={`${i + 1}. ${p.titulo}${listo ? " (hecho)" : ""}`}
                    aria-current={p.id === id ? "step" : undefined}
                    className={`block h-2.5 rounded-full transition-all ${
                      p.id === id ? "w-8 bg-marca" : listo ? "w-2.5 bg-exito" : "w-2.5 bg-linea-fuerte"
                    }`}
                  />
                )}
              </li>
            )
          })}
        </ol>
        <AnilloProgreso hechos={guia.hechos} total={guia.total} tamano={44} etiqueta={false} />
      </nav>

      {/* `key` rehace el bloque al cambiar de paso: entra deslizándose. */}
      <div key={paso.id} className="guia-desliza mt-6">
        <Tarjeta className={`p-5 ${hecho ? "guia-destello" : ""}`}>
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-marca-tenue text-marca">
              <Icono className="h-6 w-6" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-tinta-suave">
                Paso {indice + 1} de {PASOS.length} ·{" "}
                {estado?.obligatorio ? "obligatorio" : "opcional"}
              </p>
              <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">{paso.titulo}</h1>
            </div>
            {hecho && (
              <span className="flex items-center gap-2 text-sm font-medium text-exito">
                <CheckAnimado />
                Hecho
              </span>
            )}
          </div>

          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
            {(
              [
                ["Qué es", paso.queEs],
                ["Por qué importa", paso.porQue],
                ["Qué hacer ahora", paso.queHacer],
              ] as const
            ).map(([titulo, texto], i) => (
              <div key={titulo} className="guia-sube" style={{ animationDelay: `${140 + i * 90}ms` }}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-marca">{titulo}</dt>
                <dd className="mt-1 text-tinta-suave">{texto}</dd>
              </div>
            ))}
          </dl>
        </Tarjeta>

        <div ref={zona} className="mt-5">
          {paso.panel ? (
            paso.panel()
          ) : (
            <Tarjeta className="p-6">
              <p className="text-sm text-tinta-suave">
                El catálogo ya trae los servicios más comunes con sus precios. Revísalos, ajusta lo
                que cambie en tu clínica y vuelve aquí para marcarlo.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/catalogo"
                  className="inline-flex items-center gap-2 rounded-lg border border-linea-fuerte px-3.5 py-2 text-sm font-medium hover:border-tinta-suave"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden />
                  Abrir el catálogo
                </Link>
                <Boton disabled={hecho || revisar.isPending} onClick={marcarRevisado}>
                  {hecho ? "Revisado" : "Ya lo revisé"}
                </Boton>
              </div>
            </Tarjeta>
          )}
        </div>

        {!hecho && estado?.obligatorio && (
          <Aviso tono="info" className="mt-4">
            Este paso es obligatorio: se marca solo en cuanto lo completes.
          </Aviso>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          {anterior ? (
            <Boton variante="contorno" onClick={() => navegar(`/bienvenida/${anterior.id}`)}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Atrás
            </Boton>
          ) : (
            <span />
          )}
          <div className="flex flex-wrap items-center gap-2">
            {!hecho && !estado?.obligatorio && (
              <Boton
                variante="plano"
                onClick={() => {
                  omitirPaso(paso.id)
                  navegar(destinoSiguiente)
                }}
              >
                Omitir este paso
              </Boton>
            )}
            <Boton
              disabled={!puedeContinuar}
              className={hecho ? "guia-turno" : ""}
              onClick={() => navegar(destinoSiguiente)}
            >
              {siguiente ? `Siguiente: ${siguiente.titulo}` : "Ver el resumen"}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Boton>
          </div>
        </div>
      </div>
    </div>
  )
}
