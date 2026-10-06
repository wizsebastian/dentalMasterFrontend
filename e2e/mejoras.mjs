/**
 * Lo que salió de probar el flujo a mano: «Salir», búsqueda sin tildes,
 * teléfonos con formato, selects con buscador, ítems del plan, avisos con color,
 * alertas clínicas, odontograma con pincel y datos de la clínica en los impresos.
 *
 * **Escribe datos** (un paciente, ítems de un plan, hallazgos, la clínica y su
 * logo): después hay que recrear la base con `make reset`.
 *
 *   npm run e2e mejoras
 */
import { chromium } from 'playwright'

const B = process.env.BASE
const fallos = []
const errores = []
const nav = await chromium.launch()
const LUGAR = { timezoneId: 'America/Santo_Domingo', locale: 'es-DO' }
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

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

/** Un select con buscador: la caja que se ve es el botón hermano del nativo. */
async function elegir(pag, ambito, idSelect, texto) {
  await ambito.locator(`#${idSelect}`).locator('xpath=following-sibling::button').click()
  const buscar = pag.getByPlaceholder('Escribe para buscar…')
  await buscar.fill(texto)
  // Las <option> del select nativo también tienen rol «option»: sólo cuenta la lista abierta.
  await pag.locator('[role="listbox"]').getByRole('option', { name: new RegExp(texto, 'i') }).first().click()
}

// ============================================================ Recepción
const rec = await entrar('recepcion@dentalsonrisa.do')

// --- Búsqueda sin tildes
await rec.keyboard.press('Control+k')
const buscador = rec.getByRole('dialog')
await buscador.getByRole('combobox').fill('gomez')
await buscador.getByRole('option').first().waitFor({ timeout: 8000 })
const hallados = (await buscador.getByRole('option').allInnerTexts()).join(' | ')
check('«gomez» encuentra a Gómez', hallados.includes('Gómez'), hallados.replace(/\s+/g, ' '))
await buscador.getByRole('combobox').fill('7770002')
await buscador.getByRole('option').first().waitFor({ timeout: 8000 })
check('un teléfono se encuentra por sus dígitos',
  (await buscador.getByRole('option').first().innerText()).includes('María Altagracia'))
// El primer Esc vacía la caja de búsqueda; el segundo cierra el diálogo.
await rec.keyboard.press('Escape')
await rec.keyboard.press('Escape')
await buscador.waitFor({ state: 'hidden', timeout: 5000 })

// --- Teléfono con máscara y select con buscador, en el alta de paciente
await rec.keyboard.press('F1')
const alta = rec.getByRole('dialog')
await alta.getByLabel('Nombres').fill('Prueba')
await alta.getByLabel('Apellidos').fill('Mejoras')
await alta.getByLabel('Celular').pressSequentially('8095550142')
check('el celular lleva la máscara (000) 000-0000',
  await alta.getByLabel('Celular').inputValue() === '(809) 555-0142')
await alta.getByLabel('Celular').fill('')
await alta.getByLabel('Celular').pressSequentially('+1 829 555 0199')
check('pegar con +1 recorta a diez dígitos',
  await alta.getByLabel('Celular').inputValue() === '(829) 555-0199')

await elegir(rec, alta, 'campo-doctor-tratante', 'mig')
check('el select se filtra escribiendo y elige al doctor',
  (await alta.getByLabel('Doctor tratante').evaluate((el) => el.selectedOptions[0].textContent)).includes('Miguel'))
await rec.screenshot({ path: '/salida/mejoras-01-alta.png' })
await alta.getByRole('button', { name: 'Crear expediente' }).click()
await rec.waitForURL('**/pacientes/*', { timeout: 10000 })
check('guarda el teléfono con el formato',
  await visible(rec.getByText('(829) 555-0199').first()))

