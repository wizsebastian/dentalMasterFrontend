/**
 * Datos locales para el laboratorio del odontograma.
 *
 * La vista /odontogram no habla con la API: es un banco de pruebas de la
 * representación. El catálogo se genera aquí con las mismas reglas que
 * `02_seed_catalogos.sql`, y los hallazgos reproducen los del paciente 1 del
 * seed para poder comparar con el odontograma en rejilla.
 */
import type { CondicionDental, Diente, Hallazgo } from "../../api/tipos"

const NOMBRES = [
  "Incisivo central",
  "Incisivo lateral",
  "Canino",
  "Primer premolar",
  "Segundo premolar",
  "Primer molar",
  "Segundo molar",
  "Tercer molar",
]

const GRUPOS = [
  "incisivo",
  "incisivo",
  "canino",
  "premolar",
  "premolar",
  "molar",
  "molar",
  "molar",
]

/** Genera las 32 piezas permanentes por bucle, como hace el seed. */
export function catalogoDientes(): Diente[] {
  const piezas: Diente[] = []

  for (let cuadrante = 1; cuadrante <= 4; cuadrante++) {
    for (let posicion = 1; posicion <= 8; posicion++) {
      const grupo = GRUPOS[posicion - 1]
      piezas.push({
        codigo_fdi: cuadrante * 10 + posicion,
        cuadrante,
        posicion,
        denticion: "permanente",
        nombre: NOMBRES[posicion - 1],
        grupo,
        arcada: cuadrante <= 2 ? "superior" : "inferior",
        lado: cuadrante === 1 || cuadrante === 4 ? "derecho" : "izquierdo",
        universal: null,
        // Los anteriores llevan cara incisal; los posteriores, oclusal.
        centro_oclusal: grupo === "incisivo" || grupo === "canino" ? "I" : "O",
      })
    }
  }

  return piezas
}

/** Subconjunto del catálogo real, con sus colores tal cual. */
export const CONDICIONES: CondicionDental[] = [
  { id: 2, codigo: "CAR", nombre: "Caries", ambito: "superficie", color_hex: "#E53935", patologico: true, orden: 2 },
  { id: 4, codigo: "DES", nombre: "Desgaste / atrición", ambito: "superficie", color_hex: "#8D6E63", patologico: true, orden: 4 },
  { id: 5, codigo: "REST_DEF", nombre: "Restauración defectuosa", ambito: "superficie", color_hex: "#F4511E", patologico: true, orden: 5 },
  { id: 7, codigo: "AUS_EXT", nombre: "Ausente por extracción", ambito: "diente", color_hex: "#424242", patologico: true, orden: 7 },
  { id: 20, codigo: "RES", nombre: "Restauración de resina", ambito: "superficie", color_hex: "#1E88E5", patologico: false, orden: 20 },
  { id: 21, codigo: "AMAL", nombre: "Amalgama", ambito: "superficie", color_hex: "#455A64", patologico: false, orden: 21 },
  { id: 24, codigo: "ENDO", nombre: "Tratamiento de conducto", ambito: "raiz", color_hex: "#1565C0", patologico: false, orden: 24 },
  { id: 27, codigo: "COR_PFM", nombre: "Corona metal-porcelana", ambito: "protesico", color_hex: "#3F51B5", patologico: false, orden: 27 },
  { id: 30, codigo: "IMPL", nombre: "Implante", ambito: "protesico", color_hex: "#00695C", patologico: false, orden: 30 },
]

const porCodigo = (codigo: string) => CONDICIONES.find((c) => c.codigo === codigo)!

let siguienteId = 1000

/** Construye un hallazgo con la forma que devuelve la API. */
export function crearHallazgo(
  codigoFdi: number,
  superficie: string | null,
  condicion: CondicionDental,
  estado: Hallazgo["estado"],
  fecha = "2026-03-02",
): Hallazgo {
  return {
    id: siguienteId++,
    codigo_fdi: codigoFdi,
    superficie,
    condicion_dental_id: condicion.id,
    condicion_codigo: condicion.codigo,
    condicion_nombre: condicion.nombre,
    color_hex: condicion.color_hex,
    ambito: condicion.ambito,
    estado,
    doctor_id: 1,
    fecha,
    notas: null,
  }
}

/** Los 11 hallazgos del paciente 1, para comparar contra la vista real. */
export function hallazgosDemo(): Hallazgo[] {
  return [
    crearHallazgo(11, "M", porCodigo("CAR"), "existente"),
    crearHallazgo(11, "M", porCodigo("RES"), "planificado"),
    crearHallazgo(16, "O", porCodigo("CAR"), "existente"),
    crearHallazgo(16, "O", porCodigo("RES"), "completado", "2026-03-20"),
    crearHallazgo(18, null, porCodigo("AUS_EXT"), "existente"),
    crearHallazgo(26, "O", porCodigo("AMAL"), "existente"),
    crearHallazgo(28, null, porCodigo("AUS_EXT"), "existente"),
    crearHallazgo(36, null, porCodigo("AUS_EXT"), "existente"),
    crearHallazgo(36, null, porCodigo("IMPL"), "planificado"),
    crearHallazgo(46, null, porCodigo("ENDO"), "existente"),
    crearHallazgo(46, null, porCodigo("COR_PFM"), "planificado"),
    // Añadidos para ver las cuatro caras laterales en una misma pieza
    crearHallazgo(47, "V", porCodigo("CAR"), "existente"),
    crearHallazgo(47, "L", porCodigo("RES"), "completado"),
    crearHallazgo(47, "D", porCodigo("DES"), "existente"),
    crearHallazgo(37, "M", porCodigo("REST_DEF"), "existente"),
  ]
}

/** Piezas marcadas como ausentes, que en el odontograma llevan aspa. */
export const PIEZAS_AUSENTES = [18, 28, 36]
