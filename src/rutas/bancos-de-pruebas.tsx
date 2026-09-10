import { lazy, Suspense, type ReactNode } from "react"

import { CargandoOdontograma } from "../features/laboratorio/CargandoOdontograma"

/**
 * Los dos bancos de pruebas del odontograma, cargados aparte.
 *
 * No los necesita quien entra a trabajar, así que salen del bundle principal y
 * su espera pasa a ser real en lugar de decorativa.
 */
const PruebaOdontograma = lazy(async () => ({
  default: (await import("../features/laboratorio/PruebaOdontograma")).PruebaOdontograma,
}))

const OdontogramaEspecial = lazy(async () => ({
  default: (await import("../features/laboratorio/OdontogramaEspecial")).OdontogramaEspecial,
}))

function conEspera(vista: ReactNode, que: string) {
  return <Suspense fallback={<CargandoOdontograma que={que} />}>{vista}</Suspense>
}

export function BancoArcada() {
  return conEspera(<PruebaOdontograma />, "el odontograma en arcada")
}

export function BancoLibreria() {
  return conEspera(<OdontogramaEspecial />, "el odontograma con librería")
}
