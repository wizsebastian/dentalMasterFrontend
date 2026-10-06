import { useState, type FormEvent } from "react"
import { useParams } from "react-router-dom"

import { ApiError } from "../../api/client"
import { Cargando, Logo } from "../../components/brand"
import { Aviso, Boton, Campo, Selector, Tarjeta } from "../../components/ui"
import { enviarFirma, useDocumentoParaFirmar } from "./consultas"
import { LienzoFirma, type Trazos } from "./Trazo"

/**
 * Página de firma. Va **fuera de la sesión**: se abre con un enlace que sirve
 * sólo para este documento y caduca, en la tableta del consultorio o en el
 * teléfono del paciente. Quien firma ve el documento y nada más.
 */
export function PantallaFirmar() {
  const { token = "" } = useParams<{ token: string }>()
  const { data: documento, isPending, error } = useDocumentoParaFirmar(token)

  const [nombre, setNombre] = useState("")
  const [rol, setRol] = useState("paciente")
  const [cedula, setCedula] = useState("")
  const [trazos, setTrazos] = useState<Trazos>([])
  const [enviando, setEnviando] = useState(false)
  const [fallo, setFallo] = useState<string | null>(null)
  const [firmado, setFirmado] = useState(false)

  const puntos = trazos.reduce((suma, trazo) => suma + trazo.length, 0)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setFallo(null)
    setEnviando(true)
    try {
      await enviarFirma(token, {
        firmante_nombre: nombre.trim(),
        firmante_rol: rol,
        firmante_documento: cedula.trim() || null,
        trazo: trazos,
      })
      setFirmado(true)
    } catch (e) {
      setFallo(e instanceof ApiError ? e.detail : "No se pudo enviar la firma")
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-5 py-8">
      <Logo />

      {isPending ? (
        <div className="grid place-items-center py-24 text-marca">
          <Cargando size="lg" label="Abriendo el documento" />
        </div>
      ) : error ? (
        <Tarjeta className="mt-8 p-6">
          <h1 className="text-lg font-semibold">Este enlace ya no sirve</h1>
          <p className="mt-2 text-sm text-tinta-suave">
            {error instanceof ApiError ? error.detail : "No se pudo abrir el documento."} Pide en la
            clínica que te generen uno nuevo.
          </p>
        </Tarjeta>
      ) : firmado || documento.ya_firmado ? (
        <Tarjeta className="mt-8 p-6">
          <h1 className="text-lg font-semibold">
            {firmado ? "Firma recibida. Gracias." : "Este documento ya está firmado"}
          </h1>
          <p className="mt-2 text-sm text-tinta-suave">
            {documento.titulo} · {documento.paciente_nombre}. Ya puedes cerrar esta página.
          </p>
        </Tarjeta>
      ) : (
        <form onSubmit={enviar} className="mt-8">
          <p className="text-sm text-tinta-suave">{documento.clinica_nombre}</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">{documento.titulo}</h1>

          <Tarjeta className="mt-4 max-h-[45dvh] overflow-y-auto p-5">
            <p className="whitespace-pre-line text-sm leading-relaxed">{documento.cuerpo}</p>
          </Tarjeta>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Campo
              etiqueta="Nombre de quien firma"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={documento.paciente_nombre}
              autoComplete="name"
            />
            <Selector etiqueta="Firma como" value={rol} onChange={(e) => setRol(e.target.value)}>
              <option value="paciente">Paciente</option>
              <option value="tutor">Padre, madre o tutor</option>
              <option value="testigo">Testigo</option>
            </Selector>
            <Campo
              etiqueta="Cédula"
              opcional
              className="sm:col-span-2"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
            />
          </div>

          <div className="mt-5">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-medium">Firma aquí</p>
              <button
                type="button"
                onClick={() => setTrazos([])}
                disabled={trazos.length === 0}
                className="text-sm text-tinta-suave underline-offset-2 hover:underline disabled:opacity-40"
              >
                Borrar y repetir
              </button>
            </div>
            <div className="mt-1.5">
              <LienzoFirma trazos={trazos} alCambiar={setTrazos} />
            </div>
          </div>

          {fallo && <Aviso className="mt-4">{fallo}</Aviso>}

          <Boton
            type="submit"
            className="mt-5 w-full py-3 text-base"
            disabled={enviando || nombre.trim().length < 3 || puntos < 8}
          >
            {enviando && <Cargando size="sm" label="Enviando" />}
            Firmar y enviar
          </Boton>
          <p className="mt-2 text-center text-xs text-tinta-suave">
            Al firmar declaras haber leído el documento y estar de acuerdo con él.
          </p>
        </form>
      )}
    </div>
  )
}
