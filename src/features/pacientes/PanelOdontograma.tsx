import { useState } from "react"
import { History, Plus, Trash2 } from "lucide-react"

import { ApiError } from "../../api/client"
import type { CondicionDental, EstadoHallazgo } from "../../api/tipos"
import { Cargando } from "../../components/brand"
import { Odontograma } from "../../components/odontograma/Odontograma"
import { PaletaCondiciones } from "../../components/odontograma/PaletaCondiciones"
import { Boton, ErrorCarga, Tarjeta, Vacio } from "../../components/ui"
import { useAuth } from "../auth/contexto"
import {
  useBorrarHallazgo,
  useCatalogos,
  useCrearVersion,
  useOdontograma,
  useRegistrarHallazgo,
  useVersionConcreta,
  useVersiones,
} from "./consultas"

export function PanelOdontograma({ pacienteId }: { pacienteId: number }) {
  const { puede } = useAuth()
  const catalogos = useCatalogos()
  const vigente = useOdontograma(pacienteId)
  const versiones = useVersiones(pacienteId)

  const [versionVista, setVersionVista] = useState<number | null>(null)
  const historica = useVersionConcreta(versionVista)

  const [condicion, setCondicion] = useState<CondicionDental | null>(null)
  const [estado, setEstado] = useState<EstadoHallazgo>("existente")
  const [aviso, setAviso] = useState<string | null>(null)

  const crearVersion = useCrearVersion(pacienteId)
  const datos = versionVista ? historica.data : vigente.data
  const odontogramaId = vigente.data?.id ?? 0

  const registrar = useRegistrarHallazgo(pacienteId, odontogramaId)
  const borrar = useBorrarHallazgo(pacienteId, odontogramaId)

  const puedeEditar = puede("doctor", "asistente")
  const soloLectura = !puedeEditar || versionVista !== null

  if (catalogos.isPending || vigente.isPending) {
    return (
      <div className="grid place-items-center py-16 text-marca">
        <Cargando label="Cargando el odontograma" />
      </div>
    )
  }

  if (catalogos.error) return <ErrorCarga error={catalogos.error} />

  // Un 404 aquí no es un fallo: el paciente aún no tiene odontograma.
  if (vigente.error) {
    const sinOdontograma = vigente.error instanceof ApiError && vigente.error.status === 404
    if (!sinOdontograma) return <ErrorCarga error={vigente.error} />

    return (
      <Vacio
        titulo="Este paciente no tiene odontograma"
        descripcion="Crea la primera versión para empezar a registrar hallazgos."
        accion={
          puedeEditar && (
            <Boton onClick={() => crearVersion.mutate({ copiar_hallazgos: false })}>
              <Plus className="h-4 w-4" aria-hidden />
              Crear odontograma
            </Boton>
          )
        }
      />
    )
  }

  async function alElegirCara(codigoFdi: number, superficie: string | null) {
    if (soloLectura || !condicion) {
      if (!condicion) setAviso("Elige primero una condición en la paleta.")
      return
    }

    setAviso(null)
    try {
      await registrar.mutateAsync({
        codigo_fdi: codigoFdi,
        superficie,
        condicion_dental_id: condicion.id,
        estado,
      })
    } catch (fallo) {
      setAviso(fallo instanceof ApiError ? fallo.detail : "No se pudo registrar el hallazgo")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <History className="h-4 w-4 text-tinta-suave" aria-hidden />
          <label htmlFor="version" className="text-tinta-suave">
            Versión
          </label>
          <select
            id="version"
            value={versionVista ?? "vigente"}
            onChange={(e) =>
              setVersionVista(e.target.value === "vigente" ? null : Number(e.target.value))
            }
            className="rounded-lg border border-linea-fuerte bg-superficie px-2 py-1.5 text-sm"
          >
            <option value="vigente">
              v{vigente.data.version} · vigente
            </option>
            {(versiones.data ?? [])
              .filter((v) => !v.es_actual)
              .map((v) => (
                <option key={v.id} value={v.id}>
                  v{v.version} · {v.fecha}
                </option>
              ))}
          </select>
        </div>

        {puedeEditar && (
          <Boton
            variante="contorno"
            onClick={() => {
              setVersionVista(null)
              crearVersion.mutate({ copiar_hallazgos: true })
            }}
            disabled={crearVersion.isPending}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Nueva versión
          </Boton>
        )}
      </div>

      {versionVista !== null && (
        <p className="rounded-lg border border-linea bg-esmalte px-3 py-2 text-sm text-tinta-suave">
          Estás viendo una versión histórica. Es de solo lectura: para registrar algo nuevo,
          vuelve a la vigente.
        </p>
      )}

      <Tarjeta className="p-4">
        {datos ? (
          <Odontograma
            datos={datos}
            catalogos={catalogos.data}
            soloLectura={soloLectura}
            onElegirCara={alElegirCara}
          />
        ) : (
          <div className="grid place-items-center py-10 text-marca">
            <Cargando label="Cargando la versión" />
          </div>
        )}
      </Tarjeta>

      {aviso && (
        <p role="alert" className="rounded-lg border border-linea-fuerte px-3 py-2 text-sm">
          {aviso}
        </p>
      )}

      {!soloLectura && (
        <Tarjeta className="p-4">
          <PaletaCondiciones
            condiciones={catalogos.data.condiciones}
            condicionElegida={condicion}
            estadoElegido={estado}
            onElegirCondicion={setCondicion}
            onElegirEstado={setEstado}
          />
          <p className="mt-4 border-t border-linea pt-3 text-sm text-tinta-suave">
            {condicion
              ? `Haz clic en una cara para registrar «${condicion.nombre}». Para un hallazgo de la pieza completa, usa su número.`
              : "Elige una condición y haz clic sobre el diente."}
          </p>
        </Tarjeta>
      )}

      {datos && datos.hallazgos.length > 0 && (
        <Tarjeta className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-linea text-left text-tinta-suave">
              <tr>
                <th className="px-4 py-2.5 font-medium">Pieza</th>
                <th className="px-4 py-2.5 font-medium">Cara</th>
                <th className="px-4 py-2.5 font-medium">Hallazgo</th>
                <th className="px-4 py-2.5 font-medium">Estado</th>
                <th className="px-4 py-2.5 font-medium">Fecha</th>
                {!soloLectura && <th className="w-10 px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody>
              {[...datos.hallazgos]
                .sort((a, b) => a.codigo_fdi - b.codigo_fdi)
                .map((hallazgo) => (
                  <tr key={hallazgo.id} className="border-b border-linea last:border-0">
                    <td className="tabular px-4 py-2 font-mono">{hallazgo.codigo_fdi}</td>
                    <td className="px-4 py-2 font-mono text-tinta-suave">
                      {hallazgo.superficie ?? "pieza"}
                    </td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="h-3 w-3 shrink-0 rounded-sm"
                          style={{ backgroundColor: hallazgo.color_hex }}
                          aria-hidden
                        />
                        {hallazgo.condicion_nombre}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-tinta-suave">{hallazgo.estado}</td>
                    <td className="tabular px-4 py-2 font-mono text-tinta-suave">
                      {hallazgo.fecha}
                    </td>
                    {!soloLectura && (
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => borrar.mutate(hallazgo.id)}
                          title="Quitar este hallazgo"
                          aria-label={`Quitar ${hallazgo.condicion_nombre} de la pieza ${hallazgo.codigo_fdi}`}
                          className="rounded p-1 text-tinta-suave transition-colors hover:bg-esmalte hover:text-tinta"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </Tarjeta>
      )}
    </div>
  )
}
