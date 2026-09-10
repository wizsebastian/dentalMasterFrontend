/**
 * Las seis versiones del isotipo, tal como vienen del manual de marca.
 *
 * `fondo` indica sobre qué ha de ir cada una: la versión positiva es blanca y
 * sólo se lee sobre oscuro, así que arrastra su propio fondo. Respetarlo es lo
 * que permite usarlas todas en la animación de carga sin que ninguna se pierda.
 */
export type VersionIsotipo = {
  archivo: string
  nombre: string
  fondo: "claro" | "oscuro"
}

export const ISOTIPOS: VersionIsotipo[] = [
  { archivo: "/marca/isotipo-a.png", nombre: "Isotipo principal", fondo: "claro" },
  { archivo: "/marca/isotipo-b.png", nombre: "Isotipo sobre blanco", fondo: "claro" },
  { archivo: "/marca/isotipo-c.png", nombre: "Isotipo en azul", fondo: "claro" },
  { archivo: "/marca/isotipo-d.png", nombre: "Isotipo en malva", fondo: "claro" },
  { archivo: "/marca/isotipo-negativo.png", nombre: "Isotipo en negro", fondo: "claro" },
  { archivo: "/marca/isotipo-positivo.png", nombre: "Isotipo en blanco", fondo: "oscuro" },
]

/**
 * Las cuatro versiones cromáticas.
 *
 * Positiva y negativa son las versiones monocromas para reproducción —una tinta,
 * fondos oscuros—, no variantes de color. En una animación no aportan color:
 * aportan un latido en blanco y otro en negro.
 */
export const ISOTIPOS_COLOR: VersionIsotipo[] = ISOTIPOS.slice(0, 4)

export const LOGOTIPOS = {
  color: "/marca/logotipo-a.png",
  soloIsotipo: "/marca/logotipo-b.png",
  blanco: "/marca/logotipo-positivo.png",
  negro: "/marca/logotipo-negativo.png",
} as const
