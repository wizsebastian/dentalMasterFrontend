import { useState, type FormEvent } from "react"
import { Plus } from "lucide-react"

import { ApiError } from "../../api/client"
import type { SecuenciaNcf } from "../../api/tipos"
import {
  Aviso,
  Boton,
  Campo,
  CampoFecha,
  Dialogo,
  ErrorCarga,
  EsqueletoTabla,
  Insignia,
  PieDialogo,
  Selector,
  Tabla,
  Tarjeta,
  Vacio,
  useAviso,
  type Columna,
} from "../../components/ui"
import { fecha, numero } from "../../lib/formato"
import { useCrearSecuencia, useSecuencias } from "../fiscal/consultas"
import { TIPOS_NCF, tipoNcf, type TipoNcf } from "../fiscal/textos"

function ncf(tipo: string, n: number): string {
  return `${tipo}${String(n).padStart(8, "0")}`
}

function FormularioSecuencia({ alCerrar }: { alCerrar: () => void }) {
  const avisar = useAviso()
  const crear = useCrearSecuencia()
  const [tipo, setTipo] = useState<TipoNcf>("B02")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [vence, setVence] = useState("")
  const [fallo, setFallo] = useState<string | null>(null)

  const listo = Number(desde) >= 1 && Number(hasta) >= Number(desde)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setFallo(null)
    try {
      await crear.mutateAsync({
        tipo,
        desde: Number(desde),
        hasta: Number(hasta),
        vence: vence || null,
      })
      avisar("Secuencia cargada")
      alCerrar()
    } catch (e) {
      setFallo(e instanceof ApiError ? e.detail : "No se pudo cargar la secuencia")
    }
  }

  const soloDigitos = (valor: string) => valor.replace(/\D/g, "").slice(0, 8)

  return (
    <form onSubmit={enviar} noValidate>
      <p className="mb-4 text-sm text-tinta-suave">
        Copia el rango tal como lo autorizó la DGII. La secuencia que estuviera activa para ese
        tipo queda cerrada.
      </p>
      <Selector etiqueta="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoNcf)}>
        {TIPOS_NCF.map((t) => (
          <option key={t.id} value={t.id}>
            {t.etiqueta} ({t.id})
          </option>
        ))}
      </Selector>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Campo
          etiqueta="Desde"
          inputMode="numeric"
          value={desde}
          onChange={(e) => setDesde(soloDigitos(e.target.value))}
          ayuda={desde ? ncf(tipo, Number(desde)) : "El número, sin el prefijo"}
        />
        <Campo
          etiqueta="Hasta"
          inputMode="numeric"
          value={hasta}
          onChange={(e) => setHasta(soloDigitos(e.target.value))}
          ayuda={hasta ? ncf(tipo, Number(hasta)) : undefined}
          error={hasta && Number(hasta) < Number(desde) ? "Anterior al inicio" : undefined}
        />
      </div>
      <div className="mt-4">
        <CampoFecha etiqueta="Válida hasta" value={vence} onChange={(e) => setVence(e.target.value)} />
      </div>

      {fallo && <Aviso className="mt-4">{fallo}</Aviso>}

      <PieDialogo>
        <Boton type="button" variante="contorno" onClick={alCerrar}>
          Cancelar
        </Boton>
        <Boton type="submit" disabled={!listo || crear.isPending}>
          Cargar secuencia
        </Boton>
      </PieDialogo>
    </form>
  )
}

/** Los rangos de NCF que la DGII autorizó a la clínica. */
export function PanelSecuencias() {
  const { data, isPending, error } = useSecuencias()
  const [creando, setCreando] = useState(false)

  const columnas: Columna<SecuenciaNcf>[] = [
    {
      id: "tipo",
      titulo: "Tipo",
      celda: (s) => (
        <>
          <span className="font-medium">{tipoNcf(s.tipo)}</span>
          <span className="ml-2 font-mono text-xs text-tinta-suave">{s.tipo}</span>
          {!s.activo && <Insignia className="ml-2">Cerrada</Insignia>}
        </>
      ),
    },
    {
      id: "rango",
      titulo: "Rango",
      className: "tabular font-mono text-xs",
      celda: (s) => `${ncf(s.tipo, s.desde)} – ${ncf(s.tipo, s.hasta)}`,
    },
    {
      id: "siguiente",
      titulo: "Siguiente",
      className: "tabular font-mono text-xs",
      celda: (s) => (s.disponibles > 0 ? ncf(s.tipo, s.siguiente) : "Agotada"),
    },
    {
      id: "disponibles",
      titulo: "Quedan",
      alinear: "derecha",
      className: "tabular",
      celda: (s) => numero(s.disponibles),
    },
    {
      id: "vence",
      titulo: "Válida hasta",
      className: "tabular whitespace-nowrap",
      celda: (s) => fecha(s.vence),
    },
  ]

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-tinta-suave">
          Cada comprobante fiscal toma el siguiente número de la secuencia activa de su tipo.
          Cuando una se agota o vence, se carga la nueva.
        </p>
        <Boton onClick={() => setCreando(true)}>
          <Plus className="h-4 w-4" aria-hidden />
          Cargar secuencia
        </Boton>
      </div>

      {error ? (
        <ErrorCarga error={error} />
      ) : (
        <Tarjeta className="overflow-hidden">
          {isPending ? (
            <EsqueletoTabla filas={2} />
          ) : data.length === 0 ? (
            <Vacio
              titulo="Sin secuencias cargadas"
              descripcion="Hasta que cargues una, no se pueden emitir comprobantes fiscales."
            />
          ) : (
            <Tabla
              columnas={columnas}
              filas={data}
              clave={(s) => s.id}
              claseFila={(s) => (s.activo ? undefined : "text-tinta-suave")}
            />
          )}
        </Tarjeta>
      )}

      <Dialogo abierto={creando} alCerrar={() => setCreando(false)} titulo="Cargar secuencia de NCF" ancho="sm">
        <FormularioSecuencia alCerrar={() => setCreando(false)} />
      </Dialogo>
    </div>
  )
}
