/**
 * El menú contextual de notaciones sobre el lienzo de la librería.
 *
 * Comprueba que no queda rastro de la interfaz de la librería, que el menú sale
 * junto a la selección sin taparla, que la multiselección funciona por las tres
 * vías, y que lo aplicado va a las piezas correctas.
 *
 *   node e2e/ejecutar.mjs notaciones
 */
import { chromium } from 'playwright'
const B = process.env.BASE
const fallos = []
const nav = await chromium.launch()
const pag = await (await nav.newContext({ viewport: { width: 1440, height: 1200 } })).newPage()
const errs = []
pag.on('pageerror', e => errs.push(e.message))
pag.on('console', m => { if (m.type()==='error') errs.push(m.text()) })
const check = (n, ok, d='') => { console.log(`${ok?'PASS':'FAIL'}  ${n}${d?` — ${d}`:''}`); if(!ok) fallos.push(n) }
const pieza = n => pag.locator(`.tooth-tile[role="option"][data-tooth="${n}"]`)
const menu = pag.locator('[role="dialog"][aria-label="Notaciones para la selección"]')

await pag.goto(`${B}/odontogram-especial`, { waitUntil: 'domcontentloaded' })
await pag.waitForSelector('.tooth-tile', { timeout: 25000 })
await pag.waitForTimeout(1200)

const texto = await pag.locator('body').innerText()
check('sin la marca de la librería', !texto.includes('React Advanced Odontogram'))
check('sin enlace a GitHub', await pag.locator('a[href*="github"]').count() === 0)
check('sin el panel de opciones', !texto.includes('Detalles del diente') && !texto.includes('Estado periodontal'))
check('el menú no aparece sin selección', await menu.count() === 0)

await pieza(16).click({ force: true }); await pag.waitForTimeout(700)
check('al seleccionar aparece el menú', await menu.isVisible())

// boundingBox() da {x,y,width,height}: no hay .bottom
const cajaMenu = await menu.boundingBox(), cajaPieza = await pieza(16).boundingBox()
const dx = Math.min(Math.abs(cajaMenu.x - (cajaPieza.x + cajaPieza.width)), Math.abs(cajaPieza.x - (cajaMenu.x + cajaMenu.width)))
const dy = Math.abs((cajaMenu.y + cajaMenu.height / 2) - (cajaPieza.y + cajaPieza.height / 2))
check('el menú sale junto a la pieza', dx < 900 && dy < 500, `dx=${Math.round(dx)} dy=${Math.round(dy)}`)

// No debe taparla: fue el primer intento y hacía inservible el lienzo
const solapa = !(cajaMenu.x > cajaPieza.x + cajaPieza.width || cajaMenu.x + cajaMenu.width < cajaPieza.x)
check('el menú no tapa la pieza seleccionada', !solapa, solapa ? 'la cubre' : 'queda al lado')
check('el menú indica la pieza', (await menu.innerText()).includes('16'))

await pieza(17).click({ force: true, modifiers: ['Meta'] }); await pag.waitForTimeout(700)
let fichas = await menu.locator('button[aria-label^="Quitar la pieza"]').count()
check('CMD+clic suma una pieza', fichas === 2, `${fichas} fichas`)

await menu.getByRole('button', { name: 'Añadir' }).click(); await pag.waitForTimeout(300)
await pieza(26).click({ force: true }); await pag.waitForTimeout(700)
fichas = await menu.locator('button[aria-label^="Quitar la pieza"]').count()
check('el botón Añadir suma sin CMD', fichas === 3, `${fichas} fichas`)

await menu.locator('button[aria-label="Quitar la pieza 17"]').click(); await pag.waitForTimeout(700)
const quedan = await menu.locator('button[aria-label^="Quitar la pieza"]').count()
check('la ficha con aspa quita sólo esa pieza', quedan === 2, `${quedan} fichas`)

// Aplicar caries en oclusal a las dos que quedan
await menu.getByRole('button', { name: 'O', exact: true }).click()
await menu.getByRole('button', { name: 'Caries', exact: true }).click()
await pag.waitForTimeout(900)

// El aviso dice sobre qué actuó: es la prueba de que aplicó a la selección exacta
const aviso = await pag.locator('[role="status"]').innerText()
check('aplica a las piezas seleccionadas', aviso.includes('2 piezas') && aviso.includes('cara O'), aviso)
check('no aplica a la pieza quitada', !aviso.includes('3 piezas'), aviso)
// Plegadas para no robar sitio, pero anunciadas: si faltan, que se vea
check('anuncia las notaciones pendientes', (await menu.innerText()).includes('7 notaciones'))
await menu.locator('summary').click(); await pag.waitForTimeout(300)
check('al desplegarlas se listan', (await menu.innerText()).includes('Supernumerario'))
check('sin errores de JavaScript', errs.length === 0, errs.slice(0,2).join(' | '))

// Con la pieza a la derecha el menú debe voltear al otro lado
await pag.reload({ waitUntil: 'domcontentloaded' })
await pag.waitForSelector('.tooth-tile', { timeout: 25000 }); await pag.waitForTimeout(1200)
await pieza(28).click({ force: true }); await pag.waitForTimeout(700)
const m28 = await menu.boundingBox(), p28 = await pieza(28).boundingBox()
check('con la pieza a la derecha, el menú voltea a la izquierda', m28.x + m28.width <= p28.x + 4,
  `menú termina en ${Math.round(m28.x + m28.width)} · pieza empieza en ${Math.round(p28.x)}`)
await pag.screenshot({ path: '/salida/notaciones-derecha.png', fullPage: true })
await nav.close()
console.log(`\n${fallos.length ? 'FALLOS: ' + fallos.join(', ') : 'TODO OK'}`)
