/* Primitivas de interfaz. Deliberadamente pocas y sin variantes de color: la
   saturación está reservada al dato clínico. */
export { Aviso, ProveedorAvisos } from "./Aviso"
export { useAviso } from "./avisos"
export { Boton, ErrorCarga, Tarjeta, Vacio } from "./basicos"
export {
  AreaTexto,
  Campo,
  CampoFecha,
  CampoTelefono,
  Casilla,
  Selector,
  SelectorFiltro,
} from "./campos"
export { Combobox, type Opcion } from "./Combobox"
export { Dialogo, PieDialogo } from "./Dialogo"
export { DialogoMotivo } from "./DialogoMotivo"
export { Esqueleto, EsqueletoTabla } from "./Esqueleto"
export { Insignia } from "./Insignia"
export { Pestanas, type Pestana } from "./Pestanas"
export { usePestana } from "./usePestana"
export { Paginacion, Tabla, type Columna } from "./Tabla"
export { VolverAtras } from "./VolverAtras"
