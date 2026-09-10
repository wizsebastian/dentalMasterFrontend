import { useQuery } from "@tanstack/react-query"
import { CheckCircle2, XCircle } from "lucide-react"

import { apiFetch } from "./api/client"
import { Logo, ToothMark, ToothSpinner } from "./components/brand"

type Salud = { status: string; dientes_en_catalogo: number }

/**
 * Pantalla de arranque del andamiaje (F0).
 *
 * Comprueba que el frontend, el proxy y la API están conectados. La sustituyen
 * las pantallas reales en F1.
 */
export default function App() {
  const { data, isPending, error } = useQuery({
    queryKey: ["salud"],
    queryFn: () => apiFetch<Salud>("/health"),
  })

  return (
    <div className="min-h-dvh px-6 py-10">
      <div className="mx-auto w-full max-w-xl">
        <header className="flex items-center justify-between border-b border-linea pb-5">
          <Logo />
          <ToothMark className="h-6 w-6 text-linea-fuerte" />
        </header>

        <h1 className="mt-10 text-2xl font-semibold tracking-tight">
          El andamiaje está en pie
        </h1>
        <p className="mt-2 max-w-[60ch] leading-relaxed text-tinta-suave">
          Vite, Tailwind y React Query están conectados a la API a través del proxy.
          Las pantallas clínicas llegan en la siguiente fase.
        </p>

        <section className="mt-8 rounded-xl border border-linea bg-superficie p-5">
          <h2 className="text-sm font-semibold">Conexión con la API</h2>

          {isPending && (
            <div className="mt-4 flex items-center gap-3 text-tinta-suave">
              <ToothSpinner size="sm" label="Consultando la API" />
              <span className="text-sm">Consultando…</span>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-3">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-tinta-suave" aria-hidden />
              <div className="text-sm">
                <p className="font-medium">La API no responde.</p>
                <p className="mt-1 text-tinta-suave">
                  Levanta el stack con <code className="font-mono">make up</code> en{" "}
                  <code className="font-mono">dentalMasterApi</code>.
                </p>
              </div>
            </div>
          )}

          {data && (
            <div className="mt-4 flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-marca" aria-hidden />
              <div className="text-sm">
                <p className="font-medium">Conectada.</p>
                <p className="mt-1 text-tinta-suave">
                  El catálogo dental tiene{" "}
                  <span className="tabular font-mono text-tinta">{data.dientes_en_catalogo}</span>{" "}
                  piezas cargadas.
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="mt-4 rounded-xl border border-linea bg-superficie p-5">
          <h2 className="text-sm font-semibold">Indicador de carga</h2>
          <div className="mt-4 flex items-end gap-8 text-marca">
            <ToothSpinner size="sm" />
            <ToothSpinner size="md" />
            <ToothSpinner size="lg" />
          </div>
        </section>
      </div>
    </div>
  )
}
