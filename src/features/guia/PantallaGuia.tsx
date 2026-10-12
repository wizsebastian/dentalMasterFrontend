import { useEffect, useMemo, useState, type FormEvent } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Check, CircleCheck, CircleHelp, CircleX, Cloud, CloudOff, Copy, ExternalLink } from "lucide-react"

import { ApiError } from "../../api/client"
import type { GuiaEstado, GuiaSesion } from "../../api/tipos"
import { Cargando, Logo } from "../../components/brand"
import { Aviso, AreaTexto, Boton, Campo, ErrorCarga, Tarjeta } from "../../components/ui"
import {
  BIENVENIDA,
  QUIEN,
  SECCIONES,
  TODOS_LOS_PASOS,
  type PasoGuia,
  type Quien,
} from "./contenido"
import { crearSesionGuia, useSesionGuia } from "./consultas"
import { Texto } from "./texto"
import { useGuardado, leerRespaldo, GENERAL, type EstadoGuardado, type Respuesta } from "./useGuardado"

/**
 * La guía interactiva del sistema. Va **fuera de la sesión**: la abre el doctor
 * con un enlace, marca cada paso y escribe sus dudas, y todo se guarda solo en
 * la API para que quien entregó el sistema pueda ver qué necesita.
 */

const CLAVE_CODIGO = "dentalmaster.guia.codigo"

function codigoGuardado(): string | null {
  try {
    return localStorage.getItem(CLAVE_CODIGO)
  } catch {
    return null
  }
}

function recordarCodigo(codigo: string | null) {
  try {
    if (codigo) localStorage.setItem(CLAVE_CODIGO, codigo)
    else localStorage.removeItem(CLAVE_CODIGO)
  } catch {
    /* el enlace de la página basta para volver */
  }
}

export function PantallaGuia() {
  const { codigo } = useParams<{ codigo: string }>()
  const navigate = useNavigate()

  // Sin código en la dirección: si ya empezó antes en este equipo, retoma.
  useEffect(() => {
    if (codigo) return
    const guardado = codigoGuardado()
    if (guardado) navigate(`/guia/${guardado}`, { replace: true })
  }, [codigo, navigate])

  return (
    <div className="min-h-dvh">
      <header className="border-b border-linea bg-superficie">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Logo className="h-9" />
          <span className="text-sm text-tinta-suave">Guía del sistema</span>
        </div>
      </header>
      {codigo ? <Sesion codigo={codigo} /> : <Portada />}
    </div>
  )
}

// --- Portada: el técnico saluda y se registra quién prueba ------------------

const ROLES = ["Doctor", "Recepción", "Administración", "Otro"] as const

function Portada() {
  const navigate = useNavigate()
  const [nombre, setNombre] = useState("")
  const [rol, setRol] = useState<string>("Doctor")
  const [enviando, setEnviando] = useState(false)
  const [fallo, setFallo] = useState<string | null>(null)

  async function empezar(evento: FormEvent) {
    evento.preventDefault()
    setFallo(null)
    setEnviando(true)
    try {
      const sesion = await crearSesionGuia({ nombre: nombre.trim(), rol })
      recordarCodigo(sesion.codigo)
      navigate(`/guia/${sesion.codigo}`, { replace: true })
    } catch (e) {
      setFallo(e instanceof ApiError ? e.detail : "No se pudo abrir la guía. Revise su conexión.")
      setEnviando(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">{BIENVENIDA.saludo}</h1>
      <div className="mt-5 space-y-3 text-[15px] leading-relaxed text-tinta">
        {BIENVENIDA.parrafos.map((p) => (
          <p key={p}>
            <Texto>{p}</Texto>
          </p>
        ))}
      </div>

      <Tarjeta className="mt-6 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-tinta-suave">
          Cómo marcar cada paso
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          {BIENVENIDA.comoMarcar.map((m) => (
            <li key={m.etiqueta}>
              <strong>{m.etiqueta}</strong> — {m.texto}
            </li>
          ))}
        </ul>
        <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-tinta-suave">
          {BIENVENIDA.consejos.map((c) => (
            <li key={c}>
              <Texto>{c}</Texto>
            </li>
          ))}
        </ul>
      </Tarjeta>

      <form onSubmit={empezar} className="mt-6 space-y-4">
        <Campo
          etiqueta="Su nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          autoComplete="name"
          placeholder="Dr. Gabriel Martínez"
          required
          minLength={2}
          maxLength={120}
        />
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">¿Con qué función va a probar?</legend>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <label
                key={r}
                className={`cursor-pointer rounded-lg border px-3.5 py-2 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-marca ${
                  rol === r
                    ? "border-marca bg-marca-tenue font-medium text-marca"
                    : "border-linea-fuerte bg-superficie hover:border-tinta-suave"
                }`}
              >
                <input
                  type="radio"
                  name="rol"
                  value={r}
                  checked={rol === r}
                  onChange={() => setRol(r)}
                  className="sr-only"
                />
                {r}
              </label>
            ))}
          </div>
        </fieldset>
        {fallo && <Aviso tono="error">{fallo}</Aviso>}
        <Boton type="submit" disabled={enviando || nombre.trim().length < 2} className="w-full sm:w-auto">
          {enviando ? "Abriendo…" : "Empezar la guía"}
        </Boton>
      </form>
    </main>
  )
}

