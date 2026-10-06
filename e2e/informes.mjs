/**
 * El reporte de cada doctor: desde Informes para quien lleva las cuentas, y
 * «Mi producción» para el propio doctor. Sólo lee: no hace falta `make reset`.
 *
 *   npm run e2e informes
 */
import { chromium } from 'playwright'

const B = process.env.BASE
const fallos = []
const errores = []
const nav = await chromium.launch()
const LUGAR = { timezoneId: 'America/Santo_Domingo', locale: 'es-DO' }

function check(nombre, ok, detalle = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${nombre}${detalle ? ` — ${detalle}` : ''}`)
  if (!ok) fallos.push(nombre)
}
const visible = (loc, ms = 15000) => loc.waitFor({ timeout: ms }).then(() => true, () => false)

async function entrar(email) {
  const contexto = await nav.newContext({ viewport: { width: 1440, height: 1000 }, ...LUGAR })
  const pag = await contexto.newPage()
  pag.on('pageerror', (e) => errores.push(`pageerror: ${e.message}`))
  pag.on('console', (m) => {
    if (m.type() === 'error' && !/40[0-9]|422/.test(m.text())) errores.push(m.text())
  })
  await pag.goto(B, { waitUntil: 'networkidle' })
  await pag.getByLabel('Correo').fill(email)
  await pag.getByLabel('Contraseña').fill('dental2026')
  await pag.getByRole('button', { name: 'Entrar' }).click()
  await pag.waitForURL('**/inicio', { timeout: 10000 })
  return pag
}
const menu = (pag, nombre) =>
  pag.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: nombre, exact: true })

async function abril(pag) {
  await pag.getByLabel('Desde').fill('2026-04-01')
  await pag.getByLabel('Hasta').fill('2026-04-30')
}

// ============================================================ Administración
const admin = await entrar('admin@dentalsonrisa.do')
await menu(admin, 'Informes').click()
await visible(admin.getByRole('heading', { name: 'Por doctor' }))
await abril(admin)

// Del resumen de la clínica al reporte del doctor, con el mismo tramo.
await admin.getByRole('button', { name: 'Dr(a). Miguel Antonio Reyes Peralta' }).click()
await visible(admin.getByRole('heading', { name: 'Qué hizo' }))
const reporte = await admin.locator('main').innerText()
check('el nombre del doctor en el resumen abre su reporte',
  new URL(admin.url()).searchParams.get('doctor') === '2')
check('abril del implante: producción, cobrado y comisión sobre lo cobrado',
  ['RD$ 48,925.00', 'RD$ 25,000.00', 'RD$ 11,250.00', 'Comisión · 45 %'].every((t) => reporte.includes(t)),
  reporte.replace(/\s+/g, ' ').slice(0, 220))
check('desglosa qué hizo, lo cobrado, los pagos y el detalle',
  ['Qué hizo', 'Lo cobrado por sus consultas', 'Pagos al doctor', 'Detalle de lo ejecutado']
    .every((t) => reporte.includes(t)) && reporte.includes('Implante dental unitario'))
await admin.screenshot({ path: '/salida/informes-01-doctor.png', fullPage: true })

await admin.getByRole('button', { name: 'Este año' }).click()
check('los atajos de tramo cambian el periodo',
  await visible(admin.getByRole('button', { name: 'Este año', pressed: true })))

await admin.locator('main select').selectOption({ label: 'Dr(a). Laura Fernández Cruz' })
check('se cambia de doctor sin salir de la pantalla',
  await visible(admin.locator('main p.text-lg').filter({ hasText: 'Laura Fernández Cruz' })) &&
  new URL(admin.url()).searchParams.get('doctor') === '1')

await admin.emulateMedia({ media: 'print' })
check('impreso es una hoja de liquidación, con sus firmas',
  await visible(admin.getByText('Reporte de producción y liquidación')) &&
  await visible(admin.getByText('Por la clínica')))
await admin.emulateMedia({ media: 'screen' })

// ============================================================ Doctor
const doc = await entrar('miguel.reyes@dentalsonrisa.do')
check('el doctor no ve los informes de la clínica', await menu(doc, 'Informes').count() === 0)
await menu(doc, 'Mi producción').click()
await visible(doc.getByRole('heading', { name: 'Mi producción' }))
await abril(doc)
await visible(doc.getByText('RD$ 48,925.00').first())
const mio = await doc.locator('main').innerText()
check('ve su propio reporte', mio.includes('Miguel Antonio Reyes Peralta') && mio.includes('RD$ 11,250.00'))
await doc.screenshot({ path: '/salida/informes-02-mi-produccion.png', fullPage: true })

const ajeno = await doc.evaluate(async () => {
  const { access_token } = JSON.parse(localStorage.getItem('dentalmaster.sesion') ?? '{}')
  const r = await fetch('/api/v1/informes/doctores/1', { headers: { Authorization: `Bearer ${access_token}` } })
  return r.status
})
check('y la API le niega el de un colega', ajeno === 403, `HTTP ${ajeno}`)

// ============================================================ Recepción
const rec = await entrar('recepcion@dentalsonrisa.do')
check('recepción no tiene «Mi producción»', await menu(rec, 'Mi producción').count() === 0)

check('sin errores de JavaScript', errores.length === 0, errores.slice(0, 3).join(' | '))

await nav.close()
console.log(`\n${fallos.length === 0 ? 'TODO OK' : `FALLOS: ${fallos.join(', ')}`}`)
process.exit(fallos.length === 0 ? 0 : 1)
