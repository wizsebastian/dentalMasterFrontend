import { useState, type FormEvent } from "react"
import { Plus, Search } from "lucide-react"
import { Link } from "react-router-dom"

import { ApiError } from "../../api/client"
import type { Implante, ValorEstadoImplante } from "../../api/tipos"
import {
  AreaTexto,
  Aviso,
  Boton,
  Campo,
  CampoFecha,
  Casilla,
  Dialogo,
  ErrorCarga,
  Insignia,
  PieDialogo,
  Selector,
  Tarjeta,
  Vacio,
  useAviso,
} from "../../components/ui"
import { doctor, fecha, telefono } from "../../lib/formato"
import { useAuth } from "../auth/contexto"
import { useDoctores } from "../catalogo/consultas"
import {
  useCrearSistema,
  useImplantes,
  useImplantesDeLote,
  useRegistrarEvento,
  useRegistrarImplante,
  useSistemas,
} from "./consultas"
import { ESTADO_IMPLANTE, TIPOS_EVENTO, medidas, tipoEvento, type TipoEvento } from "./textos"

export type ImplanteInicial = {
  pacienteId: number
  /** La línea de consulta en la que se colocó: da la pieza, el doctor y la fecha. */
  procedimientoId?: number
  codigoFdi?: number | null
}

function mensaje(e: unknown, porDefecto: string): string {
  return e instanceof ApiError ? e.detail : porDefecto
}

const decimal = (valor: string) => valor.replace(/[^\d.]/g, "").slice(0, 4)
const entero = (valor: string, largo = 3) => valor.replace(/\D/g, "").slice(0, largo)

/** Anotar el implante colocado. Lo único imprescindible es el sistema y el lote. */
export function DialogoImplante({
  inicial,
  alCerrar,
}: {
  inicial: ImplanteInicial | null
  alCerrar: () => void
}) {
  return (
    <Dialogo
      abierto={inicial !== null}
      alCerrar={alCerrar}
      titulo="Registrar implante"
      descripcion={
        inicial?.codigoFdi ? `Pieza ${inicial.codigoFdi}` : "El lote es lo que permite la trazabilidad"
      }
      ancho="lg"
    >
      {inicial && <FormularioImplante inicial={inicial} alCerrar={alCerrar} />}
    </Dialogo>
  )
}

