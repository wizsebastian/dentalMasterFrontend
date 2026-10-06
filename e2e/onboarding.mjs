/**
 * La guía de primeros pasos sobre una clínica recién entregada.
 *
 * **Necesita la base vacía** (`make vacio` en la API) y la deja configurada:
 * después hay que volver a `make vacio` (o `make reset` para la demo).
 *
 *   npm run e2e onboarding
 */
import { chromium } from 'playwright'

const B = process.env.BASE
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)
const fallos = []
const errores = []
const nav = await chromium.launch()
const LUGAR = { timezoneId: 'America/Santo_Domingo', locale: 'es-DO' }

function check(nombre, ok, detalle = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${nombre}${detalle ? ` — ${detalle}` : ''}`)
  if (!ok) fallos.push(nombre)
}
const visible = (loc, ms = 15000) => loc.waitFor({ timeout: ms }).then(() => true, () => false)

async function entrar(opciones = {}) {
  const contexto = await nav.newContext({ viewport: { width: 1440, height: 1000 }, ...LUGAR, ...opciones })
  const pag = await contexto.newPage()
  pag.on('pageerror', (e) => errores.push(`pageerror: ${e.message}`))
  pag.on('console', (m) => {
    if (m.type() === 'error' && !/40[0-9]|422/.test(m.text())) errores.push(m.text())
  })
  await pag.goto(B, { waitUntil: 'networkidle' })
  await pag.getByLabel('Correo').fill('admin@dentalsonrisa.do')
  await pag.getByLabel('Contraseña').fill('Sonrisa-Prueba-7392')
  await pag.getByRole('button', { name: 'Entrar' }).click()
  return pag
}

// ============================================== Sin movimiento: la guía funciona igual
const quieta = await entrar({ reducedMotion: 'reduce' })
await quieta.waitForURL('**/bienvenida', { timeout: 15000 })
await visible(quieta.getByRole('heading', { name: 'Bienvenido a DentalMaster' }))
const animaciones = await quieta.evaluate(() =>
  [...document.querySelectorAll('.guia-sube, .guia-turno')].map((e) => getComputedStyle(e).animationName),
)
check('con «reducir movimiento» ninguna animación corre',
  animaciones.length > 0 && animaciones.every((a) => a === 'none'), [...new Set(animaciones)].join(','))
check('y la guía sigue usable', await visible(quieta.getByRole('link', { name: /Datos de tu clínica y logo/ })))
await quieta.context().close()

// ============================================== Primer ingreso
const pag = await entrar()
await pag.waitForURL('**/bienvenida', { timeout: 15000 })
check('el administrador de una clínica vacía cae en la guía, no en «Hoy»',
  await visible(pag.getByRole('heading', { name: 'Bienvenido a DentalMaster' })))
check('el anillo arranca en 0 de 6', await visible(pag.getByRole('img', { name: '0 de 6 pasos hechos' })))
const tarjetas = await pag.locator('ol > li.guia-sube').count()
check('los pasos se hacen uno a uno: sólo el primero está abierto',
  await pag.locator('ol > li a[href^="/bienvenida/"]').count() === 1 &&
  await pag.locator('ol > li [aria-disabled="true"]').count() === 5)
await pag.goto(`${B}/bienvenida/doctores`, { waitUntil: 'networkidle' })
check('un paso adelantado por la dirección devuelve al que toca', pag.url().endsWith('/bienvenida/clinica'))
await pag.goto(`${B}/bienvenida`, { waitUntil: 'networkidle' })
check('hay seis pasos, con dos obligatorios',
  tarjetas === 6 && await pag.getByText('Obligatorio', { exact: true }).count() === 2, `${tarjetas}`)
check('la tarea en turno respira y ofrece «Empezar»',
  await pag.locator('a.guia-turno', { hasText: 'Empezar' }).count() === 1)
await pag.screenshot({ path: '/salida/onboarding-01-bienvenida.png', fullPage: true })

check('mientras dura la guía no hay menú lateral',
  await pag.getByRole('navigation', { name: 'Principal' }).count() === 0 && await pag.locator('aside').count() === 0)
check('y no hay logo de ninguna marca: sale el nombre de la clínica',
  await pag.locator('img[alt*="Gabriel"]').count() === 0 && await visible(pag.locator('header', { hasText: 'Mi clínica' }).first()))
check('no existe «Omitir por ahora»',
  await pag.getByRole('button', { name: /Omitir por ahora/ }).count() === 0)
await pag.goto(`${B}/agenda`, { waitUntil: 'networkidle' })
check('no se puede salir de la guía a otra pantalla: devuelve a ella',
  pag.url().endsWith('/bienvenida') && await visible(pag.getByRole('heading', { name: 'Bienvenido a DentalMaster' })))
await pag.goto(`${B}/inicio`, { waitUntil: 'networkidle' })
check('ni siquiera a «Hoy»', pag.url().endsWith('/bienvenida'))

check('sin lo obligatorio no se puede terminar',
  await pag.getByRole('button', { name: 'Terminar configuración' }).isDisabled())

// --- Paso 1: la clínica
await pag.getByRole('link', { name: 'Empezar' }).click()
await pag.waitForURL('**/bienvenida/clinica')
check('el paso trae su guía: qué es, por qué importa y qué hacer',
  await visible(pag.getByText('Qué es', { exact: true })) &&
  await visible(pag.getByText('Por qué importa', { exact: true })) &&
  await visible(pag.getByText('Qué hacer ahora', { exact: true })))
check('el botón que hay que pulsar late',
  await visible(pag.locator('[data-guia-pulso]', { hasText: 'Guardar datos' })))
check('un paso obligatorio sin hacer no deja continuar',
  await pag.getByRole('button', { name: /Siguiente: Tus doctores/ }).isDisabled())
await pag.getByLabel('Nombre de la clínica').fill('Clínica Dental Sonrisa')
await pag.getByLabel('Teléfono').pressSequentially('8095550100')
await pag.locator('input[aria-label="Archivo del logo"]').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: PNG })
check('el logo que subes aparece al instante arriba, donde estaba el nombre',
  await visible(pag.locator('header img').first()))
await pag.getByRole('button', { name: 'Guardar datos' }).click()
check('al guardar, el paso se marca solo como hecho',
  await visible(pag.getByText('Hecho', { exact: true })))
check('y el anillo avanza a 1 de 6', await visible(pag.getByRole('img', { name: '1 de 6 pasos hechos' })))
await pag.screenshot({ path: '/salida/onboarding-02-clinica-hecha.png', fullPage: true })

// --- Paso 2: el primer doctor
await pag.getByRole('button', { name: /Siguiente: Tus doctores/ }).click()
await pag.waitForURL('**/bienvenida/doctores')
check('en el paso de doctores late «Nuevo doctor»',
  await visible(pag.locator('[data-guia-pulso]', { hasText: 'Nuevo doctor' })))
await pag.getByRole('button', { name: 'Nuevo doctor' }).click()
const doctor = pag.getByRole('dialog')
await doctor.getByLabel('Nombres').fill('Laura')
await doctor.getByLabel('Apellidos').fill('Fernández Cruz')
await doctor.getByLabel('Cédula').fill('00112345671')
await doctor.getByRole('button', { name: 'Crear doctor' }).click()
check('crear el primer doctor completa el paso y habilita seguir',
  await visible(pag.getByText('Hecho', { exact: true })) &&
  await visible(pag.getByRole('img', { name: '2 de 6 pasos hechos' })))

// --- Omitir lo opcional y terminar
await pag.getByRole('button', { name: /Siguiente: Unidades dentales/ }).click()
await pag.waitForURL('**/bienvenida/unidades')
check('lo opcional sí se puede dejar para después, paso a paso',
  await visible(pag.getByRole('button', { name: 'Omitir este paso' })))
await pag.getByRole('button', { name: 'Omitir este paso' }).click()
await pag.waitForURL('**/bienvenida/equipo')
check('omitir un opcional abre el siguiente, no los demás',
  await pag.getByRole('link', { name: /Primeros pasos/ }).count() > 0)
await pag.getByRole('link', { name: 'Primeros pasos' }).click()
await pag.waitForURL('**/bienvenida')
check('con lo obligatorio hecho ya se puede terminar',
  await pag.getByRole('button', { name: 'Terminar configuración' }).isEnabled())
await pag.getByRole('button', { name: 'Terminar configuración' }).click()
await pag.waitForURL('**/bienvenida/listo')
check('el cierre dice que la clínica está lista y qué falta',
  await visible(pag.getByRole('heading', { name: 'Tu clínica está lista' })) &&
  await visible(pag.getByRole('link', { name: 'Completar' }).first()))
check('sólo entonces aparece el menú lateral',
  await visible(pag.getByRole('navigation', { name: 'Principal' })))
check('con el logo que subiste, no con uno de marca',
  await visible(pag.locator('aside img[alt="Clínica Dental Sonrisa"]')) && await pag.locator('aside img[alt*="Gabriel"]').count() === 0)
await pag.screenshot({ path: '/salida/onboarding-04-listo.png', fullPage: true })

await pag.goto(`${B}/inicio`, { waitUntil: 'networkidle' })
check('cerrada la guía, «Hoy» ya no redirige',
  pag.url().endsWith('/inicio') && await visible(pag.getByRole('heading', { name: 'Hoy' })))

check('sin errores de JavaScript', errores.length === 0, errores.slice(0, 3).join(' | '))

await nav.close()
console.log(`\n${fallos.length === 0 ? 'TODO OK' : `FALLOS: ${fallos.join(', ')}`}`)
process.exit(fallos.length === 0 ? 0 : 1)
