/**
 * El loading de los dos bancos de pruebas del odontograma.
 *
 * Comprueba que releva las cuatro versiones cromáticas del isotipo y ninguna
 * monocroma. Retiene el chunk de cada vista para que el fallback de Suspense se
 * quede en pantalla.
 *
 *   node e2e/ejecutar.mjs loaders
 */
import { chromium } from 'playwright'
const B = process.env.BASE
const fallos = []
const nav = await chromium.launch()
const check = (n, ok, d='') => { console.log(`${ok?'PASS':'FAIL'}  ${n}${d?` — ${d}`:''}`); if(!ok) fallos.push(n) }

for (const [ruta, chunk, texto] of [
  ['/odontogram', '**/PruebaOdontograma*', 'el odontograma en arcada'],
  ['/odontogram-especial', '**/OdontogramaEspecial*', 'el odontograma con librería'],
]) {
  const pag = await (await nav.newContext({ viewport: { width: 900, height: 700 } })).newPage()
  await pag.route(chunk, () => new Promise(() => {}))
  await pag.goto(`${B}${ruta}`, { waitUntil: 'domcontentloaded' })
  await pag.waitForSelector('[role="status"]', { timeout: 15000 })

  const imgs = await pag.locator('[role="status"] img').evaluateAll(
    els => els.map(e => new URL(e.src).pathname))
  check(`${ruta}: muestra el loader`, imgs.length > 0)
  check(`${ruta}: usa las 4 cromáticas`,
    imgs.length === 4 && imgs.every(p => /isotipo-[abcd]\.png$/.test(p)), imgs.join(' '))
  check(`${ruta}: sin versión monocroma`,
    !imgs.some(p => /positivo|negativo/.test(p)))
  const t = (await pag.locator('[role="status"]').first().locator('..').innerText()).trim()
  check(`${ruta}: dice qué espera`, t.includes(texto), t.split('\n')[0])
  await pag.context().close()
}
await nav.close()
console.log(`\n${fallos.length ? 'FALLOS: ' + fallos.join(', ') : 'TODO OK'}`)
