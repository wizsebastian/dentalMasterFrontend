import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "react-router-dom"

import { ProveedorAuth } from "./features/auth/ProveedorAuth"
import { router } from "./rutas"
import "./index.css"

const queryClient = new QueryClient({
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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ProveedorAuth>
        <RouterProvider router={router} />
      </ProveedorAuth>
    </QueryClientProvider>
  </StrictMode>,
)
