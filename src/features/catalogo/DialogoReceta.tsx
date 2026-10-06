import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import { ApiError } from "../../api/client"
import type { RecetaInsumo, Servicio } from "../../api/tipos"
import {
  Aviso,
  Boton,
  Dialogo,
  EsqueletoTabla,
  PieDialogo,
  SelectorFiltro,
  useAviso,
} from "../../components/ui"
import { moneda } from "../../lib/formato"
import { useGuardarReceta, useInventario, useRecetaDeServicio } from "../inventario/consultas"

const ENTRADA =
  "min-w-0 rounded-lg border border-linea-fuerte bg-superficie px-2 py-1.5 text-sm placeholder:text-tinta-suave/60"

/**
 * Qué insumos gasta un servicio cada vez que se ejecuta.
 *
 * De aquí sale su costo —y por tanto su margen— y lo que se descuenta del
 * almacén al registrarlo en una consulta.
 */
export function DialogoReceta({
  servicio,
  alCerrar,
  edita,
}: {
  servicio: Servicio | null
  alCerrar: () => void
  edita: boolean
}) {
  const { data } = useRecetaDeServicio(servicio?.id ?? null)

  return (
    <Dialogo
      abierto={servicio !== null}
      alCerrar={alCerrar}
      titulo="Insumos del servicio"
      descripcion={servicio ? `${servicio.codigo} · ${servicio.nombre}` : undefined}
      ancho="md"
    >
      {servicio && data ? (
        <Formulario servicio={servicio} receta={data} edita={edita} alCerrar={alCerrar} />
      ) : (
        <EsqueletoTabla filas={3} />
      )}
    </Dialogo>
  )
}

function Formulario({
  servicio,
  receta,
  edita,
  alCerrar,
}: {
  servicio: Servicio
  receta: RecetaInsumo[]
  edita: boolean
  alCerrar: () => void
}) {
  const avisar = useAviso()
  const { data: inventario } = useInventario()
  const guardar = useGuardarReceta(servicio.id)
  const [renglones, setRenglones] = useState(
    receta.map((r) => ({ insumo_id: String(r.insumo_id), cantidad: String(Number(r.cantidad)) })),
  )
  const [fallo, setFallo] = useState<string | null>(null)

  const insumos = inventario?.items ?? []
  const costo = renglones.reduce((suma, r) => {
    const insumo = insumos.find((i) => String(i.id) === r.insumo_id)
    return suma + (insumo ? Number(insumo.costo) * (Number(r.cantidad.replace(",", ".")) || 0) : 0)
  }, 0)
  const precio = Number(servicio.precios[0]?.precio ?? 0)

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    setFallo(null)
    try {
      await guardar.mutateAsync(
        renglones
          .filter((r) => r.insumo_id && Number(r.cantidad.replace(",", ".")) > 0)
          .map((r) => ({ insumo_id: Number(r.insumo_id), cantidad: r.cantidad.replace(",", ".") })),
      )
      avisar("Receta guardada")
      alCerrar()
    } catch (e) {
      setFallo(e instanceof ApiError ? e.detail : "No se pudo guardar la receta")
    }
  }

  return (
    <form onSubmit={enviar} noValidate>
      {renglones.length === 0 && (
        <p className="text-sm text-tinta-suave">
          Este servicio no tiene insumos asignados: no descuenta nada del almacén.
        </p>
      )}
      <ul className="space-y-2">
        {renglones.map((r, i) => {
          const insumo = insumos.find((x) => String(x.id) === r.insumo_id)
          return (
            <li key={i} className="grid items-center gap-2 sm:grid-cols-[3fr_5rem_6rem_auto]">
              <SelectorFiltro
                aria-label={`Insumo ${i + 1}`}
                value={r.insumo_id}
                disabled={!edita}
                onChange={(e) =>
                  setRenglones(renglones.map((x, j) => (j === i ? { ...x, insumo_id: e.target.value } : x)))
                }
                className="min-w-0"
              >
                <option value="">Elige el insumo</option>
                {insumos.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.nombre} · {x.unidad}
                  </option>
                ))}
              </SelectorFiltro>
              <input
                aria-label={`Cantidad ${i + 1}`}
                inputMode="decimal"
                value={r.cantidad}
                disabled={!edita}
                onChange={(e) =>
                  setRenglones(renglones.map((x, j) => (j === i ? { ...x, cantidad: e.target.value } : x)))
                }
                className={`${ENTRADA} tabular text-right`}
              />
              <span className="tabular text-right text-sm text-tinta-suave">
                {insumo ? moneda(Number(insumo.costo) * (Number(r.cantidad.replace(",", ".")) || 0)) : "—"}
              </span>
              {edita && (
                <button
                  type="button"
                  onClick={() => setRenglones(renglones.filter((_, j) => j !== i))}
                  aria-label={`Quitar el insumo ${i + 1}`}
                  className="justify-self-start rounded-lg p-1.5 text-tinta-suave hover:bg-marca-tenue hover:text-marca"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              )}
            </li>
          )
        })}
      </ul>

      {edita && (
        <Boton
          type="button"
          variante="plano"
          className="-ml-2 mt-2"
          onClick={() => setRenglones([...renglones, { insumo_id: "", cantidad: "1" }])}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Añadir insumo
        </Boton>
      )}

      <dl className="mt-4 space-y-1 border-t border-linea pt-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-tinta-suave">Costo en insumos</dt>
          <dd className="tabular font-medium">{moneda(costo)}</dd>
        </div>
        {precio > 0 && (
          <div className="flex justify-between">
            <dt className="text-tinta-suave">Margen sobre el precio particular</dt>
            <dd className="tabular font-medium">
              {moneda(precio - costo)}
              <span className="ml-2 text-tinta-suave">{(((precio - costo) / precio) * 100).toFixed(0)} %</span>
            </dd>
          </div>
        )}
      </dl>

      {fallo && <Aviso className="mt-4">{fallo}</Aviso>}

      <PieDialogo>
        <Boton type="button" variante="contorno" onClick={alCerrar}>
          {edita ? "Cancelar" : "Cerrar"}
        </Boton>
        {edita && (
          <Boton type="submit" disabled={guardar.isPending}>
            Guardar receta
          </Boton>
        )}
      </PieDialogo>
    </form>
  )
}
