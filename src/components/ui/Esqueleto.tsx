/** Hueco con la forma de lo que va a llegar: evita que la página salte al cargar. */
export function Esqueleto({ className = "h-4 w-full" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-md bg-linea ${className}`} />
}

export function EsqueletoTabla({ filas = 6 }: { filas?: number }) {
  return (
    <div className="space-y-3 p-4" role="status" aria-label="Cargando">
      {Array.from({ length: filas }, (_, i) => (
        <Esqueleto key={i} className="h-5 w-full" />
      ))}
    </div>
  )
}
