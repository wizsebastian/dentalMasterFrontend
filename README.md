# DentalMaster · Frontend

Interfaz de gestión clínica odontológica.

React 19 · TypeScript · Vite · Tailwind v4 · TanStack Query · lucide

## Arranque

Necesita la API levantada: en `dentalMasterApi`, `make up`.

```bash
cp .env.example .env
npm install
npm run dev        # http://localhost:5173
```

El navegador siempre habla con `:5173`. Vite hace de proxy hacia la API en
`/api` y `/health`, así que en desarrollo no hay CORS ni URLs por entorno.

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción (`tsc -b` + `vite build`) |
| `npm run typecheck` | Sólo comprobación de tipos |
| `npm run lint` | oxlint |
| `npm run gen:api` | Regenera `src/api/schema.d.ts` desde el OpenAPI de la API |
| `npm run e2e` | Prueba de humo de la interfaz en un navegador real (necesita Docker) |
| `npm run e2e botones` | Comprueba los dos bancos de pruebas y su botón de volver |
| `npm run e2e loaders` | Comprueba el loading de isotipos de ambos bancos |
| `npm run e2e notaciones` | Comprueba el menú contextual sobre el lienzo de la librería |
| `npm run e2e catalogo` | Catálogo de servicios, categorías, configuración y permisos por rol |
| `npm run e2e paciente` | Alta y edición de paciente, buscador y ficha médica |
| `npm run e2e recorrido` | Agenda, consulta, cobro y recibo, firma, caja, gastos, inventario e informes. **Escribe datos: `make reset` después** |
| `npm run e2e extras` | Archivos, implantes, odontograma, comprobantes fiscales, cierre de caja, tarifas y vista de mes. **Escribe datos: `make reset` después** |
| `npm run e2e informes` | Reporte por doctor desde Informes y «Mi producción» del propio doctor. Sólo lee |
| `npm run e2e onboarding` | La guía de primeros pasos sobre una clínica vacía. **Necesita `make vacio`** y la deja configurada |
| `npm run e2e mejoras` | «Salir», búsqueda sin tildes, teléfonos, selects con buscador, ítems del plan, pincel del odontograma y datos de la clínica. **Escribe datos: `make reset` después** |

`npm run e2e <guion>` ejecuta `e2e/<guion>.mjs`. Los guiones que escriben (`catalogo`,
`paciente`) deshacen lo que hacen: después de correrlos, `make verify` en la API sigue
dando 101 PASS. Con `PUERTO=5174 npm run e2e …` se apunta a un segundo servidor de
desarrollo sin parar el de `:5173`.

`gen:api` necesita la API corriendo. Conviene ejecutarlo cada vez que cambie un
endpoint: es lo que mantiene el contrato entre backend y frontend sin
desincronizarse en silencio.

## Línea gráfica

Tomada de `LOGO/PNG`. El isotipo es una **G cuya contraforma es un molar**; el
logotipo añade el filete malva y la firma «Dr. Gabriel Martínez · Implantólogo».
Las seis versiones del isotipo viven en `public/marca/` y están registradas en
`src/components/brand/isotipos.ts`, cada una con el fondo sobre el que debe ir.

| | |
|---|---|
| Azul marino | `#223262` — color de marca, acciones y estados activos |
| Malva | `#9F63A5` — **sólo filetes y detalles** |

El malva no se usa nunca como relleno de dato: queda cerca de los púrpuras del
catálogo clínico (`#7B1FA2`, `#6A1B9A`), y ahí un color saturado significa algo.

`Cargando` releva versiones del isotipo, cada una exactamente el mismo tiempo
(el retardo de cada una es su posición partida por el total).

Con las seis, la versión positiva es blanca y arrastra su propio fondo azul
marino: es la única forma de incluirla sin romper el manual. Los bancos de
pruebas del odontograma usan en cambio `ISOTIPOS_COLOR` —sólo A, B, C y D—,
porque positiva y negativa son versiones de reproducción a una tinta y en una
animación sólo aportan un latido en blanco y otro en negro.

## El color es dato, no decoración

El catálogo `condicion_dental` define 35 colores —teales, azules, índigos,
púrpuras, magentas, rojos, naranjas, marrones— y todos son saturados. En el
odontograma cada uno significa algo: un rojo es caries, un azul es una
restauración existente.

Por eso **la interfaz es acromática a propósito**. Si el chrome usara hues
saturados competiría con la señal clínica. El único color de marca es
`--color-marca` (`#223262`), el azul marino del manual, para acciones y estados
activos; el resto de la paleta es gris. Los tokens viven en `@theme` de
`src/index.css`, que es la autoridad.

Al añadir pantallas: los colores de estado se toman de la API, nunca se escriben
a mano. `Insignia` recibe ese color y lo usa apagado —texto y borde en el tono,
fondo casi blanco—; sin color es gris.

## Tipografía