// --- Avisos con color: el choque de agenda es una advertencia
await rec.keyboard.press('F2')
const cita = rec.getByRole('dialog')
// F2 abre la cita en blanco: se busca al paciente (los select nativos también son
// «combobox», por eso se apunta a la caja de búsqueda de texto).
await cita.getByText('Nueva cita').waitFor({ timeout: 8000 })
await cita.locator('input[type="search"]').first().fill('Rafael')
await cita.getByRole('listbox').getByRole('option').first().click()
await elegir(rec, cita, 'campo-doctor', 'miguel')
const hoy = await rec.evaluate(() => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santo_Domingo' }))
await cita.getByLabel('Día').fill(hoy)
await cita.getByLabel('Hora').fill('11:15')
await cita.getByRole('button', { name: /Agendar|Guardar/ }).last().click()
await visible(cita.getByText(/ya tiene una cita/))
check('un choque de agenda sale como advertencia, con color',
  await visible(cita.locator('[role="alert"].border-aviso')))
await rec.screenshot({ path: '/salida/mejoras-02-choque.png' })
await cita.getByRole('button', { name: 'Cancelar' }).click()

// --- Salir
await rec.getByRole('button', { name: 'Salir' }).click()
check('«Salir» devuelve al login sin recargar',
  await visible(rec.getByLabel('Correo')) && await visible(rec.getByRole('button', { name: 'Entrar' })))
check('y borra la sesión del navegador',
  await rec.evaluate(() => localStorage.getItem('dentalmaster.sesion')) === null)

// ============================================================ Doctora
const doc = await entrar('laura.fernandez@dentalsonrisa.do')

// --- Alertas clínicas con color e icono
await doc.goto(`${B}/pacientes/1`, { waitUntil: 'networkidle' })
await visible(doc.getByText('alertas clínicas'))
check('las alertas graves van en rojo y con icono',
  await visible(doc.locator('[role="alert"].border-error')) &&
  await doc.locator('[role="alert"] svg').count() >= 3)
await doc.screenshot({ path: '/salida/mejoras-03-alertas.png' })

// --- Ítems del plan: lo que falta se dice antes de fallar
await doc.goto(`${B}/pacientes/2`, { waitUntil: 'networkidle' })
await doc.getByRole('button', { name: 'Nuevo plan' }).click()
const plan = doc.getByRole('dialog')
await elegir(doc, plan, 'campo-doctor', 'laura')
await plan.getByRole('button', { name: 'Abrir plan' }).click()
await doc.getByRole('link', { name: 'Plan y presupuesto' }).last().click()
await doc.waitForURL('**/planes/*', { timeout: 10000 })
await elegir(doc, doc.locator('main'), 'campo-servicio-a-cotizar', 'resina')
check('una resina sin pieza ni cara no deja añadir y dice por qué',
  await visible(doc.getByText(/pide pieza y al menos una cara/)) &&
  await doc.getByRole('button', { name: 'Añadir', exact: true }).isDisabled())
await doc.screenshot({ path: '/salida/mejoras-04-item.png', fullPage: true })
await doc.getByLabel('Pieza (FDI) *').fill('26')
await doc.getByLabel('Caras *').fill('o')
check('con pieza y cara el botón se habilita',
  await doc.getByRole('button', { name: 'Añadir', exact: true }).isEnabled())
await doc.getByRole('button', { name: 'Añadir', exact: true }).click()
check('el ítem queda en el plan y el total deja de ser 0',
  await visible(doc.getByText(/añadido al plan/)) &&
  (await doc.locator('main').innerText()).includes('RD$ 2,800.00'))

// --- Odontograma con pincel
await doc.goto(`${B}/pacientes/1?pestana=odontograma`, { waitUntil: 'networkidle' })
await doc.waitForSelector('svg[role="group"]', { timeout: 15000 })
check('sin condición elegida, la barra de pincel lo dice',
  await visible(doc.getByText('Elige una condición')))
await doc.getByRole('tab', { name: /Prótesis e implantes/ }).click()
await doc.getByRole('button', { name: 'Corona metal-porcelana', exact: true }).click()
check('la condición elegida se ve en la barra y relleno',
  await visible(doc.getByRole('status').filter({ hasText: 'Pincel: Corona metal-porcelana' })))
await doc.locator('svg[aria-label^="Pieza 17"] path, svg[aria-label^="Pieza 17"] rect').first().click({ force: true })
check('una condición de pieza completa se registra pulsando cualquier cara',
  await visible(doc.locator('tr', { hasText: 'Corona metal-porcelana' }).filter({ hasText: '17' })))
await doc.locator('svg[aria-label^="Pieza 17"] path, svg[aria-label^="Pieza 17"] rect').first().click({ force: true })
check('pulsar de nuevo lo quita',
  await visible(doc.getByText(/Quitado: Corona metal-porcelana/)))
await doc.screenshot({ path: '/salida/mejoras-05-pincel.png', fullPage: true })

await doc.getByRole('tab', { name: /Hallazgos/ }).click()
await doc.getByRole('button', { name: 'Caries', exact: true }).click()
await doc.getByRole('button', { name: '14', exact: true }).click()
check('una condición de cara pide la cara, no el número',
  await visible(doc.getByText(/va sobre una cara/)))
await doc.locator('svg[aria-label^="Pieza 14"] path, svg[aria-label^="Pieza 14"] rect').first().click({ force: true })
const filaCaries14 = doc.locator('tr:has(button[aria-label^="Quitar Caries de la pieza 14"])')
check('la tabla calcula la clase de Black y ofrece «Quitar»',
  await visible(filaCaries14) && /Clase [IV]+/.test(await filaCaries14.innerText()))
await doc.getByRole('button', { name: /^Quitar Caries de la pieza 14/ }).click()
check('«Quitar» borra el hallazgo de la tabla',
  await visible(doc.getByText(/Quitado: Caries · 14/)))

// ============================================================ Administración
const admin = await entrar('admin@dentalsonrisa.do')
await admin.goto(`${B}/configuracion`, { waitUntil: 'networkidle' })
check('Configuración abre en «Clínica»', await visible(admin.getByRole('heading', { name: 'Datos de la clínica' })))
await admin.getByLabel('Nombre de la clínica').fill('Clínica Sonrisa e2e')
await admin.getByLabel('WhatsApp').fill('')
await admin.getByLabel('WhatsApp').pressSequentially('8295550188')
await admin.getByRole('button', { name: 'Guardar datos' }).click()
check('los datos de la clínica se guardan', await visible(admin.getByText('Datos de la clínica guardados')))
await admin.locator('input[aria-label="Archivo del logo"]').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: PNG })
check('el logo se sube y sale en el menú',
  await visible(admin.locator('aside img[alt="Clínica Sonrisa e2e"]')))
