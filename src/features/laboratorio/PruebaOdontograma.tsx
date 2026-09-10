import { lazy, Suspense, useMemo, useState } from "react"
import { RotateCcw } from "lucide-react"

import type { CondicionDental, EstadoHallazgo, Hallazgo } from "../../api/tipos"
import { Logo } from "../../components/brand"
import { Odontograma } from "../../components/odontograma/Odontograma"
import { CargandoOdontograma } from "./CargandoOdontograma"

// La arcada sí sale del bundle principal: sólo la usa este banco de pruebas.
// La rejilla no, porque el expediente clínico la importa de todas formas.
const ArcadaDental = lazy(async () => ({
  default: (await import("../../components/odontograma/ArcadaDental")).ArcadaDental,
}))
import { PaletaCondiciones } from "../../components/odontograma/PaletaCondiciones"
import { Boton, Tarjeta, VolverAtras } from "../../components/ui"
import {
  catalogoDientes,
  CONDICIONES,
  crearHallazgo,
  hallazgosDemo,
  PIEZAS_AUSENTES,
} from "./datos-demo"

type Representacion = "arcada" | "rejilla"

/**
 * Laboratorio del odontograma.
 *
 * Compara la representación en arcada con siluetas anatómicas contra la rejilla
 * que usa hoy el expediente. Todo el estado es local: esta vista no escribe en
 * la API ni afecta a ningún paciente.
 */
