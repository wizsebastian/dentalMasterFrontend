import { useState } from "react"
import { Search } from "lucide-react"
import { Link } from "react-router-dom"

import { Cargando } from "../../components/brand"
import { ErrorCarga, Tarjeta, Vacio } from "../../components/ui"
import { usePacientes } from "./consultas"

const POR_PAGINA = 25

export function ListaPacientes() {
  const [buscar, setBuscar] = useState("")
  const [offset, setOffset] = useState(0)
  const { data, isPending, isFetching, error } = usePacientes(buscar, offset, POR_PAGINA)

  function alBuscar(valor: string) {
    setBuscar(valor)
    setOffset(0) // un filtro nuevo empieza por la primera página
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pacientes</h1>
          {data && (
            <p className="mt-1 text-sm text-tinta-suave">
              <span className="tabular font-mono">{data.total}</span>
              {data.total === 1 ? " expediente" : " expedientes"}
              {buscar.trim() && " coinciden con la búsqueda"}
            </p>
          )}
        </div>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-suave"
            aria-hidden
          />
          <input
            type="search"
            value={buscar}
            onChange={(e) => alBuscar(e.target.value)}
            placeholder="Nombre, expediente o cédula"
            aria-label="Buscar pacientes"
            className="w-72 rounded-lg border border-linea-fuerte bg-superficie py-2 pl-9 pr-3 text-sm placeholder:text-tinta-suave/60"
          />
        </div>
      </div>

      <Tarjeta className="mt-6 overflow-hidden">
        {isPending ? (
          <div className="grid place-items-center py-14 text-marca">
            <Cargando label="Cargando pacientes" />
          </div>
        ) : error ? (
          <ErrorCarga error={error} className="m-4 border-0" />
        ) : data.items.length === 0 ? (
          <Vacio
            titulo={buscar.trim() ? "Ningún paciente coincide" : "Todavía no hay pacientes"}
            descripcion={
              buscar.trim()
                ? "Prueba con el número de expediente o la cédula."
                : "Los expedientes que registres aparecerán aquí."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-linea text-left text-tinta-suave">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Expediente</th>
                  <th className="px-4 py-2.5 font-medium">Paciente</th>
                  <th className="px-4 py-2.5 font-medium">Cédula</th>
                  <th className="px-4 py-2.5 font-medium">Edad</th>
                  <th className="px-4 py-2.5 font-medium">Celular</th>
                </tr>
              </thead>
              <tbody className={isFetching ? "opacity-60 transition-opacity" : undefined}>
                {data.items.map((paciente) => (
                  <tr key={paciente.id} className="border-b border-linea last:border-0 hover:bg-esmalte">
                    <td className="px-4 py-2.5">
                      <Link
                        to={`/pacientes/${paciente.id}`}
                        className="tabular font-mono text-marca hover:underline"
                      >
                        {paciente.codigo}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 font-medium">
                      {paciente.apellidos}, {paciente.nombres}
                    </td>
                    <td className="tabular px-4 py-2.5 font-mono text-tinta-suave">
                      {paciente.documento ?? "—"}
                    </td>
                    <td className="tabular px-4 py-2.5 text-tinta-suave">{paciente.edad}</td>
                    <td className="tabular px-4 py-2.5 font-mono text-tinta-suave">
                      {paciente.celular ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>

      {data && data.total > POR_PAGINA && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="tabular text-tinta-suave">
            {offset + 1}–{Math.min(offset + POR_PAGINA, data.total)} de {data.total}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOffset(Math.max(0, offset - POR_PAGINA))}
              disabled={offset === 0}
              className="rounded-lg border border-linea-fuerte px-3 py-1.5 disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setOffset(offset + POR_PAGINA)}
              disabled={offset + POR_PAGINA >= data.total}
              className="rounded-lg border border-linea-fuerte px-3 py-1.5 disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
