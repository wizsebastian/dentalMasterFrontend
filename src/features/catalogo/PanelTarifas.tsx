import { useState, type FormEvent } from "react"
import { Plus } from "lucide-react"

import { ApiError } from "../../api/client"
import {
  Aviso,
  Boton,
  Campo,
  Dialogo,
  ErrorCarga,
  Insignia,
  PieDialogo,
  Selector,
  Tarjeta,
  useAviso,
} from "../../components/ui"
import { useAseguradoras } from "../pacientes/resumen"
import { useGuardarLista, useListasPrecio } from "./consultas"

function FormularioTarifa({ alCerrar }: { alCerrar: () => void }) {
  const avisar = useAviso()
  const { data: listas } = useListasPrecio()
  const { data: aseguradoras } = useAseguradoras()
  const guardar = useGuardarLista()
  const [nombre, setNombre] = useState("")
  const [aseguradora, setAseguradora] = useState("")
  const [origen, setOrigen] = useState("")
  const [ajuste, setAjuste] = useState("0")
  const [cobertura, setCobertura] = useState("0")
  const [fallo, setFallo] = useState<string | null>(null)

  const numero = (texto: string) => texto.replace(",", ".").trim() || "0"

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setFallo(null)
    try {
      await guardar.mutateAsync({
        datos: {
          nombre: nombre.trim(),
          aseguradora_id: aseguradora ? Number(aseguradora) : null,
          copiar_de: origen ? Number(origen) : null,
          ajuste_pct: numero(ajuste),
          cobertura_pct: aseguradora ? numero(cobertura) : "0",
        },
      })
      avisar(`Tarifa «${nombre.trim()}» creada`)
      alCerrar()
    } catch (e) {
      setFallo(e instanceof ApiError ? e.detail : "No se pudo crear la tarifa")
    }
  }

  return (
    <form onSubmit={enviar} noValidate>
      <p className="mb-4 text-sm text-tinta-suave">
        La tarifa nace con los precios de otra, ajustados. Después cada precio se afina desde
        «Servicios y precios».
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          etiqueta="Nombre"
          autoFocus
          value={nombre}
          placeholder="ARS Universal 2026, Convenio empresas…"
          onChange={(e) => setNombre(e.target.value)}
        />
        <Selector
          etiqueta="Aseguradora"
          value={aseguradora}
          onChange={(e) => setAseguradora(e.target.value)}
          ayuda="Vacío: otra tarifa particular."
        >
          <option value="">Ninguna</option>
          {(aseguradoras ?? []).map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </Selector>
        <Selector etiqueta="Copiar precios de" value={origen} onChange={(e) => setOrigen(e.target.value)}>
          <option value="">La tarifa particular</option>
          {(listas ?? []).map((l) => (
            <option key={l.id} value={l.id}>
              {l.nombre}
            </option>
          ))}
        </Selector>
        <Campo
          etiqueta="Ajuste %"
          inputMode="decimal"
          value={ajuste}
          onChange={(e) => setAjuste(e.target.value.replace(/[^\d.,-]/g, "").slice(0, 6))}
          ayuda="−10 la deja un 10 % por debajo; 0, igual."
        />
        {aseguradora && (
          <Campo
            etiqueta="Cobertura del seguro %"
            inputMode="decimal"
            value={cobertura}
            onChange={(e) => setCobertura(e.target.value.replace(/[^\d.,]/g, "").slice(0, 5))}
            ayuda="Lo que cubre la ARS, por defecto, en cada servicio."
          />
        )}
      </div>

      {fallo && <Aviso className="mt-4">{fallo}</Aviso>}

      <PieDialogo>
        <Boton type="button" variante="contorno" onClick={alCerrar}>
          Cancelar
        </Boton>
        <Boton type="submit" disabled={!nombre.trim() || guardar.isPending}>
          Crear tarifa
        </Boton>
      </PieDialogo>
    </form>
  )
}

/** Las listas de precio: la particular y las de cada aseguradora o convenio. */
export function PanelTarifas({ edita }: { edita: boolean }) {
  const avisar = useAviso()
  const { data: listas, error } = useListasPrecio()
  const { data: aseguradoras } = useAseguradoras()
  const guardar = useGuardarLista()
  const [creando, setCreando] = useState(false)
  const [fallo, setFallo] = useState<string | null>(null)

  const nombreDe = (id: number | null) => aseguradoras?.find((a) => a.id === id)?.nombre

  if (error) return <ErrorCarga error={error} />

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-tinta-suave">
          Cada plan de tratamiento se cotiza con una tarifa. Con la de una aseguradora, el
          presupuesto estima además lo que cubre el seguro y lo que paga el paciente.
        </p>
        {edita && (
          <Boton onClick={() => setCreando(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Nueva tarifa
          </Boton>
        )}
      </div>

      {fallo && <Aviso className="mb-4">{fallo}</Aviso>}

      <Tarjeta className="overflow-hidden">
        <ul>
          {(listas ?? []).map((lista, indice) => (
            <li
              key={lista.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-linea px-4 py-2.5 text-sm last:border-0"
            >
              <span>
                <span className="font-medium">{lista.nombre}</span>
                <span className="tabular ml-2 font-mono text-xs text-tinta-suave">{lista.codigo}</span>
                {lista.aseguradora_id === null ? (
                  <Insignia className="ml-2">Particular</Insignia>
                ) : (
                  <span className="ml-2 text-tinta-suave">{nombreDe(lista.aseguradora_id)}</span>
                )}
              </span>
              {/* La primera es la particular de referencia: no se retira. */}
              {edita && indice > 0 && (
                <Boton
                  variante="plano"
                  className="py-1.5"
                  disabled={guardar.isPending}
                  onClick={async () => {
                    setFallo(null)
                    try {
                      await guardar.mutateAsync({ id: lista.id, datos: { activo: false } })
                      avisar(`Tarifa «${lista.nombre}» retirada`)
                    } catch (e) {
                      setFallo(e instanceof ApiError ? e.detail : "No se pudo retirar la tarifa")
                    }
                  }}
                >
                  Retirar
                </Boton>
              )}
            </li>
          ))}
        </ul>
      </Tarjeta>

      <Dialogo abierto={creando} alCerrar={() => setCreando(false)} titulo="Nueva tarifa">
        <FormularioTarifa alCerrar={() => setCreando(false)} />
      </Dialogo>
    </div>
  )
}
