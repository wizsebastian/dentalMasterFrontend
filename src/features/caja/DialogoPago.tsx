import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Printer } from "lucide-react"
import { useForm } from "react-hook-form"
import { Link } from "react-router-dom"
import { z } from "zod"

import type { Pago } from "../../api/tipos"
import { Cargando } from "../../components/brand"
import {
  Aviso,
  Boton,
  Campo,
  CampoFecha,
  Dialogo,
  PieDialogo,
  Selector,
} from "../../components/ui"
import { fecha, moneda } from "../../lib/formato"
import { aplicarErrorApi, numeroONulo, oNulo } from "../../lib/formularios"
import { aFechaISO } from "../agenda/tiempo"
import { useCuenta, useRegistrarPago } from "./consultas"
import { METODOS, numeroDeRecibo, type Metodo } from "./textos"

export type PagoInicial = {
  pacienteId: number
  pacienteNombre: string
  /** «Cobrar» desde una consulta: el pago va primero a ella. */
  consultaId?: number
}

const HOY = aFechaISO(new Date())

const esquema = z.object({
  monto: z
    .string()
    .trim()
    .regex(/^\d+([.,]\d{1,2})?$/, "Escribe un importe, como 1500 o 1500.50")
    .refine((v) => Number(v.replace(",", ".")) > 0, "El monto debe ser mayor que cero"),
  metodo: z.enum(METODOS.map((m) => m.id) as [Metodo, ...Metodo[]]),
  fecha: z.string().refine((v) => !v || v <= HOY, "No puede estar en el futuro"),
  consulta_id: z.string(),
  concepto: z.string(),
  referencia: z.string(),
})

type Valores = z.infer<typeof esquema>

const CAMPOS = ["monto", "metodo", "fecha", "consulta_id", "concepto", "referencia"] as const

/** Registrar un pago del paciente y dar su recibo. */
export function DialogoPago({
  inicial,
  alCerrar,
}: {
  /** `null` = cerrado. */
  inicial: PagoInicial | null
  alCerrar: () => void
}) {
  return (
    <Dialogo
      abierto={inicial !== null}
      alCerrar={alCerrar}
      titulo="Registrar pago"
      descripcion={inicial?.pacienteNombre}
      ancho="md"
    >
      {inicial && <Contenido inicial={inicial} alCerrar={alCerrar} />}
    </Dialogo>
  )
}

