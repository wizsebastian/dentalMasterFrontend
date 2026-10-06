import { useState, type FormEvent } from "react"

import { ApiError } from "../../api/client"
import { Boton } from "./basicos"
import { Campo } from "./campos"
import { Dialogo, PieDialogo } from "./Dialogo"

/**
 * Confirmación que exige decir por qué: anular un pago, un gasto, un documento.
 *
 * Lo que se anula no se borra, y el motivo queda guardado junto a ello.
 */
export function DialogoMotivo({
  abierto,
  alCerrar,
  titulo,
  descripcion,
  explicacion,
  accion,
  alConfirmar,
}: {
  abierto: boolean
  alCerrar: () => void
  titulo: string
  descripcion?: string
  explicacion: string
  /** Texto del botón que confirma. */
  accion: string
  alConfirmar: (motivo: string) => Promise<unknown>
}) {
  return (
    <Dialogo abierto={abierto} alCerrar={alCerrar} titulo={titulo} descripcion={descripcion} ancho="sm">
      <Formulario
        explicacion={explicacion}
        accion={accion}
        alCerrar={alCerrar}
        alConfirmar={alConfirmar}
      />
    </Dialogo>
  )
}

function Formulario({
  explicacion,
  accion,
  alCerrar,
  alConfirmar,
}: {
  explicacion: string
  accion: string
  alCerrar: () => void
  alConfirmar: (motivo: string) => Promise<unknown>
}) {
  const [motivo, setMotivo] = useState("")
  const [fallo, setFallo] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setFallo(null)
    setEnviando(true)
    try {
      await alConfirmar(motivo.trim())
      alCerrar()
    } catch (e) {
      setFallo(e instanceof ApiError ? e.detail : "No se pudo completar")
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} noValidate>
      <p className="mb-4 text-sm text-tinta-suave">{explicacion}</p>
      <Campo
        etiqueta="Motivo"
        autoFocus
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        error={fallo ?? undefined}
      />
      <PieDialogo>
        <Boton type="button" variante="contorno" onClick={alCerrar}>
          Cancelar
        </Boton>
        <Boton type="submit" disabled={enviando || motivo.trim().length < 3}>
          {accion}
        </Boton>
      </PieDialogo>
    </form>
  )
}