// --- Una sesión abierta ------------------------------------------------------

function Sesion({ codigo }: { codigo: string }) {
  const navigate = useNavigate()
  const { data: sesion, isPending, error } = useSesionGuia(codigo)

  if (isPending) {
    return (
      <div className="grid place-items-center py-32 text-marca">
        <Cargando size="lg" label="Abriendo su guía" />
      </div>
    )
  }

  if (error || !sesion) {
    const noExiste = error instanceof ApiError && error.status === 404
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        {noExiste ? (
          <Tarjeta className="p-6">
            <h1 className="text-lg font-semibold">Esa guía no existe</h1>
            <p className="mt-2 text-sm text-tinta-suave">
              El enlace está incompleto o es de otra instalación. Puede empezar una nueva.
            </p>
            <Boton
              className="mt-4"
              onClick={() => {
                recordarCodigo(null)
                navigate("/guia", { replace: true })
              }}
            >
              Empezar de nuevo
            </Boton>
          </Tarjeta>
        ) : (
          <ErrorCarga error={error} />
        )}
      </main>
    )
  }

  return <GuiaAbierta sesion={sesion} />
}

type Mapa = Record<string, Respuesta>
type Filtro = "todos" | "sin-probar" | "atencion" | "con-nota"

const FILTROS: { valor: Filtro; etiqueta: string }[] = [
  { valor: "todos", etiqueta: "Todos" },
  { valor: "sin-probar", etiqueta: "Sin probar" },
  { valor: "atencion", etiqueta: "Fallas y dudas" },
  { valor: "con-nota", etiqueta: "Con comentario" },
]

