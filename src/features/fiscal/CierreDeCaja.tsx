import { useState, type FormEvent } from "react"
import { Lock, LockOpen } from "lucide-react"

import { ApiError } from "../../api/client"
import type { CajaDelDia } from "../../api/tipos"
import {
  AreaTexto,
  Aviso,
  Boton,
  Campo,
  Dialogo,
  PieDialogo,
  Tarjeta,
  useAviso,
} from "../../components/ui"
import { fecha, hora, moneda } from "../../lib/formato"
import { useAuth } from "../auth/contexto"
import { useCajaDelDia, useCerrarCaja, useReabrirCaja } from "./consultas"

function Renglon({ etiqueta, valor, fuerte }: { etiqueta: string; valor: string; fuerte?: boolean }) {
  return (
    <div className={`flex justify-between gap-6 ${fuerte ? "font-semibold" : ""}`}>
      <dt className={fuerte ? "" : "text-tinta-suave"}>{etiqueta}</dt>
      <dd className="tabular">{valor}</dd>
    </div>
  )
}

function FormularioCierre({ caja, alCerrar }: { caja: CajaDelDia; alCerrar: () => void }) {
  const avisar = useAviso()
  const cerrar = useCerrarCaja()
  const [contado, setContado] = useState("")
  const [notas, setNotas] = useState("")
  const [fallo, setFallo] = useState<string | null>(null)

  const esperado = Number(caja.efectivo_esperado)
  const valor = Number(contado)
  const escrito = contado.trim() !== "" && Number.isFinite(valor) && valor >= 0
  const diferencia = escrito ? valor - esperado : 0
  const descuadra = escrito && Math.abs(diferencia) >= 0.005

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setFallo(null)
    try {
      await cerrar.mutateAsync({
        fecha: caja.fecha,
        efectivo_contado: valor.toFixed(2),
        notas: notas.trim() || undefined,
      })
      avisar("Caja cerrada")
      alCerrar()
    } catch (e) {
      setFallo(e instanceof ApiError ? e.detail : "No se pudo cerrar la caja")
    }
  }

  return (
    <form onSubmit={enviar} noValidate>
      <dl className="space-y-1 text-sm">
        <Renglon etiqueta="Cobrado en efectivo" valor={moneda(caja.efectivo_cobrado)} />
        <Renglon etiqueta="Gastos pagados en efectivo" valor={`− ${moneda(caja.gastos_efectivo)}`} />
        <Renglon etiqueta="Efectivo que debe haber" valor={moneda(caja.efectivo_esperado)} fuerte />
      </dl>

      <div className="mt-4">
        <Campo
          etiqueta="Efectivo contado"
          inputMode="decimal"
          autoFocus
          value={contado}
          onChange={(e) => setContado(e.target.value.replace(/[^\d.]/g, ""))}
          ayuda={
            descuadra
              ? `${diferencia > 0 ? "Sobran" : "Faltan"} ${moneda(Math.abs(diferencia))}: explica la diferencia abajo.`
              : escrito
                ? "Cuadra con lo esperado."
                : "Lo que hay en la gaveta, contado."
          }
        />
      </div>
      <div className="mt-4">
        <AreaTexto
          etiqueta={descuadra ? "Explicación de la diferencia" : "Notas (opcional)"}
          rows={2}
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
        />
      </div>

      {fallo && <Aviso className="mt-4">{fallo}</Aviso>}

      <PieDialogo>
        <Boton type="button" variante="contorno" onClick={alCerrar}>
          Cancelar
        </Boton>
        <Boton
          type="submit"
          disabled={!escrito || (descuadra && notas.trim().length < 3) || cerrar.isPending}
        >
          Cerrar caja
        </Boton>
      </PieDialogo>
    </form>
  )
}

/**
 * El cierre de un día: contar el efectivo y dejar la foto guardada.
 *
 * La foto no cambia aunque después se cobre o se anule algo; lo que se mueva
 * tras el cierre se muestra aparte, en lugar de reescribir lo ya cerrado.
 */
export function CierreDeCaja({ dia }: { dia: string }) {
  const avisar = useAviso()
  const { puede } = useAuth()
  const { data: caja } = useCajaDelDia(dia)
  const reabrir = useReabrirCaja()
  const [cerrando, setCerrando] = useState(false)

  if (!caja || !puede("recepcion", "facturacion")) return null
  const { cierre } = caja
  const movido = Number(caja.movido_tras_cierre)

  return (
    <Tarjeta className="no-partir mt-4 p-4">
      {cierre ? (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="text-sm">
            <p className="flex items-center gap-2 font-semibold">
              <Lock className="h-4 w-4" aria-hidden />
              Caja cerrada
            </p>
            <p className="mt-0.5 text-tinta-suave">
              {fecha(cierre.cerrado_en)} a las {hora(cierre.cerrado_en)}
              {cierre.cerrado_por_email && ` · ${cierre.cerrado_por_email}`}
            </p>
            {cierre.notas && <p className="mt-1">{cierre.notas}</p>}
            {movido !== 0 && (
              <p className="mt-2 font-medium">
                Después del cierre se {movido > 0 ? "cobraron" : "anularon"}{" "}
                <span className="tabular">{moneda(Math.abs(movido))}</span>, que no están en esta foto.
              </p>
            )}
          </div>
          <dl className="w-64 space-y-1 text-sm">
            <Renglon etiqueta="Cobrado" valor={moneda(cierre.cobrado)} />
            <Renglon etiqueta="Efectivo esperado" valor={moneda(cierre.efectivo_esperado)} />
            <Renglon etiqueta="Efectivo contado" valor={moneda(cierre.efectivo_contado)} />
            <Renglon
              etiqueta="Diferencia"
              valor={Number(cierre.diferencia) === 0 ? "Cuadra" : moneda(cierre.diferencia)}
              fuerte
            />
          </dl>
          {puede() && (
            <Boton
              variante="plano"
              className="no-imprimir"
              disabled={reabrir.isPending}
              onClick={async () => {
                await reabrir.mutateAsync(cierre.id)
                avisar("Caja reabierta")
              }}
            >
              <LockOpen className="h-4 w-4" aria-hidden />
              Reabrir
            </Boton>
          )}
        </div>
      ) : (
        <div className="no-imprimir flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm">
            <span className="font-semibold">Caja abierta.</span>{" "}
            <span className="text-tinta-suave">
              Debe haber <span className="tabular">{moneda(caja.efectivo_esperado)}</span> en efectivo.
            </span>
          </p>
          <Boton onClick={() => setCerrando(true)}>
            <Lock className="h-4 w-4" aria-hidden />
            Cerrar caja
          </Boton>
        </div>
      )}

      <Dialogo
        abierto={cerrando}
        alCerrar={() => setCerrando(false)}
        titulo="Cerrar caja"
        descripcion={fecha(caja.fecha)}
        ancho="sm"
      >
        <FormularioCierre caja={caja} alCerrar={() => setCerrando(false)} />
      </Dialogo>
    </Tarjeta>
  )
}
