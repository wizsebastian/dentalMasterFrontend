import { aFechaISO } from "../agenda/tiempo"

export type Tramo = { desde: string; hasta: string }

/** Del día 1 a hoy. */
export function esteMes(hoy = new Date()): Tramo {
  return {
    desde: aFechaISO(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
    hasta: aFechaISO(hoy),
  }
}

/** El mes anterior completo: el tramo habitual de una liquidación. */
export function mesPasado(hoy = new Date()): Tramo {
  return {
    desde: aFechaISO(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)),
    // El día 0 de un mes es el último del anterior.
    hasta: aFechaISO(new Date(hoy.getFullYear(), hoy.getMonth(), 0)),
  }
}

/** Del 1 de enero a hoy. */
export function esteAnio(hoy = new Date()): Tramo {
  return { desde: aFechaISO(new Date(hoy.getFullYear(), 0, 1)), hasta: aFechaISO(hoy) }
}

export function mismoTramo(a: Tramo, b: Tramo): boolean {
  return a.desde === b.desde && a.hasta === b.hasta
}
