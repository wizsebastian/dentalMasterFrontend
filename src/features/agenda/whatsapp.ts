import type { Cita, Clinica } from "../../api/tipos"
import { doctor, fechaLarga, hora, telefono, telefonoInternacional } from "../../lib/formato"

/**
 * Enlace que abre WhatsApp con el recordatorio ya escrito.
 *
 * Es un enlace, no un envío: lo manda la persona desde su WhatsApp. `null` si
 * el paciente no tiene un teléfono utilizable.
 */
export function enlaceRecordatorio(cita: Cita, clinica: Clinica | undefined): string | null {
  const destino = telefonoInternacional(cita.paciente_celular)
  if (!destino) return null

  const nombre = cita.paciente_nombre.split(" ")[0]
  const mensaje =
    `Hola ${nombre}, le recordamos su cita` +
    (clinica ? ` en ${clinica.nombre}` : "") +
    ` el ${fechaLarga(cita.inicio)} a las ${hora(cita.inicio)}` +
    ` con ${doctor(cita.doctor_nombre)}.` +
    " Si no puede asistir, por favor avísenos para reprogramarla" +
    (clinica?.whatsapp ? ` por este WhatsApp o al ${telefono(clinica.whatsapp)}.` : ".")

  return `https://wa.me/${destino}?text=${encodeURIComponent(mensaje)}`
}
