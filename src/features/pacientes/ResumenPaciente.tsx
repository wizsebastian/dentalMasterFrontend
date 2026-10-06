import { useState, type FormEvent, type ReactNode } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { Link } from "react-router-dom"

import { ApiError } from "../../api/client"
import type { Seguro } from "../../api/tipos"
import {
  Aviso,
  Boton,
  Campo,
  CampoFecha,
  Casilla,
  Dialogo,
  Insignia,
  PieDialogo,
  Selector,
  Tarjeta,
  useAviso,
} from "../../components/ui"
import { doctor, fecha, hora } from "../../lib/formato"
import { useAuth } from "../auth/contexto"
import { ESTADO_PLAN } from "../historial/textos"
import { useAseguradoras, useGuardarSeguro, useQuitarSeguro, useResumen, useSeguros } from "./resumen"

function Celda({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="min-w-0 px-4 py-3">
      <dt className="text-xs text-tinta-suave">{titulo}</dt>
      <dd className="mt-0.5 text-sm">{children}</dd>
    </div>
  )
}

function FormularioSeguros({ pacienteId, alCerrar }: { pacienteId: number; alCerrar: () => void }) {
  const avisar = useAviso()
  const { data: seguros } = useSeguros(pacienteId)
  const { data: aseguradoras } = useAseguradoras()
  const guardar = useGuardarSeguro(pacienteId)
  const quitar = useQuitarSeguro(pacienteId)

  const [editando, setEditando] = useState<number | undefined>(undefined)
  const [aseguradora, setAseguradora] = useState("")
  const [poliza, setPoliza] = useState("")
  const [plan, setPlan] = useState("")
  const [titular, setTitular] = useState("")
  const [hasta, setHasta] = useState("")
  const [principal, setPrincipal] = useState(true)
  const [fallo, setFallo] = useState<string | null>(null)

  function cargar(seguro?: Seguro) {
    setEditando(seguro?.id)
    setAseguradora(seguro ? String(seguro.aseguradora_id) : "")
    setPoliza(seguro?.poliza ?? "")
    setPlan(seguro?.plan ?? "")
    setTitular(seguro?.titular ?? "")
    setHasta(seguro?.vigente_hasta ?? "")
    setPrincipal(seguro?.principal ?? true)
    setFallo(null)
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setFallo(null)
    const previo = seguros?.find((s) => s.id === editando)
    try {
      await guardar.mutateAsync({
        id: editando,
        datos: {
          aseguradora_id: Number(aseguradora),
          poliza: poliza.trim(),
          plan: plan.trim() || null,
          titular: titular.trim() || null,
          vigente_desde: previo?.vigente_desde ?? null,
          vigente_hasta: hasta || null,
          principal,
        },
      })
      avisar(editando === undefined ? "Seguro añadido" : "Seguro actualizado")
      cargar()
    } catch (e) {
      setFallo(e instanceof ApiError ? e.detail : "No se pudo guardar el seguro")
    }
  }

  return (
    <div>
      {(seguros ?? []).length > 0 && (
        <ul className="mb-5 divide-y divide-linea rounded-lg border border-linea">
          {seguros!.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 text-sm">
              <span>
                <span className="font-medium">{s.aseguradora_nombre}</span>
                <span className="tabular ml-2 font-mono text-xs">{s.poliza}</span>
                {s.principal && <Insignia className="ml-2">Principal</Insignia>}
                {!s.vigente && <Insignia className="ml-2">Vencido</Insignia>}
                <span className="block text-xs text-tinta-suave">
                  {[s.plan, s.titular && `titular: ${s.titular}`, s.vigente_hasta && `hasta ${fecha(s.vigente_hasta)}`]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
              <span className="flex">
                <button
                  type="button"
                  onClick={() => cargar(s)}
                  aria-label={`Editar el seguro de ${s.aseguradora_nombre}`}
                  className="rounded-lg p-1.5 text-tinta-suave hover:bg-marca-tenue hover:text-marca"
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await quitar.mutateAsync(s.id)
                    if (editando === s.id) cargar()
                    avisar("Seguro quitado")
                  }}
                  aria-label={`Quitar el seguro de ${s.aseguradora_nombre}`}
                  className="rounded-lg p-1.5 text-tinta-suave hover:bg-marca-tenue hover:text-marca"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={enviar} noValidate>
        <p className="mb-3 text-sm font-medium">
          {editando === undefined ? "Añadir un seguro" : "Editar el seguro"}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Selector etiqueta="Aseguradora" value={aseguradora} onChange={(e) => setAseguradora(e.target.value)}>
            <option value="">Elige la ARS</option>
            {(aseguradoras ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </Selector>
          <Campo etiqueta="N.º de póliza o afiliado" value={poliza} onChange={(e) => setPoliza(e.target.value)} />
          <Campo etiqueta="Plan" value={plan} placeholder="Opcional" onChange={(e) => setPlan(e.target.value)} />
          <Campo
            etiqueta="Titular"
            value={titular}
            placeholder="Si no es el paciente"
            onChange={(e) => setTitular(e.target.value)}
          />
          <CampoFecha etiqueta="Vigente hasta" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          <div className="self-end pb-2">
            <Casilla
              etiqueta="Es el seguro principal"
              checked={principal}
              onChange={(e) => setPrincipal(e.target.checked)}
            />
          </div>
        </div>

        {fallo && <Aviso className="mt-4">{fallo}</Aviso>}

        <PieDialogo>
          {editando !== undefined && (
            <Boton type="button" variante="plano" className="mr-auto" onClick={() => cargar()}>
              Dejar de editar
            </Boton>
          )}
          <Boton type="button" variante="contorno" onClick={alCerrar}>
            Cerrar
          </Boton>
          <Boton type="submit" disabled={!aseguradora || !poliza.trim() || guardar.isPending}>
            {editando === undefined ? "Añadir seguro" : "Guardar seguro"}
          </Boton>
        </PieDialogo>
      </form>
    </div>
  )
}

/**
 * El paciente de un vistazo: próxima cita, última visita, plan en curso y seguro.
 *
 * Nada de esto se redacta: sale de lo ya registrado, así que no puede quedarse
 * viejo ni contradecir al expediente.
 */
export function ResumenPaciente({
  pacienteId,
  alIrA,
}: {
  pacienteId: number
  alIrA: (pestana: "documentos" | "citas" | "odontograma") => void
}) {
  const { puede } = useAuth()
  const { data: resumen } = useResumen(pacienteId)
  const [seguros, setSeguros] = useState(false)

  if (!resumen) return null

  const { proxima_cita: cita, ultima_consulta: ultima, seguro } = resumen
  const plan = resumen.planes[0]
  const editaSeguro = puede("recepcion", "facturacion", "doctor", "asistente")

  type Nota = { texto: string; ir: "documentos" | "citas" | "odontograma" }
  const notas: Nota[] = []
  if (resumen.ausencias > 0) {
    notas.push({
      texto: resumen.ausencias === 1 ? "1 ausencia" : `${resumen.ausencias} ausencias`,
      ir: "citas",
    })
  }
  if (resumen.por_firmar > 0) {
    notas.push({
      texto:
        resumen.por_firmar === 1 ? "1 documento por firmar" : `${resumen.por_firmar} documentos por firmar`,
      ir: "documentos",
    })
  }
  for (const implante of resumen.implantes) {
    notas.push({ texto: `Implante ${implante.codigo_fdi} · lote ${implante.lote}`, ir: "odontograma" })
  }

  return (
    <Tarjeta className="no-imprimir">
      <dl className="grid divide-linea sm:grid-cols-2 sm:divide-x lg:grid-cols-4">
        <Celda titulo="Próxima cita">
          {cita ? (
            <>
              <span className="tabular font-medium">
                {fecha(cita.inicio)} · {hora(cita.inicio)}
              </span>
              <span className="block truncate text-tinta-suave">
                {[cita.servicio_nombre, doctor(cita.doctor_nombre)].filter(Boolean).join(" · ")}
              </span>
            </>
          ) : (
            <span className="text-tinta-suave">Sin cita agendada</span>
          )}
        </Celda>

        <Celda titulo={resumen.consultas > 1 ? `Última consulta · ${resumen.consultas} en total` : "Última consulta"}>
          {ultima ? (
            <>
              <span className="tabular font-medium">{fecha(ultima.fecha)}</span>
              <span className="block truncate text-tinta-suave">
                {ultima.servicios.join(" · ") || ultima.motivo || doctor(ultima.doctor_nombre)}
              </span>
            </>
          ) : (
            <span className="text-tinta-suave">Aún no tiene consultas</span>
          )}
        </Celda>

        <Celda titulo={resumen.planes.length > 1 ? `Plan · ${resumen.planes.length} abiertos` : "Plan"}>
          {plan ? (
            <>
              <Link
                to={`/pacientes/${pacienteId}/planes/${plan.id}`}
                className="tabular font-mono text-marca hover:underline"
              >
                {plan.codigo}
              </Link>
              <span className="ml-2 text-tinta-suave">
                {plan.items === 0 ? ESTADO_PLAN[plan.estado] : `${plan.hechos} de ${plan.items} hechos`}
              </span>
              <span className="block truncate text-tinta-suave">
                {plan.siguiente ? `Sigue: ${plan.siguiente}` : "Sin pasos pendientes"}
              </span>
            </>
          ) : (
            <span className="text-tinta-suave">Sin plan abierto</span>
          )}
        </Celda>

        <Celda titulo="Seguro">
          <span className="flex items-start justify-between gap-2">
            <span className="min-w-0">
              {seguro ? (
                <>
                  <span className="font-medium">{seguro.aseguradora_nombre}</span>
                  {!seguro.vigente && <Insignia className="ml-2">Vencido</Insignia>}
                  <span className="tabular block truncate font-mono text-xs text-tinta-suave">
                    {seguro.poliza}
                  </span>
                </>
              ) : (
                <span className="text-tinta-suave">Particular</span>
              )}
            </span>
            {editaSeguro && (
              <button
                type="button"
                onClick={() => setSeguros(true)}
                aria-label="Editar los seguros del paciente"
                className="rounded-lg p-1 text-tinta-suave hover:bg-marca-tenue hover:text-marca"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden />
              </button>
            )}
          </span>
        </Celda>
      </dl>

      {notas.length > 0 && (
        <p className="flex flex-wrap gap-2 border-t border-linea px-4 py-2">
          {notas.map((nota) => (
            <button
              key={nota.texto}
              type="button"
              onClick={() => alIrA(nota.ir)}
              className="rounded-md border border-linea-fuerte px-1.5 py-0.5 text-xs font-medium text-tinta-suave hover:border-tinta-suave hover:text-tinta"
            >
              {nota.texto}
            </button>
          ))}
        </p>
      )}

      <Dialogo abierto={seguros} alCerrar={() => setSeguros(false)} titulo="Seguros del paciente">
        <FormularioSeguros pacienteId={pacienteId} alCerrar={() => setSeguros(false)} />
      </Dialogo>
    </Tarjeta>
  )
}
