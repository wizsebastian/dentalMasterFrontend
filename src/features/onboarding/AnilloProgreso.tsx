/**
 * Anillo con «hechos de total». El trazo se llena con una transición, así que al
 * completar un paso el anillo avanza a la vista del cliente.
 */
export function AnilloProgreso({
  hechos,
  total,
  tamano = 112,
  etiqueta = true,
}: {
  hechos: number
  total: number
  tamano?: number
  etiqueta?: boolean
}) {
  const radio = 42
  const circunferencia = 2 * Math.PI * radio
  const fraccion = total > 0 ? hechos / total : 0

  return (
    <div
      className="relative shrink-0"
      style={{ width: tamano, height: tamano }}
      role="img"
      aria-label={`${hechos} de ${total} pasos hechos`}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={radio} fill="none" strokeWidth="8" className="stroke-linea" />
        <circle
          cx="50"
          cy="50"
          r={radio}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className="guia-anillo stroke-marca"
          strokeDasharray={circunferencia}
          strokeDashoffset={circunferencia * (1 - fraccion)}
        />
      </svg>
      {etiqueta && (
        <div className="absolute inset-0 grid place-items-center text-center">
          {/* `key` rehace el elemento: el número entra con un pequeño rebote. */}
          <span key={hechos} className="guia-pop tabular leading-none">
            <span className="block text-2xl font-semibold">{hechos}</span>
            <span className="block text-xs text-tinta-suave">de {total}</span>
          </span>
        </div>
      )}
    </div>
  )
}
