import { useRef, useState, type ChangeEvent, type FormEvent } from "react"
import { ImagePlus, Trash2 } from "lucide-react"

import { ApiError } from "../../api/client"
import type { Clinica } from "../../api/tipos"
import {
  Aviso,
  Boton,
  Campo,
  CampoTelefono,
  ErrorCarga,
  Esqueleto,
  Tarjeta,
  useAviso,
} from "../../components/ui"
import { mascaraTelefono } from "../../lib/formato"
import { useClinica } from "../agenda/consultas"
import { useGuardarClinica, useQuitarLogo, useSubirLogo, useClinicaConLogo } from "./consultas"
import { Membrete } from "./Membrete"

const texto = (valor: string | null | undefined) => valor ?? ""

/** El logo: vista previa, cambiarlo y quitarlo. */
function Logo() {
  const avisar = useAviso()
  const { logo } = useClinicaConLogo()
  const subir = useSubirLogo()
  const quitar = useQuitarLogo()
  const entrada = useRef<HTMLInputElement>(null)
  const [fallo, setFallo] = useState<string | null>(null)

  async function alElegir(evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0]
    evento.target.value = ""
    if (!archivo) return
    setFallo(null)
    try {
      await subir.mutateAsync(archivo)
      avisar("Logo actualizado")
    } catch (e) {
      setFallo(e instanceof ApiError ? e.detail : "No se pudo subir el logo")
    }
  }

  async function alQuitar() {
    setFallo(null)
    try {
      await quitar.mutateAsync()
      avisar("Logo quitado")
    } catch (e) {
      setFallo(e instanceof ApiError ? e.detail : "No se pudo quitar el logo")
    }
  }

  return (
    <Tarjeta className="p-4">
      <h2 className="text-sm font-semibold">Logo</h2>
      <p className="mt-0.5 text-sm text-tinta-suave">
        Sale en el membrete de cada impreso y en el menú. Mejor con fondo blanco o transparente
        (PNG, JPG o WebP, hasta 25 MB).
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <div className="grid h-24 w-48 place-items-center rounded-lg border border-dashed border-linea-fuerte bg-superficie p-2">
          {logo ? (
            <img src={logo} alt="Logo de la clínica" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-sm text-tinta-suave">Sin logo</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={entrada}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={alElegir}
            className="sr-only"
            tabIndex={-1}
            aria-label="Archivo del logo"
          />
          <Boton variante="contorno" disabled={subir.isPending} onClick={() => entrada.current?.click()}>
            <ImagePlus className="h-4 w-4" aria-hidden />
            {logo ? "Cambiar logo" : "Subir logo"}
          </Boton>
          {logo && (
            <Boton variante="plano" disabled={quitar.isPending} onClick={alQuitar}>
              <Trash2 className="h-4 w-4" aria-hidden />
              Quitar
            </Boton>
          )}
        </div>
      </div>
      {fallo && <Aviso className="mt-3">{fallo}</Aviso>}
    </Tarjeta>
  )
}

function Formulario({ clinica }: { clinica: Clinica }) {
  const avisar = useAviso()
  const guardar = useGuardarClinica()
  const [nombre, setNombre] = useState(clinica.nombre)
  const [rnc, setRnc] = useState(texto(clinica.rnc))
  const [direccion, setDireccion] = useState(texto(clinica.direccion))
  const [ciudad, setCiudad] = useState(texto(clinica.ciudad))
  const [telefono, setTelefono] = useState(mascaraTelefono(texto(clinica.telefono)))
  const [whatsapp, setWhatsapp] = useState(mascaraTelefono(texto(clinica.whatsapp)))
  const [email, setEmail] = useState(texto(clinica.email))
  const [web, setWeb] = useState(texto(clinica.web))
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [fallo, setFallo] = useState<string | null>(null)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setFallo(null)
    setErrores({})
    if (!nombre.trim()) {
      setErrores({ nombre: "El nombre de la clínica es obligatorio" })
      return
    }
    // Un texto vacío viaja como `null`: así se borra un dato que ya no aplica.
    const o = (valor: string) => valor.trim() || null
    try {
      await guardar.mutateAsync({
        nombre: nombre.trim(),
        rnc: o(rnc),
        direccion: o(direccion),
        ciudad: o(ciudad),
        telefono: o(telefono),
        whatsapp: o(whatsapp),
        email: o(email),
        web: o(web),
      })
      avisar("Datos de la clínica guardados")
    } catch (e) {
      if (e instanceof ApiError && Object.keys(e.campos).length > 0) {
        setErrores(e.campos)
        setFallo(null)
      } else {
        setFallo(e instanceof ApiError ? e.detail : "No se pudo guardar")
      }
    }
  }

  return (
    <form onSubmit={enviar} noValidate>
      <Tarjeta className="p-4">
        <h2 className="text-sm font-semibold">Datos de la clínica</h2>
        <p className="mt-0.5 text-sm text-tinta-suave">
          Se usan en todo el sistema: membrete de recibos, facturas, presupuestos, recetas,
          documentos y agenda impresa; las variables de las plantillas y los recordatorios de
          WhatsApp.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Campo
            etiqueta="Nombre de la clínica"
            value={nombre}
            error={errores.nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <Campo
            etiqueta="RNC"
            value={rnc}
            error={errores.rnc}
            onChange={(e) => setRnc(e.target.value)}
          />
          <Campo
            etiqueta="Dirección"
            value={direccion}
            error={errores.direccion}
            onChange={(e) => setDireccion(e.target.value)}
          />
          <Campo
            etiqueta="Ciudad"
            value={ciudad}
            error={errores.ciudad}
            onChange={(e) => setCiudad(e.target.value)}
          />
          <CampoTelefono
            etiqueta="Teléfono"
            value={telefono}
            error={errores.telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
          <CampoTelefono
            etiqueta="WhatsApp"
            value={whatsapp}
            error={errores.whatsapp}
            ayuda="El número al que escriben los pacientes."
            onChange={(e) => setWhatsapp(e.target.value)}
          />
          <Campo
            etiqueta="Correo"
            type="email"
            value={email}
            error={errores.email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Campo
            etiqueta="Página web"
            value={web}
            error={errores.web}
            onChange={(e) => setWeb(e.target.value)}
          />
        </div>

        {fallo && <Aviso className="mt-4">{fallo}</Aviso>}

        <div className="mt-5 flex justify-end">
          <Boton type="submit" disabled={guardar.isPending}>
            Guardar datos
          </Boton>
        </div>
      </Tarjeta>
    </form>
  )
}

/** Configuración → Clínica: lo que sale en cada impreso. */
export function PanelClinica() {
  const { data: clinica, isPending, error } = useClinica()

  if (error) return <ErrorCarga error={error} />
  if (isPending) return <Esqueleto className="h-64 w-full" />

  return (
    <div className="space-y-5">
      <Logo />
      {/* `key` rehace el formulario si los datos cambian desde fuera. */}
      <Formulario key={clinica.id} clinica={clinica} />

      <section>
        <h2 className="mb-2 text-sm font-semibold">Así se verá el membrete</h2>
        <Tarjeta className="p-5">
          <Membrete titulo="Documento de ejemplo" detalle="Vista previa" className="mb-0" />
        </Tarjeta>
      </section>
    </div>
  )
}
