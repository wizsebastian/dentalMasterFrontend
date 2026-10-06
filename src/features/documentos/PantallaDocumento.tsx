import type { ReactNode } from "react"
import { ArrowLeft, Printer } from "lucide-react"
import { Link, useParams } from "react-router-dom"

import { Cargando } from "../../components/brand"
import { Boton, ErrorCarga, Tarjeta } from "../../components/ui"
import { doctor, fecha, fechaLarga, hora } from "../../lib/formato"
import { usePaciente } from "../pacientes/consultas"
import { useDocumento, useDocumentos } from "./consultas"
import { FirmaDibujada } from "./Trazo"
import { Membrete } from "../clinica/Membrete"

/** La hoja con membrete que comparten los documentos y la receta. */
function Hoja({
  volver,
  titulo,
  children,
  pie,
}: {
  volver: { a: string; texto: string }
  titulo: string
  children: ReactNode
  pie?: ReactNode
}) {

  return (
    <div>
      <div className="no-imprimir mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          to={volver.a}
          className="inline-flex items-center gap-1.5 text-sm text-tinta-suave hover:text-tinta"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {volver.texto}
        </Link>
        <Boton onClick={() => window.print()}>
          <Printer className="h-4 w-4" aria-hidden />
          Imprimir
        </Boton>
      </div>

      <Tarjeta className="hoja mx-auto max-w-3xl p-8">
        <Membrete />
        <h1 className="mt-6 text-center text-xl font-semibold">{titulo}</h1>
        <div className="mt-6">{children}</div>
        {pie}
      </Tarjeta>
    </div>
  )
}

export function PantallaDocumento() {
  const { id } = useParams<{ id: string }>()
  const { data: documento, isPending, error } = useDocumento(Number(id))

  if (isPending) {
    return (
      <div className="grid place-items-center py-24 text-marca">
        <Cargando size="lg" label="Cargando el documento" />
      </div>
    )
  }
  if (error) return <ErrorCarga error={error} />

  return (
    <Hoja
      volver={{ a: `/pacientes/${documento.paciente_id}?pestana=documentos`, texto: "Documentos" }}
      titulo={documento.titulo}
      pie={
        <footer className="no-partir mt-10">
          {documento.anulado_en && (
            <p className="mb-4 border-2 border-tinta py-2 text-center font-semibold uppercase">
              Anulado · {documento.motivo_anulacion}
            </p>
          )}
          {documento.firmas.map((firma) => (
            <div key={firma.id} className="mt-4 w-72">
              <FirmaDibujada trazos={firma.trazo as number[][][]} className="h-20 w-full" />
              <p className="border-t border-tinta pt-1 text-sm">
                {firma.firmante_nombre}
                {firma.firmante_documento && (
                  <span className="tabular ml-2 font-mono text-xs">{firma.firmante_documento}</span>
                )}
              </p>
              <p className="text-xs text-tinta-suave">
                Firmó como {firma.firmante_rol} el {fecha(firma.firmado_en)} a las{" "}
                {hora(firma.firmado_en)}
              </p>
            </div>
          ))}
          {documento.firmas.length === 0 && documento.requiere_firma && !documento.anulado_en && (
            <p className="mt-16 w-72 border-t border-tinta pt-1 text-center text-sm">Firma</p>
          )}
          <p className="mt-8 font-mono text-[10px] text-tinta-suave">
            Emitido el {fecha(documento.emitido_en)} · huella {documento.sha256.slice(0, 16)}
          </p>
        </footer>
      }
    >
      <p className="whitespace-pre-line leading-relaxed">{documento.cuerpo}</p>
    </Hoja>
  )
}

export function PantallaReceta() {
  const { id, recetaId } = useParams<{ id: string; recetaId: string }>()
  const pacienteId = Number(id)
  const { data: paciente } = usePaciente(pacienteId)
  const { data, isPending, error } = useDocumentos(pacienteId)

  if (isPending) {
    return (
      <div className="grid place-items-center py-24 text-marca">
        <Cargando size="lg" label="Cargando la receta" />
      </div>
    )
  }
  if (error) return <ErrorCarga error={error} />

  const receta = data.recetas.find((r) => r.id === Number(recetaId))
  if (!receta) return <ErrorCarga error={new Error("La receta no existe")} />

  return (
    <Hoja
      volver={{ a: `/pacientes/${pacienteId}?pestana=documentos`, texto: "Documentos" }}
      titulo="Receta"
      pie={
        <footer className="no-partir mt-16">
          <p className="ml-auto w-72 border-t border-tinta pt-1 text-center text-sm">
            {doctor(receta.doctor_nombre)}
          </p>
        </footer>
      }
    >
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
        <div>
          <dt className="text-xs text-tinta-suave">Paciente</dt>
          <dd className="font-medium">{paciente ? `${paciente.nombres} ${paciente.apellidos}` : ""}</dd>
        </div>
        <div>
          <dt className="text-xs text-tinta-suave">Fecha</dt>
          <dd className="first-letter:uppercase">{fechaLarga(receta.fecha)}</dd>
        </div>
      </dl>

      <ol className="mt-6 space-y-3">
        {receta.items.map((item, i) => (
          <li key={i} className="no-partir">
            <p className="font-semibold">
              {i + 1}. {item.medicamento}
              {item.presentacion && <span className="font-normal"> · {item.presentacion}</span>}
            </p>
            <p className="ml-5 text-sm">
              {item.dosis}, {item.frecuencia.toLowerCase()}
              {item.duracion && `, durante ${item.duracion.toLowerCase()}`}.
            </p>
          </li>
        ))}
      </ol>

      {receta.indicaciones && (
        <p className="mt-6 whitespace-pre-line text-sm">
          <span className="font-semibold">Indicaciones: </span>
          {receta.indicaciones}
        </p>
      )}
    </Hoja>
  )
}
