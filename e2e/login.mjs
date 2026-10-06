/**
 * El login: validación de los campos antes de llamar al servidor, mensaje de
 * credenciales erróneas, mostrar la contraseña y la versión de móvil.
 * No necesita datos: sólo lee. `node e2e/ejecutar.mjs login`.
 */
import { chromium } from 'playwright'
const B = process.env.BASE
const fallos = []
const nav = await chromium.launch()
const ctx = await nav.newContext({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 2 })
const pag = await ctx.newPage()
const errs = []
pag.on('pageerror', e => errs.push(e.message))
const check = (n, ok, d='') => { console.log(`${ok?'PASS':'FAIL'}  ${n}${d?` — ${d}`:''}`); if(!ok) fallos.push(n) }
const visible = async l => l.first().isVisible().catch(() => false)

let llamadas = 0
pag.on('request', r => { if (r.url().includes('/auth/login')) llamadas++ })

await pag.goto(B, { waitUntil: 'networkidle' })
check('hay panel de marca con el logo y el lema', await visible(pag.getByRole('heading', { name: 'Tu clínica, en orden.' })) &&
  await pag.locator('img[alt="DentalMaster"]').count() >= 1)
await pag.screenshot({ path: '/salida/login-01-ancho.png' })

// Vacío: no llega al servidor y dice qué falta en cada campo
await pag.getByRole('button', { name: 'Entrar' }).click()
check('correo vacío: lo pide', await visible(pag.getByText('Escribe tu correo')))
check('contraseña vacía: la pide', await visible(pag.getByText('Escribe tu contraseña')))
check('con campos vacíos no se llama al servidor', llamadas === 0)

// Formato de correo
await pag.getByLabel('Correo').fill('alguien@')
await pag.getByLabel('Contraseña').fill('x')
await pag.getByRole('button', { name: 'Entrar' }).click()
check('un correo mal formado se explica', await visible(pag.getByText(/no parece válido/)))
check('sigue sin llamar al servidor', llamadas === 0)
await pag.screenshot({ path: '/salida/login-02-validacion.png' })

// Corregir quita el error
await pag.getByLabel('Correo').fill('admin@dentalsonrisa.do')
check('al corregir, el error del correo desaparece', !(await visible(pag.getByText(/no parece válido/))))

// Mostrar la contraseña
const clave = pag.getByLabel('Contraseña')
check('la contraseña va oculta', await clave.getAttribute('type') === 'password')
await pag.getByRole('button', { name: 'Mostrar' }).click()
check('«Mostrar» la enseña', await clave.getAttribute('type') === 'text')
await pag.getByRole('button', { name: 'Ocultar' }).click()
check('y «Ocultar» la vuelve a esconder', await clave.getAttribute('type') === 'password')

// Credenciales erróneas: respuesta del servidor
await clave.fill('una-clave-equivocada')
await pag.getByRole('button', { name: 'Entrar' }).click()
await pag.waitForTimeout(1500)
check('con datos válidos sí se pregunta al servidor', llamadas === 1, `${llamadas}`)
check('credenciales erróneas: aviso de error visible', await visible(pag.locator('[role="alert"], .border-error').filter({ hasText: /./ })))
check('y el foco vuelve a la contraseña', await clave.evaluate(e => e === document.activeElement))
await pag.screenshot({ path: '/salida/login-03-error.png' })

// Móvil: sin panel, con logo
await pag.setViewportSize({ width: 390, height: 800 })
await pag.waitForTimeout(300)
check('en móvil no hay panel de marca', !(await visible(pag.getByRole('heading', { name: 'Tu clínica, en orden.' }))))
check('en móvil el logo y el formulario siguen', await visible(pag.locator('img[alt="DentalMaster"]:visible')) &&
  await visible(pag.getByRole('button', { name: 'Entrar' })))
check('sin desborde horizontal', await pag.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
await pag.screenshot({ path: '/salida/login-04-movil.png' })

check('sin errores de JavaScript', errs.length === 0, errs.slice(0,2).join(' | '))
await nav.close()
console.log(`\n${fallos.length ? 'FALLOS: ' + fallos.join(', ') : 'TODO OK'}`)
process.exit(fallos.length ? 1 : 0)