function FormularioImplante({ inicial, alCerrar }: { inicial: ImplanteInicial; alCerrar: () => void }) {
  const avisar = useAviso()
  const { data: sistemas } = useSistemas()
  const { data: doctores } = useDoctores()
  const registrar = useRegistrarImplante(inicial.pacienteId)
  const crearSistema = useCrearSistema()
  const desdeLinea = inicial.procedimientoId !== undefined

  const [sistema, setSistema] = useState("")
  const [marca, setMarca] = useState("")
  const [linea, setLinea] = useState("")
  const [lote, setLote] = useState("")
  const [pieza, setPieza] = useState(inicial.codigoFdi ? String(inicial.codigoFdi) : "")
  const [doctorId, setDoctorId] = useState("")
  const [referencia, setReferencia] = useState("")
  const [serie, setSerie] = useState("")
  const [diametro, setDiametro] = useState("")
  const [longitud, setLongitud] = useState("")
  const [torque, setTorque] = useState("")
  const [isq, setIsq] = useState("")
  const [injerto, setInjerto] = useState(false)
  const [material, setMaterial] = useState("")
  const [membrana, setMembrana] = useState(false)
  const [garantia, setGarantia] = useState("")
  const [notas, setNotas] = useState("")
  const [fallo, setFallo] = useState<string | null>(null)

  const otroSistema = sistema === "otro"
  const listo =
    lote.trim().length > 0 &&
    (otroSistema ? marca.trim() && linea.trim() : sistema) &&
    (desdeLinea || (pieza && doctorId))

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setFallo(null)
    try {
      const sistemaId = otroSistema
        ? (await crearSistema.mutateAsync({ marca: marca.trim(), linea: linea.trim() })).id
        : Number(sistema)
      await registrar.mutateAsync({
        sistema_implante_id: sistemaId,
        lote: lote.trim(),
        estado: "colocado",
        procedimiento_id: inicial.procedimientoId ?? null,
        codigo_fdi: pieza ? Number(pieza) : null,
        doctor_id: doctorId ? Number(doctorId) : null,
        referencia: referencia.trim() || null,
        serie: serie.trim() || null,
        diametro_mm: diametro || null,
        longitud_mm: longitud || null,
        torque_ncm: torque ? Number(torque) : null,
        isq: isq ? Number(isq) : null,
        injerto_oseo: injerto,
        material_injerto: injerto ? material.trim() || null : null,
        membrana,
        garantia_hasta: garantia || null,
        notas: notas.trim() || null,
      })
      avisar("Implante registrado")
      alCerrar()
    } catch (e) {
      setFallo(mensaje(e, "No se pudo registrar el implante"))
    }
  }

  return (
    <form onSubmit={enviar} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Selector etiqueta="Sistema" autoFocus value={sistema} onChange={(e) => setSistema(e.target.value)}>
          <option value="">Elige el sistema</option>
          {(sistemas ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.marca} {s.linea}
            </option>
          ))}
          <option value="otro">Otro sistema…</option>
        </Selector>
        <Campo
          etiqueta="Lote"
          value={lote}
          onChange={(e) => setLote(e.target.value.toUpperCase())}
          ayuda="Tal como viene en la etiqueta del envase."
        />
        {otroSistema && (
          <>
            <Campo etiqueta="Marca" value={marca} onChange={(e) => setMarca(e.target.value)} />
            <Campo etiqueta="Línea" value={linea} onChange={(e) => setLinea(e.target.value)} />
          </>
        )}
        {!desdeLinea && (
          <>
            <Campo
              etiqueta="Pieza (FDI)"
              inputMode="numeric"
              value={pieza}
              onChange={(e) => setPieza(entero(e.target.value, 2))}
            />
            <Selector etiqueta="Colocado por" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
              <option value="">Elige al doctor</option>
              {(doctores ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {doctor(d.nombre_completo)}
                </option>
              ))}
            </Selector>
          </>
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        <Campo
          etiqueta="Diámetro (mm)"
          inputMode="decimal"
          value={diametro}
          onChange={(e) => setDiametro(decimal(e.target.value))}
        />
        <Campo
          etiqueta="Longitud (mm)"
          inputMode="decimal"
          value={longitud}
          onChange={(e) => setLongitud(decimal(e.target.value))}
        />
        <Campo
          etiqueta="Torque (Ncm)"
          inputMode="numeric"
          value={torque}
          onChange={(e) => setTorque(entero(e.target.value))}
        />
        <Campo
          etiqueta="ISQ"
          inputMode="numeric"
          value={isq}
          onChange={(e) => setIsq(entero(e.target.value))}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Campo
          etiqueta="Referencia"
          value={referencia}
          placeholder="Opcional"
          onChange={(e) => setReferencia(e.target.value)}
        />
        <Campo
          etiqueta="N.º de serie"
          value={serie}
          placeholder="Opcional"
          onChange={(e) => setSerie(e.target.value)}
        />
        <CampoFecha
          etiqueta="Garantía hasta"
          value={garantia}
          onChange={(e) => setGarantia(e.target.value)}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
        <Casilla
          etiqueta="Con injerto óseo"
          checked={injerto}
          onChange={(e) => setInjerto(e.target.checked)}
        />
        <Casilla
          etiqueta="Con membrana"
          checked={membrana}
          onChange={(e) => setMembrana(e.target.checked)}
        />
      </div>
      {injerto && (
        <div className="mt-4">
          <Campo
            etiqueta="Material del injerto"
            value={material}
            placeholder="Xenoinjerto bovino 0.5 cc"
            onChange={(e) => setMaterial(e.target.value)}
          />
        </div>
      )}
      <div className="mt-4">
        <AreaTexto etiqueta="Notas" rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} />
      </div>

      {fallo && <Aviso className="mt-4">{fallo}</Aviso>}

      <PieDialogo>
        <Boton type="button" variante="contorno" onClick={alCerrar}>
          Cancelar
        </Boton>
        <Boton type="submit" disabled={!listo || registrar.isPending || crearSistema.isPending}>
          Registrar implante
        </Boton>
      </PieDialogo>
    </form>
  )
}

