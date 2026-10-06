import {
  Children,
  Fragment,
  isValidElement,
  useCallback,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type CSSProperties,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  type TextareaHTMLAttributes,
} from "react"
import { Check, ChevronDown, Search } from "lucide-react"

import { mascaraTelefono } from "../../lib/formato"
import { plano } from "../../lib/texto"

/* Campos de formulario. Todos aceptan `ref` (React 19 lo pasa como prop), así
   que funcionan con `{...register("campo")}` de react-hook-form sin envoltorio. */

function idDe(etiqueta: string, id?: string) {
  return id ?? `campo-${etiqueta.toLowerCase().replace(/[^a-z0-9áéíóúñ]+/g, "-")}`
}

const CAJA =
  "mt-1.5 block w-full rounded-lg border bg-superficie px-3 py-2 text-sm placeholder:text-tinta-suave/60 disabled:bg-esmalte disabled:text-tinta-suave"

function borde(error?: string) {
  return error ? "border-error" : "border-linea-fuerte"
}

function Etiqueta({ para, texto, opcional }: { para: string; texto: string; opcional?: boolean }) {
  return (
    <label htmlFor={para} className="block text-sm font-medium">
      {texto}
      {opcional && <span className="ml-1.5 font-normal text-tinta-suave">opcional</span>}
    </label>
  )
}

function Pie({ id, error, ayuda }: { id: string; error?: string; ayuda?: string }) {
  if (error) {
    return (
      <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-error">
        {error}
      </p>
    )
  }
  return ayuda ? <p className="mt-1.5 text-sm text-tinta-suave">{ayuda}</p> : null
}

type Comun = { etiqueta: string; error?: string; ayuda?: string; opcional?: boolean }

