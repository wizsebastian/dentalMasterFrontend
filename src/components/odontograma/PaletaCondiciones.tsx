import type { CondicionDental, EstadoHallazgo } from "../../api/tipos"

const ESTADOS: { valor: EstadoHallazgo; etiqueta: string }[] = [
  { valor: "existente", etiqueta: "Existente" },
  { valor: "planificado", etiqueta: "Planificado" },
  { valor: "en_proceso", etiqueta: "En proceso" },
  { valor: "completado", etiqueta: "Completado" },
]

type PaletaProps = {
  condiciones: CondicionDental[]
  condicionElegida: CondicionDental | null
  estadoElegido: EstadoHallazgo
  onElegirCondicion: (condicion: CondicionDental | null) => void
  onElegirEstado: (estado: EstadoHallazgo) => void
}

/** Selector de qué se va a registrar al hacer clic en una cara. */
export function PaletaCondiciones({
  condiciones,
  condicionElegida,
  estadoElegido,
  onElegirCondicion,
  onElegirEstado,
}: PaletaProps) {
  const hallazgos = condiciones.filter((c) => c.patologico)
  const tratamientos = condiciones.filter((c) => !c.patologico)

  function grupo(titulo: string, lista: CondicionDental[]) {
    return (
      <div>
        <h3 className="text-sm font-semibold">{titulo}</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {lista.map((condicion) => {
            const activa = condicionElegida?.id === condicion.id
            return (
              <button
                key={condicion.id}
                type="button"
                onClick={() => onElegirCondicion(activa ? null : condicion)}
                aria-pressed={activa}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1
                  text-xs transition-colors
                  ${activa ? "border-marca bg-marca-tenue text-marca" : "border-linea hover:border-linea-fuerte"}`}
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: condicion.color_hex }}
                  aria-hidden
                />
                {condicion.nombre}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold">Estado</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ESTADOS.map((estado) => (
            <button
              key={estado.valor}
              type="button"
              onClick={() => onElegirEstado(estado.valor)}
              aria-pressed={estadoElegido === estado.valor}
              className={`rounded-lg border px-2.5 py-1 text-xs transition-colors
                ${estadoElegido === estado.valor ? "border-marca bg-marca-tenue text-marca" : "border-linea hover:border-linea-fuerte"}`}
            >
              {estado.etiqueta}
            </button>
          ))}
        </div>
      </div>

      {grupo("Hallazgos", hallazgos)}
      {grupo("Tratamientos", tratamientos)}
    </div>
  )
}