function FormularioEvento({
  implante,
  alCerrar,
}: {
  implante: Implante
  alCerrar: () => void
}) {
  const avisar = useAviso()
  const registrar = useRegistrarEvento(implante.paciente_id)
  const [tipo, setTipo] = useState<TipoEvento>("control")
  const [dia, setDia] = useState("")
  const [isq, setIsq] = useState("")
  const [hallazgos, setHallazgos] = useState("")
  const [estado, setEstado] = useState<ValorEstadoImplante | "">("")
  const [fallo, setFallo] = useState<string | null>(null)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setFallo(null)
    try {
      await registrar.mutateAsync({
        implanteId: implante.id,
        datos: {
          tipo,
          fecha: dia || null,
          isq: isq ? Number(isq) : null,
          hallazgos: hallazgos.trim() || null,
          estado: estado || null,
        },
      })
      avisar("Seguimiento registrado")
      alCerrar()
    } catch (e) {
      setFallo(mensaje(e, "No se pudo registrar el seguimiento"))
    }
  }

  return (
    <form onSubmit={enviar} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Selector etiqueta="Qué se hizo" autoFocus value={tipo} onChange={(e) => setTipo(e.target.value as TipoEvento)}>
          {TIPOS_EVENTO.filter((t) => t.id !== "colocacion").map((t) => (
            <option key={t.id} value={t.id}>
              {t.etiqueta}
            </option>
          ))}
        </Selector>
        <CampoFecha etiqueta="Fecha" value={dia} onChange={(e) => setDia(e.target.value)} ayuda="Vacía: hoy." />
        <Campo
          etiqueta="ISQ"
          inputMode="numeric"
          value={isq}
          placeholder="Opcional"
          onChange={(e) => setIsq(entero(e.target.value))}
        />
        <Selector
          etiqueta="Cómo queda el implante"
          value={estado}
          onChange={(e) => setEstado(e.target.value as ValorEstadoImplante | "")}
          ayuda="La carga y el retiro lo cambian solos."
        >
          <option value="">Sin cambio</option>
          {Object.entries(ESTADO_IMPLANTE)
            .filter(([valor]) => valor !== "planificado")
            .map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
        </Selector>
      </div>
      <div className="mt-4">
        <AreaTexto
          etiqueta="Hallazgos"
          rows={3}
          value={hallazgos}
          onChange={(e) => setHallazgos(e.target.value)}
        />
      </div>

      {fallo && <Aviso className="mt-4">{fallo}</Aviso>}

      <PieDialogo>
        <Boton type="button" variante="contorno" onClick={alCerrar}>
          Cancelar
        </Boton>
        <Boton type="submit" disabled={registrar.isPending}>
          Guardar seguimiento
        </Boton>
      </PieDialogo>
    </form>
  )
}