Archivo para la interfaz, IBM Plex Mono **sólo para códigos reales**: piezas
FDI, `REST-001`, `PT-2026-0001`, NCF, lotes de implante. El dominio está lleno de
identificadores que hay que escanear y alinear en columna; para eso existe
`.tabular`, que activa numerales tabulares. No se usa mono para etiquetas de
interfaz.

## Primitivas, formularios y formato

`src/components/ui/` tiene pocas piezas y ninguna con variantes de color (salvo el tono de los
mensajes):

| | |
|---|---|
| `Boton`, `Tarjeta`, `Vacio`, `ErrorCarga`, `Esqueleto` | Lo básico de cualquier pantalla |
| `Campo`, `CampoFecha`, `CampoTelefono`, `AreaTexto`, `Casilla` | Campos con etiqueta, ayuda y error; aceptan `{...register("x")}`. El teléfono lleva máscara `(809) 555-0100` |
| `Selector`, `SelectorFiltro` | **Todo select tiene buscador** (sin tildes). El `<select>` nativo sigue en el DOM, oculto, y es lo que lee el formulario; encima va la caja con la lista filtrable |
| `Dialogo`, `PieDialogo` | Modal sobre el `<dialog>` nativo: el foco, Escape y el velo los pone el navegador |
| `Pestanas` + `usePestana` | La pestaña activa vive en la URL (`?pestana=ficha`) |
| `Tabla` + `Paginacion` | Tabla por columnas declaradas |
| `Combobox` | Búsqueda con lista y teclado |
| `Insignia` | Estado; el color llega de la API |
| `Aviso`, `useAviso` | Mensaje en la página con `tono` (`error`, `advertencia`, `exito`, `info`: borde, icono y fondo tenue); confirmación pasajera |

**Formularios:** react-hook-form + zod. Lo que falla en el servidor vuelve como
`ApiError.campos` y `aplicarErrorApi` (`src/lib/formularios.ts`) lo pinta junto a
su control; lo demás sale como mensaje general. Un texto vacío viaja como `null`
(`oNulo`), no como cadena vacía.

**Formato:** todo pasa por `src/lib/formato.ts` —`fecha`, `hora`, `moneda`,
`telefono`, `edad`, `rol`, `doctor`—, con `Intl` en `es-DO`. Una fecha, una
cifra o un teléfono no se formatean a mano en ninguna pantalla. El tratamiento
«Dr(a).» lo pone `doctor()`: no forma parte del nombre guardado.

**Impresión:** todo impreso empieza por `Membrete` (`src/features/clinica/`), que toma el logo y los datos
de Configuración → Clínica. Se imprime desde el navegador. `.no-imprimir` oculta el marco,
`.hoja` es un documento carta y `.hoja-ticket` un recibo de 80 mm
(`src/index.css`).

## El marco

Barra lateral con los enlaces que el rol puede ver (`NAVEGACION` en
`src/rutas/Layout.tsx`; sólo se enlaza lo que ya existe). Dos atajos globales:
`⌘K` / `Ctrl K` abre el buscador de pacientes y `F1` el alta. El alta y la
edición de paciente son **un solo formulario** (`DialogoPaciente`), y los datos
de salud no están en él sino en la ficha médica (`DialogoFicha`), que es el
único cuestionario.

## Bancos de pruebas

Dos rutas fuera de la sesión y con estado local: no leen ni escriben datos de
ningún paciente. Se llega a ambas desde el pie de la pantalla de acceso, sin
credenciales, y cada una vuelve con su botón.

| Ruta | Qué prueba |
|---|---|
| `/odontogram` | Arcada anatómica propia, con marcado por cara |
| `/odontogram-especial` | `react-advanced-odontogram`, la librería |

El odontograma de `ficha_clinica.docx` —el documento que se genera en cada
visita— es el clásico en **filas lineales**, con vista facial y raíces más la
oclusal. La librería usa ese mismo formato; la arcada propia, no.

De la librería se conserva el **motor y el lienzo**; su interfaz no se usa.
`OdontogramProvider` sólo renderiza el envoltorio alrededor de sus hijos, así que
montando únicamente `OdontogramChartSurface` desaparecen el panel derecho de diez
tarjetas y la cabecera con su marca. No hay nada oculto con CSS: no se renderiza.

Encima va `MenuNotaciones`, que aplica las notaciones de la ficha con la API
imperativa (`set*ForSelection`). La selección se lee del DOM: el lienzo es una
listbox accesible y cada pieza es un `role="option"` con `data-tooth` y
`aria-selected`. La librería no exporta getter para esto —su propio código llama
a la selección *module-private state*—, pero `aria-selected` es contrato de
accesibilidad, no detalle interno, y da además la caja para anclar el menú.

Ojo al leer el DOM: hay **dos tiles por pieza**, la vista facial y la oclusal.
Sólo la facial lleva `role="option"`; filtrar por rol evita contar cada diente
dos veces.

Debajo del lienzo va **la tabla de lo marcado**, con una papelera por fila que
no borra sólo la línea: deshace la notación en el odontograma llamando a su
inversa sobre las mismas piezas.