function GuiaAbierta({ sesion }: { sesion: GuiaSesion }) {
  const { codigo } = sesion
  const { estado: estadoGuardado, reintentar, guardarPaso, guardarGeneral } = useGuardado(codigo)

  // Se parte de lo guardado en la API y, encima, de lo que quedó sin enviar.
  const [respuestas, setRespuestas] = useState<Mapa>(() => {
    const respaldo = leerRespaldo(codigo)
    const mapa: Mapa = {}
    for (const r of sesion.respuestas) mapa[r.paso_id] = { estado: r.estado, nota: r.nota }
    for (const [clave, valor] of Object.entries(respaldo)) {
      if (clave !== GENERAL && typeof valor === "object") mapa[clave] = valor
    }
    return mapa
  })
  const [general, setGeneral] = useState(() => {
    const pendiente = leerRespaldo(codigo)[GENERAL]
    return typeof pendiente === "string" ? pendiente : sesion.impresion_general
  })
  const [filtro, setFiltro] = useState<Filtro>("todos")
  const [copiado, setCopiado] = useState(false)

  useEffect(() => recordarCodigo(codigo), [codigo])

  function cambiar(paso: PasoGuia, parche: Partial<Respuesta>, espera?: number) {
    const actual = respuestas[paso.id] ?? { estado: "" as GuiaEstado, nota: "" }
    const nueva = { ...actual, ...parche }
    setRespuestas((m) => ({ ...m, [paso.id]: nueva }))
    guardarPaso(paso.id, nueva, espera)
  }

  const conteo = useMemo(() => {
    const c = { ok: 0, falla: 0, duda: 0 }
    for (const paso of TODOS_LOS_PASOS) {
      const e = respuestas[paso.id]?.estado
      if (e === "ok" || e === "falla" || e === "duda") c[e] += 1
    }
    return c
  }, [respuestas])

  const total = TODOS_LOS_PASOS.length
  const probados = conteo.ok + conteo.falla + conteo.duda

  function visible(paso: PasoGuia): boolean {
    const r = respuestas[paso.id]
    switch (filtro) {
      case "sin-probar":
        return !r?.estado
      case "atencion":
        return r?.estado === "falla" || r?.estado === "duda"
      case "con-nota":
        return Boolean(r?.nota)
      default:
        return true
    }
  }

  async function copiarEnlace() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), 2000)
    } catch {
      /* sin portapapeles: el enlace está en la barra de direcciones */
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[16rem_1fr]">
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <p className="text-sm text-tinta-suave">Guía de</p>
        <p className="text-lg font-semibold leading-tight">{sesion.nombre}</p>

        <div className="mt-4" aria-label={`${probados} de ${total} pasos probados`}>
          <div className="h-2 overflow-hidden rounded-full bg-linea">
            <span
              className="block h-full bg-marca transition-[width]"
              style={{ width: `${(probados / total) * 100}%` }}
            />
          </div>
          <p className="tabular mt-2 text-sm">
            <strong>{probados}</strong> de {total} pasos
          </p>
          <p className="tabular mt-0.5 text-xs text-tinta-suave">
            {conteo.ok} funcionan · {conteo.falla} fallan · {conteo.duda} con duda
          </p>
        </div>

        <nav aria-label="Secciones" className="mt-5 hidden lg:block">
          <ul className="space-y-0.5">
            {SECCIONES.map((s) => {
              const hechos = s.pasos.filter((p) => respuestas[p.id]?.estado).length
              return (
                <li key={s.id}>
                  <a
                    href={`#seccion-${s.id}`}
                    className="flex items-baseline justify-between gap-2 rounded-lg px-2.5 py-1.5 text-sm text-tinta-suave hover:bg-marca-tenue hover:text-marca"
                  >
                    <span>{s.titulo}</span>
                    <span className="tabular shrink-0 text-xs">
                      {hechos}/{s.pasos.length}
                    </span>
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="mt-5 flex flex-col gap-2">
          <Indicador estado={estadoGuardado} onReintentar={reintentar} />
          <Boton variante="contorno" onClick={copiarEnlace} className="justify-start">
            {copiado ? <Check size={16} /> : <Copy size={16} />}
            {copiado ? "Enlace copiado" : "Copiar mi enlace"}
          </Boton>
          <p className="text-xs text-tinta-suave">
            Con ese enlace puede continuar desde otro equipo.
          </p>
        </div>
      </aside>

      <main className="min-w-0">
        <div role="group" aria-label="Filtrar pasos" className="flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <button
              key={f.valor}
              type="button"
              aria-pressed={filtro === f.valor}
              onClick={() => setFiltro(f.valor)}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                filtro === f.valor
                  ? "border-marca bg-marca-tenue font-medium text-marca"
                  : "border-linea-fuerte bg-superficie text-tinta-suave hover:border-tinta-suave"
              }`}
            >
              {f.etiqueta}
            </button>
          ))}
        </div>

        {SECCIONES.map((seccion) => {
          const pasos = seccion.pasos.filter(visible)
          if (pasos.length === 0) return null
          return (
            <section
              key={seccion.id}
              id={`seccion-${seccion.id}`}
              aria-labelledby={`titulo-${seccion.id}`}
              className="mt-10 scroll-mt-4"
            >
              <h2 id={`titulo-${seccion.id}`} className="text-xl font-semibold tracking-tight">
                {seccion.titulo}
              </h2>
              <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-tinta">
                <Texto>{seccion.resumen}</Texto>
              </p>
              {seccion.cuenta && (
                <p className="mt-2 border-l-2 border-acento pl-3 text-sm text-tinta-suave">
                  <Texto>{seccion.cuenta}</Texto>
                </p>
              )}
              <div className="mt-4 space-y-4">
                {pasos.map((paso) => (
                  <TarjetaPaso
                    key={paso.id}
                    paso={paso}
                    respuesta={respuestas[paso.id]}
                    onCambio={(parche, espera) => cambiar(paso, parche, espera)}
                  />
                ))}
              </div>
            </section>
          )
        })}

        {filtro !== "todos" && TODOS_LOS_PASOS.every((p) => !visible(p)) && (
          <p className="mt-10 text-sm text-tinta-suave">No hay pasos con ese filtro.</p>
        )}

        <section className="mt-12 border-t border-linea pt-8" aria-labelledby="titulo-general">
          <h2 id="titulo-general" className="text-xl font-semibold tracking-tight">
            Para terminar: su impresión general
          </h2>
          <p className="mt-2 max-w-prose text-[15px] leading-relaxed">
            ¿Qué le gustó? ¿Qué le falta? ¿Qué cambiaría antes de usarlo con pacientes reales? Escriba
            con libertad: es lo que más me ayuda a decidir qué sigue.
          </p>
          <AreaTexto
            etiqueta="Impresión general"
            className="mt-4"
            rows={6}
            maxLength={8000}
            value={general}
            onChange={(e) => {
              setGeneral(e.target.value)
              guardarGeneral(e.target.value)
            }}
          />
        </section>
      </main>
    </div>
  )
}

function Indicador({ estado, onReintentar }: { estado: EstadoGuardado; onReintentar: () => void }) {
  if (estado === "pendiente") {
    return (
      <Aviso tono="advertencia" className="text-sm">
        <span className="flex items-center gap-2">
          <CloudOff size={16} aria-hidden /> No se pudo guardar. Está a salvo en este equipo.
        </span>
        <button type="button" onClick={onReintentar} className="mt-1 font-medium underline">
          Reintentar ahora
        </button>
      </Aviso>
    )
  }
  return (
    <p role="status" className="flex items-center gap-2 text-sm text-tinta-suave">
      <Cloud size={16} aria-hidden />
      {estado === "guardando" ? "Guardando…" : "Todo guardado"}
    </p>
  )
}

const VEREDICTOS: {
  valor: Exclude<GuiaEstado, "">
  etiqueta: string
  icono: typeof CircleCheck
  borde: string
}[] = [
  { valor: "ok", etiqueta: "Funciona", icono: CircleCheck, borde: "border-l-exito" },
  { valor: "falla", etiqueta: "Falla", icono: CircleX, borde: "border-l-error" },
  { valor: "duda", etiqueta: "Duda / mejorar", icono: CircleHelp, borde: "border-l-aviso" },
]

function TarjetaPaso({
  paso,
  respuesta,
  onCambio,
}: {
  paso: PasoGuia
  respuesta: Respuesta | undefined
  onCambio: (parche: Partial<Respuesta>, espera?: number) => void
}) {
  const estado = respuesta?.estado ?? ""
  const borde = VEREDICTOS.find((v) => v.valor === estado)?.borde ?? "border-l-linea-fuerte"
  const dudaEscrita = respuesta?.nota ?? ""

  return (
    <article
      id={`paso-${paso.id}`}
      className={`scroll-mt-4 rounded-xl border border-l-4 border-linea ${borde} bg-superficie p-5`}
    >
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-mono text-xs text-tinta-suave">{paso.id}</span>
        <h3 className="text-base font-semibold">{paso.titulo}</h3>
        <span className="rounded-full bg-esmalte px-2 py-0.5 text-xs text-tinta-suave">
          {QUIEN[paso.quien as Quien]}
        </span>
      </header>

      <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-tinta">
        <Texto>{paso.porque}</Texto>
      </p>

      {paso.ir && (
        <a
          href={paso.ir}
          target="_blank"
          rel="noopener"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-marca underline-offset-2 hover:underline"
        >
          Abrir en el sistema <ExternalLink size={14} aria-hidden />
        </a>
      )}

      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-tinta-suave">Qué hacer</h4>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed">
            {paso.pasos.map((p) => (
              <li key={p}>
                <Texto>{p}</Texto>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-tinta-suave">
            Qué debería ver
          </h4>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
            {paso.esperado.map((p) => (
              <li key={p}>
                <Texto>{p}</Texto>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5 border-t border-linea pt-4">
        <div role="group" aria-label={`Resultado de ${paso.titulo}`} className="flex flex-wrap gap-2">
          {VEREDICTOS.map(({ valor, etiqueta, icono: Icono }) => {
            const activo = estado === valor
            return (
              <button
                key={valor}
                type="button"
                aria-pressed={activo}
                onClick={() => onCambio({ estado: activo ? "" : valor }, 250)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm transition-colors ${
                  activo
                    ? "border-marca bg-marca-tenue font-medium text-marca"
                    : "border-linea-fuerte bg-superficie text-tinta-suave hover:border-tinta-suave"
                }`}
              >
                <Icono size={16} aria-hidden />
                {etiqueta}
              </button>
            )
          })}
        </div>
        <AreaTexto
          id={`nota-${paso.id}`}
          etiqueta="Su comentario o duda"
          opcional
          className="mt-3"
          rows={2}
          maxLength={4000}
          placeholder={
            estado === "falla"
              ? "¿Qué vio que no debía? Si hubo un mensaje de error, cópielo aquí."
              : "Escriba aquí lo que no entendió o lo que cambiaría."
          }
          value={dudaEscrita}
          onChange={(e) => onCambio({ nota: e.target.value })}
        />
      </div>
    </article>
  )
}
