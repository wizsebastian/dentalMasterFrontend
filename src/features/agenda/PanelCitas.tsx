import { useMemo, useState } from "react"
import { Plus } from "lucide-react"

import { ApiError } from "../../api/client"
import type { Cita, PacienteDetalle, ValorEstadoCita } from "../../api/tipos"
import { Aviso, Boton, ErrorCarga, EsqueletoTabla, Tarjeta, Vacio } from "../../components/ui"
import { useLayout } from "../../rutas/contexto"
import { useAuth } from "../auth/contexto"
import { DetalleCita } from "./DetalleCita"
import { ListaCitas } from "./ListaCitas"
import {
  useCambiarEstado,
  useCitasDePaciente,
  useClinica,
  useEstadosCita,
  useMarcarRecordatorio,
} from "./consultas"
import { mapaDeEstados } from "./mapaEstados"

/** Las citas de un paciente, en su expediente: las próximas primero. */
export function PanelCitas({ paciente }: { paciente: PacienteDetalle }) {
  const { puede } = useAuth()
  const { abrirCita } = useLayout()
  const { data: citas, isPending, error } = useCitasDePaciente(paciente.id)
  const { data: estados } = useEstadosCita()
  const { data: clinica } = useClinica()
  const cambiar = useCambiarEstado()
  const recordar = useMarcarRecordatorio()
  const [detalle, setDetalle] = useState<number | null>(null)
  const [fallo, setFallo] = useState<string | null>(null)

  const mapa = useMemo(() => mapaDeEstados(estados), [estados])
  const edita = puede("doctor", "asistente", "recepcion")

  // Lo que viene, de la más cercana a la más lejana; debajo, lo que ya pasó.
  const { proximas, pasadas } = useMemo(() => {
    const ahora = new Date().toISOString()
    const todas = citas ?? []
    return {
      proximas: todas.filter((c) => c.fin >= ahora),
      pasadas: todas.filter((c) => c.fin < ahora).reverse(),
    }
  }, [citas])

  async function alCambiarEstado(cita: Cita, estado: ValorEstadoCita) {
    setFallo(null)
    try {
      await cambiar.mutateAsync({ id: cita.id, estado })
    } catch (e) {
      setFallo(e instanceof ApiError ? e.detail : "No se pudo cambiar el estado")
    }
  }

  const tabla = (lista: Cita[]) => (
    <ListaCitas
      citas={lista}
      estados={mapa}
      clinica={clinica}
      edita={edita}
      conPaciente={false}
      alElegir={(cita) => setDetalle(cita.id)}
      alCambiarEstado={alCambiarEstado}
      alRecordar={(cita) => recordar.mutate(cita.id)}
    />
  )

  return (
    <div>
      {edita && (
        <div className="mb-4 flex justify-end">
          <Boton
            onClick={() =>
              abrirCita({
                paciente: {
                  id: paciente.id,
                  nombre: `${paciente.nombres} ${paciente.apellidos}`,
                  doctorTratanteId: paciente.doctor_tratante_id,
                },
              })
            }
          >
            <Plus className="h-4 w-4" aria-hidden />
            Nueva cita
          </Boton>
        </div>
      )}

      {fallo && <Aviso className="mb-4">{fallo}</Aviso>}

      {isPending ? (
        <Tarjeta>
          <EsqueletoTabla filas={3} />
        </Tarjeta>
      ) : error ? (
        <ErrorCarga error={error} />
      ) : citas.length === 0 ? (
        <Tarjeta>
          <Vacio titulo="Sin citas" descripcion="Este paciente todavía no tiene ninguna cita." />
        </Tarjeta>
      ) : (
        <div className="space-y-5">
          <section>
            <h2 className="mb-2 text-sm font-semibold">Próximas</h2>
            <Tarjeta className="overflow-hidden">
              {proximas.length > 0 ? (
                tabla(proximas)
              ) : (
                <p className="px-4 py-3 text-sm text-tinta-suave">No tiene citas por delante.</p>
              )}
            </Tarjeta>
          </section>
          {pasadas.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold">Anteriores</h2>
              <Tarjeta className="overflow-hidden">{tabla(pasadas)}</Tarjeta>
            </section>
          )}
        </div>
      )}

      <DetalleCita
        citaId={detalle}
        alCerrar={() => setDetalle(null)}
        alEditar={(cita) => {
          setDetalle(null)
          abrirCita({ cita })
        }}
      />
    </div>
  )
}
