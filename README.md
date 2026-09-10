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

`gen:api` necesita la API corriendo. Conviene ejecutarlo cada vez que cambie un
endpoint: es lo que mantiene el contrato entre backend y frontend sin
desincronizarse en silencio.

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

## Estructura

```
src/
├── api/         cliente HTTP y schema.d.ts generado desde el OpenAPI
├── components/
│   └── brand/   molar compartido: logo, favicon y spinner
└── index.css    tokens de color y tipografía (@theme de Tailwind v4)
```

## Nota de dependencias

TypeScript está fijado en 5.9: `openapi-typescript` todavía declara `^5.x` como
peer y no hay ninguna versión publicada que soporte TS 6.
