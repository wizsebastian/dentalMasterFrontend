/**
 * Prueba de humo de la interfaz, de extremo a extremo.
 *
 * Recorre el camino real: login, listado, búsqueda, expediente, odontograma y
 * ficha. Es lo único que comprueba que la aplicación se *pinta*, no sólo que
 * compila.
 *
 * Necesita la API y el servidor de desarrollo levantados:
 *
 *   cd ../dentalMasterApi && make up
 *   npm run dev -- --host
 *   npm run e2e
 *
 * Corre en un contenedor de Playwright, así que no hace falta instalar
 * navegadores. BASE debe ser una IP alcanzable desde el contenedor: Vite
 * rechaza el Host "host.docker.internal" por su allowedHosts.
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE ?? 'http://host.docker.internal:5173'
const fallos = []
const errores = []

const navegador = await chromium.launch()
const contexto = await navegador.newContext({ viewport: { width: 1440, height: 960 } })
const pagina = await contexto.newPage()

pagina.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()) })
pagina.on('pageerror', (e) => errores.push(`pageerror: ${e.message}`))
const respuestasFallidas = []
pagina.on('response', (r) => { // Un 304 es el navegador revalidando un módulo, no un fallo: sólo cuentan los 4xx y 5xx.
  if (r.status() >= 400) respuestasFallidas.push(`${r.status()} ${new URL(r.url()).pathname}`) })

function check(nombre, condicion, detalle = '') {
  console.log(`${condicion ? 'PASS' : 'FAIL'}  ${nombre}${detalle ? ` — ${detalle}` : ''}`)
  if (!condicion) fallos.push(nombre)
}

// 1. Login
await pagina.goto(BASE, { waitUntil: 'networkidle' })
check('la pantalla de login carga', await pagina.getByText('Entra a la clínica').isVisible())
await pagina.screenshot({ path: '/salida/01-login.png' })

// 2. Credenciales incorrectas
await pagina.getByLabel('Correo').fill('laura.fernandez@dentalsonrisa.do')
await pagina.getByLabel('Contraseña').fill('incorrecta')
await pagina.getByRole('button', { name: 'Entrar' }).click()
await pagina.waitForSelector('[role="alert"]', { timeout: 5000 })
check('rechaza credenciales incorrectas', (await pagina.getByRole('alert').innerText()).includes('incorrectos'))

// 3. Login correcto
await pagina.getByLabel('Contraseña').fill('dental2026')
await pagina.getByRole('button', { name: 'Entrar' }).click()
await pagina.waitForURL('**/inicio', { timeout: 10000 })
await pagina.waitForLoadState('networkidle')
check('entra y llega al tablero del día',
  await pagina.getByRole('heading', { name: 'Hoy', exact: true }).waitFor({ timeout: 8000 }).then(() => true, () => false))
await pagina.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Pacientes' }).click()
await pagina.waitForSelector('tbody tr', { timeout: 15000 })
check('llega al listado de pacientes', pagina.url().endsWith('/pacientes'))
check('el marco muestra al doctor', await pagina.getByText('Laura Fernández Cruz', { exact: true }).isVisible())
await pagina.screenshot({ path: '/salida/02-pacientes.png' })

// 4. Listado con los 4 pacientes del seed
const filas = await pagina.locator('tbody tr').count()
check('lista los pacientes del seed', filas === 4, `${filas} filas`)

// 5. Búsqueda
await pagina.getByLabel('Buscar pacientes').fill('Peña')
await pagina.waitForTimeout(900)
const filtradas = await pagina.locator('tbody tr').count()
check('la búsqueda filtra', filtradas === 1, `${filtradas} fila(s)`)
await pagina.getByLabel('Buscar pacientes').fill('')
await pagina.waitForTimeout(700)

// 6. Expediente + odontograma
// Con el filtro vaciado, la lista vuelve a las cuatro filas: se espera antes de pulsar.
await pagina.locator('tbody tr').nth(3).waitFor({ timeout: 8000 })
await pagina.getByRole('link', { name: 'PAC-2026-0001' }).click()
await pagina.waitForLoadState('networkidle')
const titulo = await pagina.getByRole('heading', { level: 1 }).innerText()
check('abre el expediente', titulo.includes('Juan Carlos Peña Rosario'), titulo)

const alerta = await pagina.getByRole('alert').innerText()
check('muestra el banner de alertas', alerta.includes('Penicilina'), alerta.split('\n')[0])

// El expediente abre en el historial: el odontograma está en su pestaña.
check('el expediente abre en el historial',
  await pagina.getByText('PT-2026-0001').first().waitFor({ timeout: 8000 }).then(() => true, () => false))
await pagina.getByRole('tab', { name: 'Odontograma' }).click()
// networkidle no basta en una SPA: hay que esperar a que React pinte.
await pagina.waitForSelector('svg[role="group"]', { timeout: 15000 })
const dientes = await pagina.locator('svg[role="group"]').count()
check('dibuja las 32 piezas permanentes', dientes === 32, `${dientes} piezas`)

await pagina.waitForSelector('table tbody tr', { timeout: 15000 })
const hallazgos = await pagina.locator('table tbody tr').count()
check('lista los 11 hallazgos del seed', hallazgos === 11, `${hallazgos} hallazgos`)

// El color debe venir del catálogo, no estar escrito a mano
const html = await pagina.content()
check('pinta la caries con el color del catálogo', html.includes('#E53935'))
await pagina.screenshot({ path: '/salida/03-odontograma.png', fullPage: true })

// 7. Ficha médica
await pagina.getByRole('tab', { name: 'Ficha médica' }).click()
await pagina.waitForLoadState('networkidle')
await pagina.waitForSelector('text=Alergias y medicación', { timeout: 15000 })
check('la ficha muestra la alergia', await pagina.getByText('Penicilina').first().isVisible())
check('la ficha muestra la condición', await pagina.getByText('Diabetes mellitus').first().isVisible())
await pagina.screenshot({ path: '/salida/04-ficha.png', fullPage: true })

const inesperadas = respuestasFallidas.filter((r) => r !== '401 /api/v1/auth/login')
check('el único fallo HTTP es el login deliberado', inesperadas.length === 0, respuestasFallidas.join(' | '))
const erroresReales = errores.filter((e) => !e.includes('401'))
check('sin errores de JavaScript', erroresReales.length === 0, erroresReales.slice(0, 3).join(' | '))

await navegador.close()
console.log(`\n${fallos.length === 0 ? 'TODO OK' : `FALLOS: ${fallos.join(', ')}`}`)
process.exit(fallos.length === 0 ? 0 : 1)
