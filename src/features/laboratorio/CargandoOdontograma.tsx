import { Cargando, ISOTIPOS_COLOR } from "../../components/brand"

/**
 * Espera de los bancos de pruebas del odontograma.
 *
 * Releva las cuatro versiones cromáticas del isotipo. Las monocromas quedan
 * fuera: son versiones de reproducción —una tinta, fondos oscuros—, y en una
 * animación sólo aportan un latido en blanco y otro en negro.
 */
export function CargandoOdontograma({ que }: { que: string }) {
  return (
    <div className="grid place-items-center gap-4 py-24">
      <Cargando size="lg" versiones={ISOTIPOS_COLOR} label={`Cargando ${que}`} />
      <p className="text-sm text-tinta-suave">{que}</p>
    </div>
  )
}
