import type { ReactNode } from "react"

/** Escribe un texto de la guía: `**negrita**` y `` `código` `` (los códigos reales van en mono). */
export function Texto({ children }: { children: string }) {
  const partes: ReactNode[] = []
  const patron = /\*\*(.+?)\*\*|`(.+?)`/g
  let desde = 0
  let m: RegExpExecArray | null
  while ((m = patron.exec(children)) !== null) {
    if (m.index > desde) partes.push(children.slice(desde, m.index))
    partes.push(
      m[1] !== undefined ? (
        <strong key={m.index}>{m[1]}</strong>
      ) : (
        <code key={m.index} className="rounded bg-esmalte px-1 font-mono text-[0.92em]">
          {m[2]}
        </code>
      ),
    )
    desde = m.index + m[0].length
  }
  if (desde < children.length) partes.push(children.slice(desde))
  return <>{partes}</>
}
