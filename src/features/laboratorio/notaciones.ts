import {
  setBrokenDistalForSelection,
  setBrokenIncisalForSelection,
  setBrokenMesialForSelection,
  setCariesSurfaceForSelection,
  setCrownLeakageForSelection,
  setCrownNeededForSelection,
  setExtractionPlanForSelection,
  setFillingSurfaceForSelection,
  setMobilityForSelection,
  setOrthoApplianceForSelection,
  setOrthoDriftForSelection,
  setOrthoRotationForSelection,
  setOrthoVerticalForSelection,
  setPulpEndoForSelection,
  setRestorationForSelection,
  setToothSelectionForSelection,
  setWearEdgeForSelection,
} from "react-advanced-odontogram"

/**
 * Las notaciones de `observaciones_de_dentigrama.pdf`.
 *
 * El PDF pinta con **dos** colores y el color es el estado, no el tipo:
 * rojo lo que hay que hacer, azul lo que ya está hecho. Se respeta esa
 * agrupación porque es como el doctor lee la ficha en papel.
 *
 * Cada entrada dice además su **ámbito**: las de cara piden una superficie
 * antes de aplicarse; las de pieza actúan sobre el diente entero.
 */

export type Color = "rojo" | "azul"
export type Ambito = "pieza" | "cara"

export type Notacion = {
  id: string
  /** Como lo nombra el PDF. */
  etiqueta: string
  color: Color
  ambito: Ambito
  /** Qué dibuja el PDF, para la ayuda contextual. */
  marca: string
  /** Aplica la notación a la selección actual del motor. */
  aplicar: (valor?: string) => void
  /** Valores fijos cuando la notación los tiene (movilidad 1-2-3). */
  valores?: { valor: string; etiqueta: string }[]
}

/** Caras marcables, en el orden en que se leen en la ficha. */
export const CARAS = [
  { codigo: "M", nombre: "Mesial" },
  { codigo: "D", nombre: "Distal" },
  { codigo: "V", nombre: "Vestibular" },
  { codigo: "L", nombre: "Lingual / palatino" },
  { codigo: "O", nombre: "Oclusal / incisal" },
]