/** Los implantes del paciente, cada uno con su lote y su seguimiento. */
export function SeccionImplantes({ pacienteId }: { pacienteId: number }) {
  const { puede } = useAuth()
  const { data, error } = useImplantes(pacienteId)
  const [nuevo, setNuevo] = useState<ImplanteInicial | null>(null)
  const [siguiendo, setSiguiendo] = useState<Implante | null>(null)

  const edita = puede("doctor", "asistente")

  if (error) return <ErrorCarga error={error} />
  // Sin implantes, la sección sólo se ofrece a quien puede registrar uno.
  if (!data || (data.length === 0 && !edita)) return null

  return (
    <section>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Implantes</h2>
        {edita && (
          <Boton variante="contorno" className="py-1.5" onClick={() => setNuevo({ pacienteId })}>
            <Plus className="h-4 w-4" aria-hidden />
            Registrar implante
          </Boton>
        )}
      </div>

      {data.length === 0 ? (
        <Tarjeta>
          <p className="px-4 py-3 text-sm text-tinta-suave">
            Sin implantes registrados. Al ejecutar un servicio de implante en una consulta se ofrece
            anotar su lote.
          </p>
        </Tarjeta>
      ) : (
        <div className="space-y-3">
          {data.map((implante) => (
            <Tarjeta key={implante.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="text-sm">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="tabular font-mono font-semibold">{implante.codigo_fdi}</span>
                    <span className="font-medium">{implante.sistema_nombre}</span>
                    <Insignia>{ESTADO_IMPLANTE[implante.estado]}</Insignia>
                  </p>
                  <p className="mt-1 text-tinta-suave">
                    Lote <span className="tabular font-mono text-tinta">{implante.lote}</span>
                    {implante.referencia && (
                      <>
                        {" · "}Ref. <span className="font-mono">{implante.referencia}</span>
                      </>
                    )}
                    {medidas(implante.diametro_mm, implante.longitud_mm) &&
                      ` · ${medidas(implante.diametro_mm, implante.longitud_mm)}`}
                    {implante.torque_ncm !== null && ` · ${implante.torque_ncm} Ncm`}
                    {implante.isq !== null && ` · ISQ ${implante.isq}`}
                  </p>
                  <p className="text-tinta-suave">
                    {doctor(implante.doctor_nombre)}
                    {implante.fecha_colocacion && ` · colocado el ${fecha(implante.fecha_colocacion)}`}
                    {implante.fecha_carga && ` · cargado el ${fecha(implante.fecha_carga)}`}
                    {implante.garantia_hasta && ` · garantía hasta ${fecha(implante.garantia_hasta)}`}
                  </p>
                  {implante.injerto_oseo && (
                    <p className="text-tinta-suave">
                      Injerto óseo{implante.material_injerto && `: ${implante.material_injerto}`}
                      {implante.membrana && " · con membrana"}
                    </p>
                  )}
                  {implante.notas && <p className="mt-1">{implante.notas}</p>}
                </div>
                {edita && (
                  <Boton variante="contorno" className="py-1.5" onClick={() => setSiguiendo(implante)}>
                    <Plus className="h-4 w-4" aria-hidden />
                    Seguimiento
                  </Boton>
                )}
              </div>

              {implante.eventos.length > 0 && (
                <ol className="mt-3 space-y-1.5 border-t border-linea pt-3 text-sm">
                  {implante.eventos.map((evento) => (
                    <li key={evento.id} className="flex flex-wrap gap-x-3">
                      <span className="tabular w-24 shrink-0 text-tinta-suave">{fecha(evento.fecha)}</span>
                      <span className="font-medium">{tipoEvento(evento.tipo)}</span>
                      <span className="text-tinta-suave">
                        {[evento.isq !== null && `ISQ ${evento.isq}`, evento.hallazgos, evento.notas]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </Tarjeta>
          ))}
        </div>
      )}

      <DialogoImplante inicial={nuevo} alCerrar={() => setNuevo(null)} />
      <Dialogo
        abierto={siguiendo !== null}
        alCerrar={() => setSiguiendo(null)}
        titulo="Seguimiento del implante"
        descripcion={
          siguiendo ? `Pieza ${siguiendo.codigo_fdi} · ${siguiendo.sistema_nombre}` : undefined
        }
      >
        {siguiendo && <FormularioEvento implante={siguiendo} alCerrar={() => setSiguiendo(null)} />}
      </Dialogo>
    </section>
  )
}

/** A quién se le puso un implante de un lote: la respuesta a un retiro de producto. */
export function TrazabilidadImplantes() {
  const [lote, setLote] = useState("")
  const { data, isFetching, error } = useImplantesDeLote(lote)
  const buscando = lote.trim().length >= 2

  return (
    <section>
      <h2 className="text-sm font-semibold">Implantes por lote</h2>
      <p className="mt-0.5 text-sm text-tinta-suave">
        Si un fabricante retira un lote, aquí sale a quién hay que llamar.
      </p>
      <div className="relative mt-3 w-72 max-w-full">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-suave"
          aria-hidden
        />
        <input
          type="search"
          value={lote}
          onChange={(e) => setLote(e.target.value)}
          placeholder="Número de lote"
          aria-label="Buscar implantes por lote"
          className="w-full rounded-lg border border-linea-fuerte bg-superficie py-2 pl-9 pr-3 font-mono text-sm placeholder:font-sans placeholder:text-tinta-suave/60"
        />
      </div>

      {error && <ErrorCarga error={error} className="mt-3" />}
      {buscando && data && (
        <Tarjeta className={`mt-3 overflow-hidden ${isFetching ? "opacity-60" : ""}`}>
          {data.length === 0 ? (
            <Vacio titulo="Ningún implante de ese lote" />
          ) : (
            <ul>
              {data.map((implante) => (
                <li
                  key={implante.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-linea px-4 py-2.5 text-sm last:border-0"
                >
                  <span>
                    <Link
                      to={`/pacientes/${implante.paciente_id}?pestana=odontograma`}
                      className="font-medium text-marca hover:underline"
                    >
                      {implante.paciente_nombre}
                    </Link>
                    <span className="tabular ml-2 font-mono text-xs text-tinta-suave">
                      {implante.paciente_codigo}
                    </span>
                    <span className="block text-tinta-suave">
                      Pieza {implante.codigo_fdi} · {implante.sistema_nombre} · lote{" "}
                      <span className="font-mono text-tinta">{implante.lote}</span>
                      {implante.fecha_colocacion && ` · ${fecha(implante.fecha_colocacion)}`}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Insignia>{ESTADO_IMPLANTE[implante.estado]}</Insignia>
                    {implante.paciente_telefono && (
                      <a
                        href={`tel:${implante.paciente_telefono}`}
                        className="tabular font-mono hover:underline"
                      >
                        {telefono(implante.paciente_telefono)}
                      </a>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      )}
    </section>
  )
}