export function Campo({
  etiqueta,
  error,
  ayuda,
  opcional,
  className = "",
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & Comun) {
  const campoId = idDe(etiqueta, id)

  return (
    <div className={className}>
      <Etiqueta para={campoId} texto={etiqueta} opcional={opcional} />
      <input
        id={campoId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${campoId}-error` : undefined}
        className={`${CAJA} ${borde(error)}`}
        {...props}
      />
      <Pie id={campoId} error={error} ayuda={ayuda} />
    </div>
  )
}

/**
 * Teléfono con máscara `(809) 555-0100`. Da formato mientras se escribe y al
 * pegar, y conserva la posición del cursor. Funciona con `register()`: el valor
 * que lee el formulario es ya el formateado.
 */
export function CampoTelefono({
  onChange,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "inputMode"> & Comun) {
  return (
    <Campo
      type="tel"
      inputMode="tel"
      autoComplete="tel-national"
      placeholder="(809) 555-0100"
      {...props}
      onChange={(evento) => {
        const el = evento.currentTarget
        const cursor = el.selectionStart ?? el.value.length
        const antes = (el.value.slice(0, cursor).match(/\d/g) ?? []).length
        const formateado = mascaraTelefono(el.value)
        el.value = formateado
        // El cursor se queda detrás del mismo dígito, no salta al final.
        let vistos = 0
        let pos = 0
        while (pos < formateado.length && vistos < antes) {
          if (/\d/.test(formateado[pos])) vistos++
          pos++
        }
        el.setSelectionRange(pos, pos)
        onChange?.(evento)
      }}
    />
  )
}

/** Fecha de calendario. El valor es siempre ISO (`2026-10-03`); cómo la enseña
    el selector lo decide el navegador, y fuera del campo la pinta `formato.fecha`. */
export function CampoFecha(props: InputHTMLAttributes<HTMLInputElement> & Comun) {
  return <Campo type="date" {...props} />
}

export function AreaTexto({
  etiqueta,
  error,
  ayuda,
  opcional,
  className = "",
  id,
  rows = 3,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & Comun) {
  const campoId = idDe(etiqueta, id)

  return (
    <div className={className}>
      <Etiqueta para={campoId} texto={etiqueta} opcional={opcional} />
      <textarea
        id={campoId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${campoId}-error` : undefined}
        className={`${CAJA} ${borde(error)} resize-y`}
        {...props}
      />
      <Pie id={campoId} error={error} ayuda={ayuda} />
    </div>
  )
}

type OpcionLista = { valor: string; texto: string; grupo?: string; deshabilitada?: boolean }

/** El texto de un nodo, sin etiquetas: `<option>{a}{b}</option>` llega como lista. */
function aTexto(nodo: ReactNode): string {
  return Children.toArray(nodo)
    .map((n) => {
      if (typeof n === "string" || typeof n === "number") return String(n)
      if (isValidElement(n)) return aTexto((n.props as { children?: ReactNode }).children)
      return ""
    })
    .join("")
}

/** Las `<option>` (y `<optgroup>`) que el llamador escribió, como datos. */
function leerOpciones(hijos: ReactNode, grupo?: string, salida: OpcionLista[] = []): OpcionLista[] {
  for (const hijo of Children.toArray(hijos)) {
    if (!isValidElement(hijo)) continue
    const p = hijo.props as {
      value?: string | number
      label?: string
      disabled?: boolean
      children?: ReactNode
    }
    if (hijo.type === "optgroup") leerOpciones(p.children, p.label, salida)
    else if (hijo.type === Fragment) leerOpciones(p.children, grupo, salida)
    else if (hijo.type === "option") {
      const texto = aTexto(p.children)
      salida.push({
        valor: p.value !== undefined ? String(p.value) : texto,
        texto,
        grupo,
        deshabilitada: p.disabled,
      })
    }
  }
  return salida
}

const DESCRIPTOR_VALUE = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")!
const INSTALADOS = new WeakSet<HTMLSelectElement>()

function asignarRef<T>(ref: Ref<T> | undefined, valor: T | null) {
  if (typeof ref === "function") ref(valor)
  else if (ref) (ref as { current: T | null }).current = valor
}

/**
 * Un `<select>` con buscador.
 *
 * El `<select>` nativo sigue en el DOM, oculto a la vista: es la fuente de
 * verdad del formulario (`register()` de react-hook-form, `value`/`onChange`) y
 * lo que lee un lector de pantalla y se maneja con el teclado. Encima se pinta
 * una caja que, al pulsarla, abre una lista con búsqueda sin tildes. Elegir en
 * ella cambia el valor del nativo y dispara su evento `change`, así que quien
 * lo usa no se entera de la diferencia.
 */
function SelectorBuscable({
  claseCaja,
  estiloCaja,
  invalido,
  className = "",
  children,
  ref,
  ...props
}: ComponentProps<"select"> & {
  claseCaja: string
  estiloCaja?: CSSProperties
  invalido?: boolean
}) {
  const nativo = useRef<HTMLSelectElement | null>(null)
  const disparador = useRef<HTMLButtonElement | null>(null)
  const entrada = useRef<HTMLInputElement | null>(null)
  const oyentes = useRef(new Set<() => void>())
  const [abierto, setAbierto] = useState(false)
  const [consulta, setConsulta] = useState("")
  const [activa, setActiva] = useState(0)
  const [lugar, setLugar] = useState<{ x: number; y: number; ancho: number; arriba: boolean }>()
  const lista = useId()

  const opciones = leerOpciones(children)

  const suscribir = useCallback((oyente: () => void) => {
    const conjunto = oyentes.current
    conjunto.add(oyente)
    return () => {
      conjunto.delete(oyente)
    }
  }, [])
  // El valor lo manda el DOM: lo cambian React (controlado), react-hook-form
  // (`reset`, `setValue`: asignan `.value` sin evento) y el propio usuario.
  const valor = useSyncExternalStore(suscribir, () => nativo.current?.value ?? "")

  const alMontar = (el: HTMLSelectElement | null) => {
    nativo.current = el
    if (el && !INSTALADOS.has(el)) {
      INSTALADOS.add(el)
      const avisar = () => oyentes.current.forEach((o) => o())
      Object.defineProperty(el, "value", {
        configurable: true,
        get: () => DESCRIPTOR_VALUE.get!.call(el),
        set: (v: string) => {
          DESCRIPTOR_VALUE.set!.call(el, v)
          avisar()
        },
      })
      el.addEventListener("change", avisar)
    }
    asignarRef(ref, el)
  }

  const elegida = opciones.find((o) => o.valor === valor)
  const vacia = opciones.find((o) => o.valor === "")
  const rotulo = elegida && elegida.valor !== "" ? elegida.texto : (vacia?.texto ?? "Elige…")
  const sinElegir = !elegida || elegida.valor === ""

  const aguja = plano(consulta.trim())
  const visibles = opciones.filter(
    (o) => !aguja || plano(`${o.texto} ${o.grupo ?? ""}`).includes(aguja),
  )
  const indice = Math.min(activa, Math.max(visibles.length - 1, 0))

  function abrir() {
    const caja = disparador.current?.getBoundingClientRect()
    if (!caja) return
    // Se abre hacia arriba si abajo no cabe: dentro de un diálogo no hay más sitio.
    const arriba = window.innerHeight - caja.bottom < 320 && caja.top > window.innerHeight - caja.bottom
    setLugar({
      x: caja.left,
      y: arriba ? caja.top : caja.bottom,
      ancho: Math.max(caja.width, 224),
      arriba,
    })
    setConsulta("")
    setActiva(Math.max(visibles.findIndex((o) => o.valor === valor), 0))
    setAbierto(true)
  }

  function cerrar(devolverFoco = true) {
    setAbierto(false)
    if (devolverFoco) nativo.current?.focus()
  }

  function elegir(opcion: OpcionLista) {
    const el = nativo.current
    if (el && opcion.valor !== el.value) {
      DESCRIPTOR_VALUE.set!.call(el, opcion.valor)
      el.dispatchEvent(new Event("change", { bubbles: true }))
    }
    cerrar()
  }

  function alTeclear(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiva(Math.min(indice + 1, visibles.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiva(Math.max(indice - 1, 0))
    } else if (e.key === "Enter") {
      // Enter elige; no debe enviar el formulario que contiene el campo.
      e.preventDefault()
      const opcion = visibles[indice]
      if (opcion && !opcion.deshabilitada) elegir(opcion)
    } else if (e.key === "Escape") {
      // Esc cierra la lista, no el diálogo que la contiene.
      e.preventDefault()
      e.stopPropagation()
      cerrar()
    } else if (e.key === "Tab") {
      cerrar(false)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <select ref={alMontar} className="peer sr-only" {...props}>
        {children}
      </select>

      {/* La caja que se ve. El nativo es el que se nombra y se enfoca. */}
      <button
        ref={disparador}
        type="button"
        tabIndex={-1}
        aria-hidden
        disabled={props.disabled}
        style={estiloCaja}
        onClick={() => (abierto ? cerrar(false) : abrir())}
        className={`${claseCaja} flex w-full items-center justify-between gap-2 text-left
          peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-marca
          ${invalido ? "border-error" : "border-linea-fuerte"}`}
      >
        <span className={`truncate ${sinElegir ? "text-tinta-suave/70" : ""}`}>{rotulo}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-tinta-suave" aria-hidden />
      </button>

      {abierto && lugar && (
        <>
          {/* Cierra al pulsar fuera, sin tapar el diálogo que la contiene. */}
          <div className="fixed inset-0 z-40" onPointerDown={() => cerrar(false)} aria-hidden />
          <div
            style={{
              position: "fixed",
              left: lugar.x,
              width: lugar.ancho,
              ...(lugar.arriba
                ? { bottom: window.innerHeight - lugar.y + 4 }
                : { top: lugar.y + 4 }),
            }}
            className="z-50 overflow-hidden rounded-lg border border-linea-fuerte bg-superficie shadow-lg"
          >
            <div className="relative border-b border-linea">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-suave"
                aria-hidden
              />
              <input
                ref={(el) => {
                  entrada.current = el
                  el?.focus()
                }}
                type="search"
                role="combobox"
                aria-expanded
                aria-controls={lista}
                aria-label="Buscar en la lista"
                placeholder="Escribe para buscar…"
                autoComplete="off"
                value={consulta}
                onChange={(e) => {
                  setConsulta(e.target.value)
                  setActiva(0)
                }}
                onKeyDown={alTeclear}
                className="block w-full bg-transparent py-2 pl-9 pr-3 text-sm placeholder:text-tinta-suave/60"
              />
            </div>
            <ul id={lista} role="listbox" className="max-h-64 overflow-y-auto p-1">
              {visibles.map((opcion, i) => (
                <li key={`${opcion.grupo ?? ""}-${opcion.valor}`} role="presentation">
                  {opcion.grupo && opcion.grupo !== visibles[i - 1]?.grupo && (
                    <p className="px-2 pb-1 pt-2 text-xs font-semibold text-tinta-suave">
                      {opcion.grupo}
                    </p>
                  )}
                  <div
                    role="option"
                    aria-selected={opcion.valor === valor}
                    aria-disabled={opcion.deshabilitada}
                    onMouseEnter={() => setActiva(i)}
                    onClick={() => !opcion.deshabilitada && elegir(opcion)}
                    className={`flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm ${
                      i === indice ? "bg-marca-tenue" : ""
                    } ${opcion.deshabilitada ? "cursor-not-allowed opacity-40" : ""} ${
                      opcion.valor === "" ? "text-tinta-suave" : ""
                    }`}
                  >
                    <span>{opcion.texto || "—"}</span>
                    {opcion.valor === valor && <Check className="h-4 w-4 shrink-0 text-marca" aria-hidden />}
                  </div>
                </li>
              ))}
              {visibles.length === 0 && (
                <li className="px-2 py-3 text-center text-sm text-tinta-suave">Sin resultados</li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

export function Selector({
  etiqueta,
  error,
  ayuda,
  opcional,
  className = "",
  id,
  children,
  ...props
}: ComponentProps<"select"> & Comun & { children: ReactNode }) {
  const campoId = idDe(etiqueta, id)

  return (
    <div className={className}>
      <Etiqueta para={campoId} texto={etiqueta} opcional={opcional} />
      <SelectorBuscable
        id={campoId}
        invalido={Boolean(error)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${campoId}-error` : undefined}
        claseCaja={`${CAJA} border`}
        {...props}
      >
        {children}
      </SelectorBuscable>
      <Pie id={campoId} error={error} ayuda={ayuda} />
    </div>
  )
}

/**
 * El mismo selector con buscador, sin etiqueta visible: para filtros de una
 * barra. El nombre accesible va en `aria-label`.
 */
export function SelectorFiltro({
  className = "",
  claseCaja = "rounded-lg border bg-superficie px-3 py-1.5 text-sm",
  estiloCaja,
  children,
  ...props
}: ComponentProps<"select"> & {
  "aria-label": string
  claseCaja?: string
  estiloCaja?: CSSProperties
  children: ReactNode
}) {
  return (
    <SelectorBuscable className={className} claseCaja={claseCaja} estiloCaja={estiloCaja} {...props}>
      {children}
    </SelectorBuscable>
  )
}

export function Casilla({
  etiqueta,
  ayuda,
  className = "",
  id,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { etiqueta: string; ayuda?: string }) {
  const campoId = idDe(etiqueta, id)

  return (
    <div className={`flex items-start gap-2.5 ${className}`}>
      <input
        id={campoId}
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-linea-fuerte accent-marca"
        {...props}
      />
      <label htmlFor={campoId} className="text-sm">
        {etiqueta}
        {ayuda && <span className="block text-tinta-suave">{ayuda}</span>}
      </label>
    </div>
  )
}