function Contenido({ inicial, alCerrar }: { inicial: PagoInicial; alCerrar: () => void }) {
  const { data: cuenta } = useCuenta(inicial.pacienteId)
  const [registrado, setRegistrado] = useState<Pago | null>(null)

  if (!cuenta) {
    return (
      <div className="grid place-items-center py-10 text-marca">
        <Cargando label="Cargando la cuenta" />
      </div>
    )
  }

  if (registrado) {
    const anticipo = Number(registrado.sin_aplicar)
    return (
      <div>
        <p className="text-sm">
          Recibo{" "}
          <span className="tabular font-mono font-semibold">
            {numeroDeRecibo(registrado.numero_recibo)}
          </span>{" "}
          por <span className="tabular font-semibold">{moneda(registrado.monto)}</span>.
        </p>
        {anticipo > 0 && (
          <p className="mt-2 text-sm text-tinta-suave">
            {moneda(anticipo)} quedaron como crédito a favor del paciente: se aplicarán solos a su
            próxima consulta.
          </p>
        )}
        <PieDialogo>
          <Boton type="button" variante="contorno" onClick={alCerrar}>
            Cerrar
          </Boton>
          <Link
            to={`/recibos/${registrado.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-marca px-3.5 py-2 text-sm font-medium text-esmalte transition-colors hover:bg-marca-viva"
          >
            <Printer className="h-4 w-4" aria-hidden />
            Imprimir recibo
          </Link>
        </PieDialogo>
      </div>
    )
  }

  return <Formulario inicial={inicial} cuenta={cuenta} alCerrar={alCerrar} alRegistrar={setRegistrado} />
}

function Formulario({
  inicial,
  cuenta,
  alCerrar,
  alRegistrar,
}: {
  inicial: PagoInicial
  cuenta: NonNullable<ReturnType<typeof useCuenta>["data"]>
  alCerrar: () => void
  alRegistrar: (pago: Pago) => void
}) {
  const registrar = useRegistrarPago(inicial.pacienteId)
  const [general, setGeneral] = useState<string | null>(null)

  const deLaConsulta = cuenta.pendientes.find((p) => p.consulta_id === inicial.consultaId)
  const debe = Number(cuenta.balance)
  // Lo habitual es cobrar el saldo: el de la consulta, o el del paciente entero.
  const sugerido = deLaConsulta ? deLaConsulta.saldo : debe > 0 ? cuenta.balance : ""

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Valores>({
    resolver: zodResolver(esquema),
    defaultValues: {
      monto: sugerido,
      metodo: "efectivo",
      fecha: HOY,
      consulta_id: deLaConsulta ? String(deLaConsulta.consulta_id) : "",
      concepto: "",
      referencia: "",
    },
  })

  async function enviar(v: Valores) {
    setGeneral(null)
    try {
      alRegistrar(
        await registrar.mutateAsync({
          monto: v.monto.replace(",", "."),
          metodo: v.metodo,
          fecha: v.fecha || null,
          consulta_id: numeroONulo(v.consulta_id),
          concepto: oNulo(v.concepto),
          referencia: oNulo(v.referencia),
        }),
      )
    } catch (fallo) {
      setGeneral(aplicarErrorApi(fallo, setError, CAMPOS))
    }
  }

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate>
      <p className="mb-4 text-sm text-tinta-suave">
        {debe > 0 ? (
          <>
            Debe <span className="tabular font-semibold text-tinta">{moneda(cuenta.balance)}</span>
            {cuenta.pendientes.length > 1 && ` en ${cuenta.pendientes.length} consultas`}.
          </>
        ) : debe < 0 ? (
          <>Tiene {moneda(-debe)} de crédito a favor. Este pago se sumará como anticipo.</>
        ) : (
          <>No debe nada. Este pago quedará como anticipo.</>
        )}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          etiqueta="Monto (RD$)"
          autoFocus
          inputMode="decimal"
          placeholder="0.00"
          className="[&_input]:tabular [&_input]:text-right [&_input]:text-base [&_input]:font-semibold"
          error={errors.monto?.message}
          {...register("monto")}
        />
        <Selector etiqueta="Método" error={errors.metodo?.message} {...register("metodo")}>
          {METODOS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.etiqueta}
            </option>
          ))}
        </Selector>
        <CampoFecha etiqueta="Fecha" max={HOY} error={errors.fecha?.message} {...register("fecha")} />
        <Campo
          etiqueta="Referencia"
          opcional
          placeholder="Autorización, n.º de transferencia…"
          error={errors.referencia?.message}
          {...register("referencia")}
        />
        {cuenta.pendientes.length > 0 && (
          <Selector
            etiqueta="Aplicar a"
            className="sm:col-span-2"
            ayuda="Lo que sobre de esa consulta pasa a las demás, de la más antigua a la más reciente."
            error={errors.consulta_id?.message}
            {...register("consulta_id")}
          >
            <option value="">Lo más antiguo primero</option>
            {cuenta.pendientes.map((p) => (
              <option key={p.consulta_id} value={p.consulta_id}>
                {fecha(p.fecha)} · {p.descripcion} · debe {moneda(p.saldo)}
              </option>
            ))}
          </Selector>
        )}
        <Campo
          etiqueta="Concepto"
          opcional
          className="sm:col-span-2"
          placeholder="Lo que dirá el recibo. Por defecto, «Tratamiento odontológico»"
          error={errors.concepto?.message}
          {...register("concepto")}
        />
      </div>

      {general && <Aviso className="mt-5">{general}</Aviso>}

      <PieDialogo>
        <Boton type="button" variante="contorno" onClick={alCerrar}>
          Cancelar
        </Boton>
        <Boton type="submit" disabled={isSubmitting}>
          {isSubmitting && <Cargando size="sm" label="Guardando" />}
          Registrar pago
        </Boton>
      </PieDialogo>
    </form>
  )
}
