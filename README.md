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
`--color-marca` (`#1e4b45`), un teal tan oscuro y desaturado que se lee como
neutro: el verde del campo quirúrgico. Nunca se confunde con un hallazgo.

Al añadir pantallas: los colores de estado se toman del endpoint de catálogos,
nunca se escriben a mano.

## Tipografía

IBM Plex Sans para la interfaz, IBM Plex Mono **sólo para códigos reales**:
piezas FDI, `REST-001`, `PT-2026-0001`, NCF, lotes de implante. El dominio está
lleno de identificadores que hay que escanear y alinear en columna; para eso
existe `.tabular`, que activa numerales tabulares. No se usa mono para
etiquetas de interfaz.

## La marca

Un solo trazado de molar en `src/components/brand/tooth-path.ts`, compartido por
el logo, el favicon (`public/favicon.svg`) y el spinner. Está dibujado sobre la
rejilla de 24×24 de lucide, así que convive con el resto de la iconografía.

`ToothSpinner` llena el diente desde la raíz hacia la corona en lugar de girar:
una silueta dentada rotando se lee como una mancha a 20px. Con
`prefers-reduced-motion` el relleno se queda quieto y visible.

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

## Estructura

```
src/
├── api/         cliente HTTP, sesión y schema.d.ts generado desde el OpenAPI
├── components/
│   ├── brand/       molar compartido: logo, favicon y spinner
│   ├── odontograma/ geometría de las cinco caras, lienzo y paleta
│   └── ui/          primitivas, sin variantes de color
├── features/    auth y pacientes (listado, expediente, ficha, odontograma)
└── rutas/       layout y router
e2e/             prueba de humo en navegador real
```

## Nota de dependencias

TypeScript está fijado en 5.9: `openapi-typescript` todavía declara `^5.x` como
peer y no hay ninguna versión publicada que soporte TS 6.
