/**
 * Los dos bancos de pruebas, alcanzables desde el login y con vuelta.
 *
 * Se ejecuta igual que la prueba de humo: `node e2e/ejecutar.mjs botones`.
 */
import { chromium } from 'playwright'
const B = process.env.BASE
const fallos = []
const nav = await chromium.launch()
const pag = await (await nav.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 })).newPage()
const errs = []
pag.on('pageerror', e => errs.push(e.message))
const check = (n, ok, d='') => { console.log(`${ok?'PASS':'FAIL'}  ${n}${d?` — ${d}`:''}`); if(!ok) fallos.push(n) }

await pag.goto(B, { waitUntil: 'domcontentloaded' }); await pag.waitForTimeout(1800)
check('el login ofrece los dos accesos', await pag.getByRole('link', { name: /En arcada/ }).isVisible()
  && await pag.getByRole('link', { name: /Con librería/ }).isVisible())
await pag.screenshot({ path: '/salida/botones-login.png' })

// Arcada: ir y volver
await pag.getByRole('link', { name: /En arcada/ }).click()
await pag.waitForTimeout(1800)
check('abre la arcada', pag.url().endsWith('/odontogram'))
check('la arcada tiene botón volver', await pag.getByRole('link', { name: 'Volver' }).isVisible())
await pag.getByRole('link', { name: 'Volver' }).click(); await pag.waitForTimeout(1200)
check('vuelve al login desde la arcada', await pag.getByText('Entra a la clínica').isVisible(), pag.url())

// Librería: ir y volver
await pag.getByRole('link', { name: /Con librería/ }).click()
await pag.waitForTimeout(7000)
check('abre la de librería', pag.url().endsWith('/odontogram-especial'))
check('la de librería tiene botón volver', await pag.getByRole('link', { name: 'Volver' }).isVisible())
await pag.screenshot({ path: '/salida/botones-especial.png' })
await pag.getByRole('link', { name: 'Volver' }).click(); await pag.waitForTimeout(1500)
check('vuelve al login desde la librería', await pag.getByText('Entra a la clínica').isVisible(), pag.url())

check('sin errores de JavaScript', errs.length === 0, errs.slice(0,2).join(' | '))
await nav.close()
console.log(`\n${fallos.length ? 'FALLOS: ' + fallos.join(', ') : 'TODO OK'}`)
