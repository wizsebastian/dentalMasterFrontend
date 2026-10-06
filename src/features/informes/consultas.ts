/** Consultas de los informes por doctor. */
import { useQuery } from "@tanstack/react-query"

import { apiFetch } from "../../api/client"
import type { ReporteDoctor } from "../../api/tipos"

const V1 = "/api/v1"

export function useReporteDoctor(doctorId: number | null, desde: string, hasta: string) {
  return useQuery({
    queryKey: ["informes", "doctor", doctorId, desde, hasta],
    queryFn: () =>
      apiFetch<ReporteDoctor>(`${V1}/informes/doctores/${doctorId}?desde=${desde}&hasta=${hasta}`),
    enabled: doctorId !== null,
    placeholderData: (previo) => previo,
  })
}
