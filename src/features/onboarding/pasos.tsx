/**
 * Los seis pasos de la guía, con su texto en tres líneas: qué es, por qué
 * importa y qué hacer ahora. Cada paso reutiliza el panel de Configuración que
 * ya existe (`panel`); el sexto no tiene panel: es una revisión.
 */
import {
  Armchair,
  BookOpen,
  Building2,
  Receipt,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react"
import type { ReactNode } from "react"

import { PanelClinica } from "../clinica/PanelClinica"
import { PanelDoctores } from "../configuracion/PanelDoctores"
import { PanelSecuencias } from "../configuracion/PanelSecuencias"
import { PanelUnidades } from "../configuracion/PanelUnidades"
import { PanelUsuarios } from "../configuracion/PanelUsuarios"

export type PasoGuia = {
  id: "clinica" | "doctores" | "unidades" | "equipo" | "ncf" | "catalogo"
  icono: LucideIcon
  titulo: string
  /** Una línea para la tarjeta de la bienvenida. */
  resumen: string
  queEs: string
  porQue: string
  queHacer: string
  panel?: () => ReactNode
}

export const PASOS: PasoGuia[] = [
  {
    id: "clinica",
    icono: Building2,
    titulo: "Datos de tu clínica y logo",
    resumen: "Nombre, teléfono, dirección y logo para tus impresos.",
    queEs: "La identidad de tu clínica: nombre, RNC, dirección, teléfonos, correo y logo.",
    porQue:
      "Salen en cada recibo, factura, receta, presupuesto y recordatorio de WhatsApp, y en el menú.",
    queHacer: "Escribe al menos el nombre y un teléfono, sube tu logo y pulsa «Guardar datos».",
    panel: () => <PanelClinica />,
  },
  {
    id: "doctores",
    icono: Stethoscope,
    titulo: "Tus doctores",
    resumen: "Quién atiende, con su porcentaje de comisión.",
    queEs: "La ficha de cada doctor: nombre, cédula, exequátur, especialidad y comisión.",
    porQue:
      "Sin un doctor no se puede agendar ni atender. La comisión es la base de su liquidación.",
    queHacer: "Pulsa «Nuevo doctor» y completa su ficha. Con uno basta para empezar.",
    panel: () => <PanelDoctores />,
  },
  {
    id: "unidades",
    icono: Armchair,
    titulo: "Unidades dentales",
    resumen: "Tus sillones, para que la agenda no los cruce.",
    queEs: "Cada sillón o consultorio donde se atiende; uno puede ser alquilado.",
    porQue: "La agenda impide dos citas a la vez en el mismo sillón y muestra la carga de cada uno.",
    queHacer: "Pulsa «Nueva unidad» por cada sillón. Si trabajas con uno solo, puedes omitirlo.",
    panel: () => <PanelUnidades />,
  },
  {
    id: "equipo",
    icono: Users,
    titulo: "Tu equipo",
    resumen: "Las cuentas de recepción, doctores y facturación.",
    queEs: "Una cuenta por persona, con su rol: recepción, doctor, asistente o facturación.",
    porQue:
      "Cada rol ve sólo lo suyo. Un usuario doctor se enlaza a su ficha: de ahí salen «Mis citas» y «Mi producción».",
    queHacer:
      "Pulsa «Nuevo usuario», elige el rol y una contraseña de 12 o más caracteres. Puedes hacerlo luego.",
    panel: () => <PanelUsuarios />,
  },
  {
    id: "ncf",
    icono: Receipt,
    titulo: "Comprobantes fiscales (NCF)",
    resumen: "El rango autorizado por la DGII, para poder facturar.",
    queEs: "El rango de números de comprobante que te autorizó la DGII, por tipo.",
    porQue: "Cada factura toma el siguiente número del rango. Sin él no se pueden emitir facturas.",
    queHacer:
      "Pulsa «Cargar secuencia» y copia el rango tal como lo autorizó la DGII. Si aún no facturas, omítelo.",
    panel: () => <PanelSecuencias />,
  },
  {
    id: "catalogo",
    icono: BookOpen,
    titulo: "Revisa tus servicios y precios",
    resumen: "Ya trae 47 servicios: ajusta lo que haga falta.",
    queEs: "El catálogo de lo que ofreces, con su precio en cada tarifa. Viene con 47 servicios de base.",
    porQue: "Los planes, las consultas y las facturas toman de aquí el precio y el nombre de cada servicio.",
    queHacer: "Abre el catálogo, ajusta precios o añade lo tuyo, y vuelve para marcarlo como revisado.",
  },
]

export function pasoDe(id: string | undefined): PasoGuia | undefined {
  return PASOS.find((p) => p.id === id)
}