export function PruebaOdontograma() {
  const dientes = useMemo(() => catalogoDientes(), [])
  const [hallazgos, setHallazgos] = useState<Hallazgo[]>(hallazgosDemo)
  const [representacion, setRepresentacion] = useState<Representacion>("arcada")
  const [condicion, setCondicion] = useState<CondicionDental | null>(CONDICIONES[0])
  const [estado, setEstado] = useState<EstadoHallazgo>("existente")
  const [pieza, setPieza] = useState<number | null>(null)

  function marcar(codigoFdi: number, superficie: string | null) {
    setPieza(codigoFdi)
    if (!condicion) return

    // El ámbito manda: una corona o un implante no se registran en una cara.
    const caraReal = condicion.ambito === "superficie" ? superficie : null

    setHallazgos((previos) => {
      const yaEsta = previos.some(
        (h) =>
          h.codigo_fdi === codigoFdi &&
          h.superficie === caraReal &&
          h.condicion_dental_id === condicion.id &&
          h.estado === estado,
      )
      // Volver a hacer clic sobre lo mismo lo quita: en un banco de pruebas es
      // más cómodo que abrir un menú para borrar.
      if (yaEsta) {
        return previos.filter(
          (h) =>
            !(
              h.codigo_fdi === codigoFdi &&
              h.superficie === caraReal &&
              h.condicion_dental_id === condicion.id &&
              h.estado === estado
            ),
        )
      }
      return [...previos, crearHallazgo(codigoFdi, caraReal, condicion, estado)]
    })
  }

  const deLaPieza = hallazgos.filter((h) => h.codigo_fdi === pieza)
  const catalogoPieza = dientes.find((d) => d.codigo_fdi === pieza)

  // La vista en rejilla espera la forma completa de un odontograma de la API.
  const comoOdontograma = {
    id: 0,
    paciente_id: 0,
    version: 1,
    fecha: "2026-09-10",
    denticion: "permanente" as const,
    es_actual: true,
    doctor_id: null,
    observaciones: null,
    hallazgos,
    dientes: PIEZAS_AUSENTES.map((codigo_fdi) => ({
      codigo_fdi,
      presente: false,
      movilidad: null,
      recesion_mm: null,
      sondaje_mm: null,
      sangrado: false,
      notas: null,
    })),
  }

  return (
    <div className="min-h-dvh px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-linea pb-5">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="rounded-lg border border-linea-fuerte px-2.5 py-1 text-xs text-tinta-suave">
              Banco de pruebas · no toca ningún paciente
            </span>
            <VolverAtras />
          </div>
        </header>

        <h1 className="mt-8 text-2xl font-semibold tracking-tight">
          Cómo dibujar el odontograma
        </h1>
        <p className="mt-2 max-w-[68ch] leading-relaxed text-tinta-suave">
          Dos representaciones sobre los mismos datos. La arcada dibuja cada pieza con su
          silueta en vista oclusal, como las aplicaciones comerciales; la rejilla es la que
          usa hoy el expediente. En ambas se marca por cara, que es lo que exige el modelo
          de datos: las librerías de arcada publicadas sólo marcan la pieza entera.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-lg border border-linea-fuerte p-0.5">
            {(["arcada", "rejilla"] as const).map((modo) => (
              <button
                key={modo}
                type="button"
                onClick={() => setRepresentacion(modo)}
                aria-pressed={representacion === modo}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  representacion === modo
                    ? "bg-marca text-esmalte"
                    : "text-tinta-suave hover:text-tinta"
                }`}
              >
                {modo === "arcada" ? "Arcada anatómica" : "Rejilla actual"}
              </button>
            ))}
          </div>

          <Boton
            variante="contorno"
            onClick={() => {
              setHallazgos(hallazgosDemo())
              setPieza(null)
            }}
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Reiniciar
          </Boton>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_320px]">
          <Tarjeta className="p-5">
            <Suspense fallback={<CargandoOdontograma que="el odontograma" />}>
              {representacion === "arcada" ? (
                <ArcadaDental
                  dientes={dientes}
                  hallazgos={hallazgos}
                  ausentes={PIEZAS_AUSENTES}
                  piezaSeleccionada={pieza}
                  onElegirCara={marcar}
                />
              ) : (
                <Odontograma
                  datos={comoOdontograma}
                  catalogos={{ dientes, superficies: [], condiciones: CONDICIONES }}
                    piezaSeleccionada={pieza}
                  onElegirCara={marcar}
                />
              )}
            </Suspense>
          </Tarjeta>

          <Tarjeta className="p-5">
            {pieza && catalogoPieza ? (
              <>
                <h2 className="text-sm font-semibold">
                  <span className="tabular font-mono">{pieza}</span> · {catalogoPieza.nombre}
                </h2>
                <p className="mt-1 text-xs text-tinta-suave">
                  {catalogoPieza.arcada} {catalogoPieza.lado} · centro{" "}
                  <span className="font-mono">{catalogoPieza.centro_oclusal}</span>
                </p>

                {deLaPieza.length === 0 ? (
                  <p className="mt-4 text-sm text-tinta-suave">Sin hallazgos.</p>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {deLaPieza.map((h) => (
                      <li key={h.id} className="flex items-start gap-2 text-sm">
                        <span
                          className="mt-1 h-3 w-3 shrink-0 rounded-sm"
                          style={{ backgroundColor: h.color_hex }}
                          aria-hidden
                        />
                        <span>
                          {h.condicion_nombre}
                          <span className="block text-xs text-tinta-suave">
                            {h.superficie ? `cara ${h.superficie}` : "pieza completa"} ·{" "}
                            {h.estado}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <p className="text-sm text-tinta-suave">
                Haz clic en una pieza para ver su detalle.
              </p>
            )}
          </Tarjeta>
        </div>

        <Tarjeta className="mt-4 p-5">
          <PaletaCondiciones
            condiciones={CONDICIONES}
            condicionElegida={condicion}
            estadoElegido={estado}
            onElegirCondicion={setCondicion}
            onElegirEstado={setEstado}
          />
          <p className="mt-4 border-t border-linea pt-3 text-sm text-tinta-suave">
            {condicion
              ? condicion.ambito === "superficie"
                ? `Clic en una cara para marcar «${condicion.nombre}». Clic otra vez para quitarlo.`
                : `«${condicion.nombre}» es de ámbito ${condicion.ambito}: se registra sobre la pieza completa, hagas clic donde hagas clic.`
              : "Elige una condición."}
          </p>
        </Tarjeta>
      </div>
    </div>
  )
}