await admin.screenshot({ path: '/salida/mejoras-06-clinica.png', fullPage: true })

await admin.goto(`${B}/pacientes/1/planes/1`, { waitUntil: 'networkidle' })
await admin.emulateMedia({ media: 'print' })
check('el presupuesto impreso lleva el nombre, el WhatsApp y el logo de la clínica',
  await visible(admin.locator('.solo-imprimir', { hasText: 'Clínica Sonrisa e2e' }).first()) &&
  (await admin.locator('.solo-imprimir').first().innerText()).includes('(829) 555-0188') &&
  await admin.locator('.solo-imprimir img').count() >= 1)
await admin.emulateMedia({ media: 'screen' })
await admin.goto(`${B}/informes`, { waitUntil: 'networkidle' })
await admin.emulateMedia({ media: 'print' })
check('el informe impreso usa el mismo membrete',
  await visible(admin.locator('.solo-imprimir', { hasText: 'Clínica Sonrisa e2e' }).first()))
await admin.emulateMedia({ media: 'screen' })

check('sin errores de JavaScript', errores.length === 0, errores.slice(0, 3).join(' | '))

await nav.close()
console.log(`\n${fallos.length === 0 ? 'TODO OK' : `FALLOS: ${fallos.join(', ')}`}`)
process.exit(fallos.length === 0 ? 0 : 1)