export const NOTACIONES: Notacion[] = [
  // ---- Rojo: lo que hay que hacer -------------------------------------
  {
    id: "caries",
    etiqueta: "Caries",
    color: "rojo",
    ambito: "cara",
    marca: "Punto rojo en la cara afectada",
    aplicar: (cara) => setCariesSurfaceForSelection(cara ?? "O", true),
  },
  {
    id: "extraer",
    etiqueta: "A extraer",
    color: "rojo",
    ambito: "pieza",
    marca: "X roja sobre la pieza",
    aplicar: () => setExtractionPlanForSelection(true),
  },
  {
    id: "corona-hacer",
    etiqueta: "Corona a hacer",
    color: "rojo",
    ambito: "pieza",
    marca: "Pieza entera cubierta de rojo",
    aplicar: () => setCrownNeededForSelection(true),
  },
  {
    id: "endodoncia-hacer",
    etiqueta: "Endodoncia a hacer",
    color: "rojo",
    ambito: "pieza",
    marca: "Raya roja sobre la pulpa (TCR)",
    aplicar: () => setPulpEndoForSelection("necrosis"),
  },
  {
    id: "fractura",
    etiqueta: "Fractura",
    color: "rojo",
    ambito: "cara",
    marca: "Línea oblicua roja en la zona fracturada",
    aplicar: (cara) => {
      if (cara === "M") setBrokenMesialForSelection(true)
      else if (cara === "D") setBrokenDistalForSelection(true)
      else setBrokenIncisalForSelection(true)
    },
  },
  {
    id: "protesis-mala",
    etiqueta: "Prótesis en mal estado",
    color: "rojo",
    ambito: "pieza",
    marca: "Contorno azul y rojo",
    aplicar: () => setCrownLeakageForSelection(true),
  },

  // ---- Azul: lo que ya está hecho -------------------------------------
  {
    id: "restauracion",
    etiqueta: "Restauración",
    color: "azul",
    ambito: "cara",
    marca: "Punto azul: tenía caries y ya no",
    aplicar: (cara) => setFillingSurfaceForSelection(cara ?? "O", true),
  },
  {
    id: "ausente",
    etiqueta: "Ausente",
    color: "azul",
    ambito: "pieza",
    marca: "X azul sobre la pieza",
    aplicar: () => setToothSelectionForSelection("none"),
  },
  {
    id: "corona-hecha",
    etiqueta: "Corona hecha",
    color: "azul",
    ambito: "pieza",
    marca: "Pieza entera cubierta de azul",
    aplicar: (valor) => setRestorationForSelection(valor ?? "crown|metal-ceramic"),
  },
  {
    id: "puente",
    etiqueta: "Prótesis fija (póntico)",
    color: "azul",
    ambito: "pieza",
    marca: "Contorno azul y pilares circulares",
    aplicar: (valor) => setRestorationForSelection(valor ?? "bridge|metal-ceramic"),
  },
  {
    id: "endodoncia-hecha",
    etiqueta: "Endodoncia hecha",
    color: "azul",
    ambito: "pieza",
    marca: "Raya azul sobre la pulpa",
    aplicar: () => setPulpEndoForSelection("endo-ok"),
  },
  {
    id: "implante",
    etiqueta: "Implante",
    color: "azul",
    ambito: "pieza",
    marca: "IMP y un tornillo",
    aplicar: () => setToothSelectionForSelection("implant"),
  },
  {
    id: "impactado",
    etiqueta: "Impactado / retenido",
    color: "azul",
    ambito: "pieza",
    marca: "I mayúscula en azul",
    aplicar: () => setToothSelectionForSelection("tooth-under-gum"),
  },
  {
    id: "movilidad",
    etiqueta: "Movilidad",
    color: "azul",
    ambito: "pieza",
    marca: "M con el grado al lado",
    aplicar: (valor) => setMobilityForSelection(valor ?? "1"),
    valores: [
      { valor: "1", etiqueta: "M1" },
      { valor: "2", etiqueta: "M2" },
      { valor: "3", etiqueta: "M3" },
    ],
  },
  {
    id: "giroversion",
    etiqueta: "Giroversión",
    color: "azul",
    ambito: "pieza",
    marca: "Curva azul hacia donde está girado",
    aplicar: () => setOrthoRotationForSelection(true),
  },
  {
    id: "migracion",
    etiqueta: "Migración",
    color: "azul",
    ambito: "pieza",
    marca: "Flecha azul hacia la dirección",
    aplicar: (valor) => setOrthoDriftForSelection(valor ?? "mesial"),
    valores: [
      { valor: "mesial", etiqueta: "Hacia mesial" },
      { valor: "distal", etiqueta: "Hacia distal" },
    ],
  },
  {
    id: "vertical",
    etiqueta: "Intruido / extruido",
    color: "azul",
    ambito: "pieza",
    marca: "Flecha vertical, arriba o abajo",
    aplicar: (valor) => setOrthoVerticalForSelection(valor ?? "intrusion"),
    valores: [
      { valor: "intrusion", etiqueta: "Intruido" },
      { valor: "extrusion", etiqueta: "Extruido" },
    ],
  },
  {
    id: "ortodoncia",
    etiqueta: "Aparato de ortodoncia",
    color: "azul",
    ambito: "pieza",
    marca: "Cuadro azul con cruz, o zigzag si es removible",
    aplicar: (valor) => setOrthoApplianceForSelection(valor ?? "bracket"),
  },
  {
    id: "desgaste",
    etiqueta: "Desgaste",
    color: "azul",
    ambito: "pieza",
    marca: "DES y una línea azul",
    aplicar: (valor) => setWearEdgeForSelection(valor ?? "1"),
  },
]

/**
 * Notaciones del PDF que el motor de la librería no sabe registrar.
 *
 * Se listan en el menú, deshabilitadas. Si faltan, que se vea que faltan:
 * esconderlas haría creer que la ficha está cubierta cuando no lo está.
 * Llegan en la fase 2, dibujadas con `registerPlugins`.
 */
export const PENDIENTES = [
  "Supernumerario",
  "Microdoncia / macrodoncia",
  "Geminación / fusión",
  "En erupción",
  "Ectópico",
  "Transposición",
  "Diastema",
]
