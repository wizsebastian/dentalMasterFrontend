/** Un círculo con su palomita, que se dibuja al aparecer. */
export function CheckAnimado({ tamano = 28 }: { tamano?: number }) {
  return (
    <span
      className="guia-pop inline-grid shrink-0 place-items-center rounded-full bg-exito text-white"
      style={{ width: tamano, height: tamano }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" width={tamano * 0.6} height={tamano * 0.6} fill="none">
        <path
          d="M5 12.5l4.5 4.5L19 7.5"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="guia-trazo"
        />
      </svg>
    </span>
  )
}