Esa tabla existe porque el motor no permite otra cosa. `getToothStateSummary`
devuelve el estado de cada pieza ya traducido a texto, sin forma de saber qué
llamada lo puso ahí; sin eso no se puede quitar una notación concreta, sólo
reiniciar el diente entero. El registro lo lleva la aplicación, y como sólo se
llena desde el menú —y ni el registro ni el lienzo sobreviven a una recarga—,
los dos se mantienen en el mismo estado.

**Los valores «ninguno» no se adivinan.** Salen del motor: `mobilityOptions`,
`wearEdgeOptions`, `restorationOptions`, `pulpEndoGroups`. Adivinarlos fue el
primer intento y mandaba valores que la librería ignora en silencio —movilidad
no es `1/2/3` sino `m1/m2/m3`, y la endodoncia hecha no es `endo-ok` sino
`endo-filling`.

Sigue pesando 2,8 MB (675 KB gz) más jsPDF y fuentes Noto, así que se carga
diferida para no tocar el bundle de las pantallas clínicas.

## Banco de pruebas: `/odontogram`

Ruta fuera de la sesión, con estado local: no lee ni escribe datos de ningún
paciente. Compara dos representaciones sobre los mismos hallazgos —arcada
anatómica y rejilla— para decidir cuál se lleva al expediente.

Las librerías publicadas de odontograma en arcada
([`react-odontogram`](https://github.com/biomathcode/react-odontogram),
[`react-advanced-odontogram`](https://github.com/ZoliQua/React-Odontogram-Modul))
marcan la **pieza entera**, y este modelo de datos registra **por cara**. La
salida es dibujar la silueta anatómica y usarla de `clipPath` sobre sectores que
salen del centro del diente: silueta de diente y marcado por superficie a la vez.

Las piezas se reparten por **longitud de arco proporcional a su ancho**, no a
intervalos de ángulo iguales: un molar es casi el doble de ancho que un incisivo
lateral y con paso uniforme se solapan.

## El odontograma

Cada pieza es un SVG de cinco caras: cuatro trapecios alrededor de un centro que
es **oclusal** en molares y premolares e **incisal** en incisivos y caninos. Lo
decide `diente.grupo`, que llega del catálogo.

Mesial y distal cambian de lado según el cuadrante —mesial siempre apunta a la
línea media—, así que el esquema se lee como se mira la boca de frente.

Cuando una cara acumula varios hallazgos, **lo planificado nunca tapa lo real**:
una caries con una resina propuesta encima sigue siendo una caries, y el plan
aparece como un punto de color en esa cara. Entre los hallazgos que sí
ocurrieron gana el más reciente, porque una resina completada después resuelve
la caries que había.

El estado sólo decide la textura: sólido lo existente y lo completado, rayado lo
planificado, translúcido lo que está en proceso. Así un mismo diagnóstico se
reconoce esté propuesto o ya ejecutado.

En el expediente, la tabla bajo el dibujo agrupa los hallazgos por pieza y condición y
**calcula la clase de Black** a partir de las caras (`components/odontograma/black.ts`): no se
guarda, así que no puede discrepar de lo dibujado. La paleta reparte las 35 condiciones en
pestañas y las versiones se recorren como una línea de tiempo.

## Archivos

Las fotos, los exámenes y los comprobantes exigen sesión, así que **nunca van como `src`
directo**. `useContenido(archivoId)` pide los bytes con el token (`apiBlob`) y devuelve una
URL de objeto que vive en la caché de consultas; `main.tsx` la libera cuando la caché la
descarta. Subir es un `FormData` por el mismo `apiFetch`.

## Estructura

```
src/
├── api/         cliente HTTP, sesión y schema.d.ts generado desde el OpenAPI
├── components/
│   ├── brand/       isotipos, logotipo y Cargando
│   ├── odontograma/ geometría de las cinco caras, lienzo y paleta
│   └── ui/          primitivas, sin variantes de color
├── features/
│   ├── auth/          sesión y login
│   ├── inicio/        tablero del día: por llegar, en sala, atendidos
│   ├── agenda/        calendario propio, lista imprimible, cita y su detalle
│   ├── pacientes/     listado, expediente, alta/edición, ficha, odontograma
│   ├── historial/     planes de tratamiento, consultas con sus líneas, presupuesto
│   ├── caja/          cuenta del paciente, pagos, recibo, cobros y cuentas por cobrar
│   ├── documentos/    plantillas, documentos, receta, firma (página sin sesión)
│   ├── gastos/  inventario/  informes/
│   ├── catalogo/      servicios y precios, categorías, especialidades, receta de insumos
│   ├── configuracion/ unidades dentales, doctores, usuarios, plantillas
│   └── laboratorio/   bancos de pruebas del odontograma
├── lib/         formato (es-DO) y ayudas de formulario
└── rutas/       marco, router y contexto del marco
e2e/             pruebas en navegador real, un guion por archivo
```

## Nota de dependencias

TypeScript está fijado en 5.9: `openapi-typescript` todavía declara `^5.x` como
peer y no hay ninguna versión publicada que soporte TS 6.
