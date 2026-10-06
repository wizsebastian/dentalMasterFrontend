import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "react-router-dom"

import { ProveedorAvisos } from "./components/ui"
import { CLAVE_CONTENIDO } from "./features/archivos/consultas"
import { ProveedorAuth } from "./features/auth/ProveedorAuth"
import { router } from "./rutas"
import "./index.css"

const queryClient: QueryClient = new QueryClient({
  // Cualquier alta o cambio puede completar un paso de la guía de primeros pasos
  // (un doctor, una unidad, los datos de la clínica…): se vuelve a pedir su estado.
  mutationCache: new MutationCache({
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["onboarding"] }),
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Un 401 ya lo resuelve el cliente renovando el token; reintentar más
      // sólo retrasa el mensaje de error.
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
})

// Las fotos y los exámenes se guardan en la caché como URL de objeto: cuando la
// caché descarta una, se libera la memoria que ocupaba.
queryClient.getQueryCache().subscribe((evento) => {
  if (evento.type !== "removed" || evento.query.queryKey[0] !== CLAVE_CONTENIDO) return
  const url = evento.query.state.data
  if (typeof url === "string") URL.revokeObjectURL(url)
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ProveedorAuth>
        <ProveedorAvisos>
          <RouterProvider router={router} />
        </ProveedorAvisos>
      </ProveedorAuth>
    </QueryClientProvider>
  </StrictMode>,
)
