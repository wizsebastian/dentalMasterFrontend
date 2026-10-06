import { useState } from "react"
import { Pencil } from "lucide-react"

import { ApiError } from "../../api/client"
import type { Plantilla } from "../../api/tipos"
import {
  AreaTexto,
  Aviso,
  Boton,
  Campo,
  Casilla,
  Dialogo,
  ErrorCarga,
  EsqueletoTabla,
  Insignia,
  PieDialogo,
  Tarjeta,
  useAviso,
} from "../../components/ui"
import { useGuardarPlantilla, usePlantillas } from "../documentos/consultas"
import { TIPOS, VARIABLES } from "../documentos/textos"

function Formulario({ plantilla, alCerrar }: { plantilla: Plantilla; alCerrar: () => void }) {
  const avisar = useAviso()
  const guardar = useGuardarPlantilla()
  const [titulo, setTitulo] = useState(plantilla.titulo)
  const [cuerpo, setCuerpo] = useState(plantilla.cuerpo)
  const [activo, setActivo] = useState(plantilla.activo)
  const [fallo, setFallo] = useState<string | null>(null)

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    setFallo(null)
    try {
      await guardar.mutateAsync({ id: plantilla.id, datos: { titulo: titulo.trim(), cuerpo, activo } })
      avisar("Plantilla guardada")
      alCerrar()
    } catch (e) {
      setFallo(e instanceof ApiError ? e.detail : "No se pudo guardar la plantilla")
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-4">
      <Campo etiqueta="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      <AreaTexto
        etiqueta="Texto"
        rows={14}
        value={cuerpo}
        onChange={(e) => setCuerpo(e.target.value)}
        className="[&_textarea]:font-mono [&_textarea]:text-xs"
      />
      <div>
        <p className="text-xs text-tinta-suave">
          Variables que se sustituyen al emitir. Pulsa una para añadirla al final:
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {VARIABLES.map((variable) => (
            <button
              key={variable}
              type="button"
              onClick={() => setCuerpo(`${cuerpo}{{${variable}}}`)}
              className="rounded-md border border-linea-fuerte px-1.5 py-0.5 font-mono text-xs hover:border-marca hover:bg-marca-tenue"
            >
              {`{{${variable}}}`}
            </button>
          ))}
        </div>
      </div>
      <Casilla
        etiqueta="Activa"
        ayuda="Una plantilla inactiva deja de ofrecerse; lo ya emitido no cambia."
        checked={activo}
        onChange={(e) => setActivo(e.target.checked)}
      />

      {fallo && <Aviso>{fallo}</Aviso>}

      <PieDialogo>
        <Boton type="button" variante="contorno" onClick={alCerrar}>
          Cancelar
        </Boton>
        <Boton type="submit" disabled={guardar.isPending || !titulo.trim() || !cuerpo.trim()}>
          Guardar plantilla
        </Boton>
      </PieDialogo>
    </form>
  )
}

/** Los textos base de constancias, licencias, cuidados y consentimientos. */
export function PanelPlantillas() {
  const { data, isPending, error } = usePlantillas(true)
  const [editando, setEditando] = useState<Plantilla | null>(null)

  return (
    <div className="max-w-3xl">
      <p className="text-sm text-tinta-suave">
        Cambiar una plantilla afecta sólo a los documentos que se emitan después: cada documento
        emitido guarda su propio texto.
      </p>

      <Tarjeta className="mt-4 overflow-hidden">
        {isPending ? (
          <EsqueletoTabla filas={5} />
        ) : error ? (
          <ErrorCarga error={error} className="m-4 border-0" />
        ) : (
          <ul>
            {data.map((p) => (
              <li
                key={p.id}
                className={`flex flex-wrap items-center justify-between gap-3 border-b border-linea px-4 py-2.5 text-sm last:border-0 ${
                  p.activo ? "" : "text-tinta-suave"
                }`}
              >
                <span>
                  <span className="font-medium">{p.titulo}</span>
                  <span className="ml-3 text-tinta-suave">{TIPOS[p.tipo] ?? p.tipo}</span>
                  {p.requiere_firma && <Insignia className="ml-3">Se firma</Insignia>}
                  {!p.activo && <Insignia className="ml-3">Inactiva</Insignia>}
                </span>
                <button
                  type="button"
                  onClick={() => setEditando(p)}
                  aria-label={`Editar la plantilla ${p.titulo}`}
                  className="rounded-lg p-1.5 text-tinta-suave hover:bg-marca-tenue hover:text-marca"
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>

      <Dialogo
        abierto={editando !== null}
        alCerrar={() => setEditando(null)}
        titulo="Editar plantilla"
        descripcion={editando ? TIPOS[editando.tipo] : undefined}
        ancho="lg"
      >
        {editando && <Formulario plantilla={editando} alCerrar={() => setEditando(null)} />}
      </Dialogo>
    </div>
  )
}
