import type { Catalogos, Hallazgo, Odontograma as OdontogramaDatos } from "../../api/tipos"
import { Diente } from "./Diente"
import { FILAS_PERMANENTE, FILAS_TEMPORAL } from "./geometria"

type OdontogramaProps = {
  datos: OdontogramaDatos
  catalogos: Catalogos
  piezaSeleccionada?: number | null
  soloLectura?: boolean
  onElegirCara?: (codigoFdi: number, superficie: string | null) => void
}

/**
 * Lienzo del odontograma: cuatro cuadrantes en dos arcadas.
 *
 * Se dibuja según la dentición del propio odontograma: permanente (11–48) o
 * temporal (51–85).
 */
export function Odontograma({
  datos,
  catalogos,
  piezaSeleccionada,
  soloLectura = false,
  onElegirCara,
}: OdontogramaProps) {
  const porCodigo = new Map(catalogos.dientes.map((d) => [d.codigo_fdi, d]))

  const hallazgosPorPieza = new Map<number, Hallazgo[]>()
  for (const hallazgo of datos.hallazgos) {
    const lista = hallazgosPorPieza.get(hallazgo.codigo_fdi) ?? []
    lista.push(hallazgo)
    hallazgosPorPieza.set(hallazgo.codigo_fdi, lista)
  }

  const ausentes = new Set(
    datos.dientes.filter((d) => d.presente === false).map((d) => d.codigo_fdi),
  )

  const filas = datos.denticion === "temporal" ? FILAS_TEMPORAL : FILAS_PERMANENTE

  function arcada(cuadrantes: readonly (readonly number[])[]) {
    return (
      <div className="flex justify-center gap-5">
        {cuadrantes.map((piezas, indice) => (
          <div key={indice} className="flex gap-1">
            {piezas.map((codigo) => {
              const catalogo = porCodigo.get(codigo)
              if (!catalogo) return null

              return (
                <Diente
                  key={codigo}
                  catalogo={catalogo}
                  hallazgos={hallazgosPorPieza.get(codigo) ?? []}
                  ausente={ausentes.has(codigo)}
                  seleccionado={piezaSeleccionada === codigo}
                  soloLectura={soloLectura}
                  onElegirCara={onElegirCara}
                />
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <div className="mx-auto w-fit space-y-3 px-2 py-1">
        {arcada(filas.superior)}
        <div className="h-px bg-linea" role="separator" aria-label="Línea oclusal" />
        {arcada(filas.inferior)}
      </div>
    </div>
  )
}
