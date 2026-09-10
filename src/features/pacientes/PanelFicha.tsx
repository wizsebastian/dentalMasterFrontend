import { ApiError } from "../../api/client"
import { Cargando } from "../../components/brand"
import { ErrorCarga, Tarjeta, Vacio } from "../../components/ui"
import { useFicha } from "./consultas"

function Dato({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-tinta-suave">{etiqueta}</dt>
      <dd className="mt-0.5 text-sm">{valor}</dd>
    </div>
  )
}

function Habitos({ ficha }: { ficha: Record<string, unknown> }) {
  const ETIQUETAS: Record<string, string> = {
    fuma: "Fuma",
    consume_alcohol: "Consume alcohol",
    bruxismo: "Bruxismo",
    onicofagia: "Onicofagia",
    respirador_bucal: "Respirador bucal",
    sangrado_encias: "Sangrado de encías",
    sensibilidad: "Sensibilidad",
    dolor_atm: "Dolor de ATM",
    usa_hilo_dental: "Usa hilo dental",
    embarazada: "Embarazada",
    anticoagulantes: "Anticoagulantes",
    bifosfonatos: "Bifosfonatos",
  }

  const presentes = Object.entries(ETIQUETAS).filter(([clave]) => ficha[clave] === true)

  if (presentes.length === 0) {
    return <p className="text-sm text-tinta-suave">Sin hábitos ni condiciones registradas.</p>
  }

  return (
    <ul className="flex flex-wrap gap-1.5">
      {presentes.map(([clave, etiqueta]) => (
        <li key={clave} className="rounded-lg border border-linea px-2 py-1 text-xs">
          {etiqueta}
        </li>
      ))}
    </ul>
  )
}

export function PanelFicha({ pacienteId }: { pacienteId: number }) {
  const { data: ficha, isPending, error } = useFicha(pacienteId)

  if (isPending) {
    return (
      <div className="grid place-items-center py-16 text-marca">
        <Cargando label="Cargando la ficha" />
      </div>
    )
  }

  if (error) {
    const sinFicha = error instanceof ApiError && error.status === 404
    if (!sinFicha) return <ErrorCarga error={error} />

    return (
      <Vacio
        titulo="Este paciente no tiene ficha médica"
        descripcion="La historia clínica se abre en la primera consulta."
      />
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Tarjeta className="p-5">
        <h2 className="text-sm font-semibold">Motivo y antecedentes</h2>
        <dl className="mt-4 space-y-4">
          <Dato etiqueta="Motivo de consulta" valor={ficha.motivo_consulta ?? "—"} />
          <Dato etiqueta="Enfermedad actual" valor={ficha.enfermedad_actual ?? "—"} />
          <Dato
            etiqueta="Antecedentes familiares"
            valor={ficha.antecedentes_familiares ?? "—"}
          />
          <Dato
            etiqueta="Última visita dental"
            valor={
              ficha.ultima_visita_dental ? (
                <span className="tabular font-mono">{ficha.ultima_visita_dental}</span>
              ) : (
                "—"
              )
            }
          />
        </dl>
      </Tarjeta>

      <Tarjeta className="p-5">
        <h2 className="text-sm font-semibold">Hábitos y estado sistémico</h2>
        <div className="mt-4">
          <Habitos ficha={ficha as unknown as Record<string, unknown>} />
        </div>
        {ficha.observaciones && (
          <p className="mt-4 border-t border-linea pt-4 text-sm text-tinta-suave">
            {ficha.observaciones}
          </p>
        )}
      </Tarjeta>

      <Tarjeta className="p-5">
        <h2 className="text-sm font-semibold">Condiciones médicas</h2>
        {ficha.condiciones.length === 0 ? (
          <p className="mt-4 text-sm text-tinta-suave">Ninguna registrada.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {ficha.condiciones.map((condicion) => (
              <li key={condicion.condicion_medica_id} className="text-sm">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-medium">{condicion.nombre}</span>
                  <span className="text-xs text-tinta-suave">
                    riesgo {condicion.riesgo ?? "sin graduar"}
                    {condicion.controlado === false && " · no controlada"}
                  </span>
                </div>
                {condicion.alerta && (
                  <p className="mt-1 text-tinta-suave">{condicion.alerta}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>

      <Tarjeta className="p-5">
        <h2 className="text-sm font-semibold">Alergias y medicación</h2>

        {ficha.alergias.length === 0 ? (
          <p className="mt-4 text-sm text-tinta-suave">Sin alergias conocidas.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {ficha.alergias.map((alergia) => (
              <li key={alergia.alergia_id} className="text-sm">
                <span className="font-medium">{alergia.nombre}</span>
                <span className="ml-2 text-xs text-tinta-suave">{alergia.severidad}</span>
                {alergia.reaccion && (
                  <p className="mt-0.5 text-tinta-suave">{alergia.reaccion}</p>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 border-t border-linea pt-4">
          <h3 className="text-sm text-tinta-suave">Medicación actual</h3>
          {ficha.medicamentos.filter((m) => m.activo).length === 0 ? (
            <p className="mt-2 text-sm text-tinta-suave">Ninguna.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {ficha.medicamentos
                .filter((m) => m.activo)
                .map((medicamento) => (
                  <li key={medicamento.id}>
                    {medicamento.nombre}
                    {medicamento.dosis && (
                      <span className="text-tinta-suave"> · {medicamento.dosis}</span>
                    )}
                    {medicamento.frecuencia && (
                      <span className="text-tinta-suave"> · {medicamento.frecuencia}</span>
                    )}
                  </li>
                ))}
            </ul>
          )}
        </div>
      </Tarjeta>
    </div>
  )
}
