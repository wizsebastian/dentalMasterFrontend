/**
 * La guía interactiva (/guia): pública, sin sesión. Abre una guía, marca un paso,
 * escribe un comentario y comprueba que se guardó en la API y que sobrevive a
 * recargar y a abrirla en otro navegador por su enlace. Sólo crea una sesión de
 * guía (no toca datos clínicos). `node e2e/ejecutar.mjs guia`.
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

// Portada, sin sesión
await pag.goto(`${B}/guia`, { waitUntil: 'networkidle' })
check('la portada saluda sin pedir login', await visible(pag.getByRole('heading', { name: /le entrego DentalMaster/ })))
check('«Empezar» está deshabilitado sin nombre', await pag.getByRole('button', { name: 'Empezar la guía' }).isDisabled())
await pag.screenshot({ path: '/salida/guia-01-portada.png', fullPage: true })

await pag.getByLabel('Su nombre').fill('Dr. Prueba E2E')
await pag.getByRole('button', { name: 'Empezar la guía' }).click()
await pag.waitForURL(/\/guia\/[\w-]+$/)
const url = pag.url()
const codigo = url.split('/').pop()
check('abre /guia/:codigo', Boolean(codigo))
await pag.getByText(/de \d+ pasos/).waitFor({ timeout: 8000 })
check('muestra el progreso 0 de N', await visible(pag.getByText(/de \d+ pasos/)))

// Marcar un paso y escribir un comentario
const paso = pag.locator('#paso-doc-3')
await paso.getByRole('button', { name: 'Duda / mejorar' }).click()
await paso.getByLabel('Su comentario o duda').fill('No entendí el pincel de caras')
await pag.getByText('Todo guardado').waitFor({ timeout: 8000 })
check('el paso queda marcado como duda', await paso.getByRole('button', { name: 'Duda / mejorar' }).getAttribute('aria-pressed') === 'true')

await pag.getByLabel('Impresión general', { exact: true }).fill('Muy claro hasta ahora')
await pag.getByText('Todo guardado').waitFor({ timeout: 8000 })
await pag.screenshot({ path: '/salida/guia-02-marcado.png' })

// Recargar: vuelve con lo guardado
await pag.reload({ waitUntil: 'networkidle' })
const paso2 = pag.locator('#paso-doc-3')
check('tras recargar, sigue marcado', await paso2.getByRole('button', { name: 'Duda / mejorar' }).getAttribute('aria-pressed') === 'true')
check('y con su comentario', (await paso2.getByLabel('Su comentario o duda').inputValue()) === 'No entendí el pincel de caras')

// /guia sin código retoma la sesión de este equipo
await pag.goto(`${B}/guia`, { waitUntil: 'networkidle' })
await pag.waitForURL(/\/guia\/[\w-]+$/)
check('/guia retoma la sesión de este equipo', pag.url() === url)

// Otro navegador, por el enlace
const ctx2 = await nav.newContext({ viewport: { width: 390, height: 800 } })
const otro = await ctx2.newPage()
await otro.goto(url, { waitUntil: 'networkidle' })
check('desde otro navegador se ve lo guardado (móvil)', await otro.locator('#paso-doc-3').getByRole('button', { name: 'Duda / mejorar' }).getAttribute('aria-pressed') === 'true')
const ancho = await otro.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
check('en móvil no hay scroll horizontal', ancho)
await otro.screenshot({ path: '/salida/guia-03-movil.png' })

// Filtro
await pag.getByRole('button', { name: 'Fallas y dudas' }).click()
check('el filtro «Fallas y dudas» deja sólo el paso marcado', (await pag.locator('article').count()) === 1)

// Código inexistente
await pag.goto(`${B}/guia/no-existe-xyz`, { waitUntil: 'networkidle' })
check('un código inventado avisa que no existe', await visible(pag.getByText('Esa guía no existe')))

// La API sin sesión no deja leer el análisis
const r = await pag.request.get(`${B}/api/v1/guia/exportar`)
check('el análisis exige administración (401)', r.status() === 401, String(r.status()))

check('sin errores de página', errs.length === 0, errs.join(' | '))
await nav.close()
if (fallos.length) { console.log(`\n${fallos.length} fallo(s)`); process.exit(1) }
console.log('\nTodo bien')
