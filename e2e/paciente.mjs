/**
 * Alta, edición de paciente y ficha médica.
 *
 * No crea pacientes: el alta se prueba hasta la validación del servidor, y las
 * ediciones se deshacen. Los datos demo quedan como estaban, así que
 * `make verify` sigue pasando después —y eso comprueba además que guardar la
 * ficha no pierde nada de lo que el formulario no enseña.
 *
 *   npm run e2e paciente
 */
import { chromium } from 'playwright'

const B = process.env.BASE
const fallos = []
const errores = []
const nav = await chromium.launch()

function check(nombre, ok, detalle = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${nombre}${detalle ? ` — ${detalle}` : ''}`)
  if (!ok) fallos.push(nombre)
}

async function entrar(email) {
  const contexto = await nav.newContext({ viewport: { width: 1440, height: 1000 } })
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
  await pag.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Pacientes' }).click()
  await pag.waitForSelector('tbody tr', { timeout: 15000 })
  return pag
}

// --- Recepción: alta y búsqueda ---------------------------------------------
const recepcion = await entrar('recepcion@dentalsonrisa.do')
check('la lista muestra al doctor tratante como columna',
  (await recepcion.locator('tbody').innerText()).includes('Dr(a). Miguel Antonio Reyes Peralta'))

await recepcion.keyboard.press('F1')
const alta = recepcion.getByRole('dialog')
await alta.getByText('Nuevo paciente').waitFor({ timeout: 5000 })
check('F1 abre el alta de paciente', await alta.getByLabel('Nombres').isVisible())

await alta.getByRole('button', { name: 'Crear expediente' }).click()
check('sólo el nombre es obligatorio',
  await alta.getByText('Escribe el nombre').isVisible() &&
  await alta.getByText('Escribe los apellidos').isVisible() &&
  await alta.locator('[aria-invalid="true"]').count() === 2)

// Un documento de relleno lo rechaza el servidor, y el error cae en su campo.
await alta.getByLabel('Nombres').fill('Prueba')
await alta.getByLabel('Apellidos').fill('E2E')
await alta.getByText('Datos personales y de contacto').click()
await alta.getByLabel('Cédula o pasaporte').fill('00000000000')
await alta.getByRole('button', { name: 'Crear expediente' }).click()
await alta.getByText('parece un relleno').waitFor({ timeout: 8000 })
check('el error del servidor se pinta junto a su campo',
  await alta.getByLabel('Cédula o pasaporte').getAttribute('aria-invalid') === 'true')
await recepcion.screenshot({ path: '/salida/paciente-01-alta.png' })
await alta.getByRole('button', { name: 'Cancelar' }).click()
check('cancelar no crea nada', await recepcion.locator('tbody tr').count() === 4)

// Buscador global
await recepcion.keyboard.press('Control+k')
const buscador = recepcion.getByRole('dialog')
await buscador.getByRole('combobox').fill('809-777-0001')
// Sin esperar: lo que haya en la lista en este instante no puede ser de otra búsqueda.
const prematuras = await buscador.getByRole('option').allInnerTexts()
check('no enseña resultados de la búsqueda anterior',
  prematuras.every((t) => t.includes('Juan Carlos Peña Rosario')), prematuras.join(' | '))
await buscador.getByRole('option').first().waitFor({ timeout: 8000 })
check('el buscador encuentra por teléfono',
  (await buscador.getByRole('option').first().innerText()).includes('Juan Carlos Peña Rosario'))
await recepcion.keyboard.press('Enter')
await recepcion.waitForURL('**/pacientes/1', { timeout: 8000 })
check('Enter abre el expediente', true)
check('recepción no edita la ficha médica',
  await recepcion.getByRole('button', { name: 'Editar ficha' }).count() === 0)

// --- Doctor: edición de paciente y de ficha ---------------------------------
const doctor = await entrar('laura.fernandez@dentalsonrisa.do')
await doctor.goto(`${B}/pacientes/2?pestana=ficha`, { waitUntil: 'networkidle' })
await doctor.getByRole('heading', { level: 1 }).waitFor({ timeout: 15000 })
check('la pestaña de la URL se respeta al cargar',
  await doctor.getByRole('tab', { name: 'Ficha médica' }).getAttribute('aria-selected') === 'true')

async function editarOcupacion(valor) {
  await doctor.getByRole('button', { name: 'Editar paciente' }).click()
  const dialogo = doctor.getByRole('dialog')
  const campo = dialogo.getByLabel('Ocupación')
  const anterior = await campo.inputValue()
  await campo.fill(valor)
  await dialogo.getByRole('button', { name: 'Guardar cambios' }).click()
  await doctor.getByText('Paciente actualizado').first().waitFor({ timeout: 8000 })
  await dialogo.waitFor({ state: 'hidden', timeout: 8000 })
  return anterior
}
const ocupacion = await editarOcupacion('Probadora E2E')
check('la edición de paciente guarda', true)
await doctor.waitForTimeout(4200) // deja irse el aviso antes del siguiente
await editarOcupacion(ocupacion)

// Ficha: se añade una observación y se deshace
await doctor.getByText('Alergias y medicación').waitFor({ timeout: 15000 })
const fichaAntes = await doctor.locator('main').innerText()

async function editarObservaciones(transformar) {
  await doctor.getByRole('button', { name: 'Editar ficha' }).click()
  const dialogo = doctor.getByRole('dialog')
  const campo = dialogo.getByLabel('Observaciones')
  await campo.waitFor({ timeout: 8000 })
  await campo.fill(transformar(await campo.inputValue()))
  await dialogo.getByRole('button', { name: 'Guardar ficha' }).click()
  await dialogo.waitFor({ state: 'hidden', timeout: 8000 })
}
// Captura del formulario abierto, ya asentado.
await doctor.getByRole('button', { name: 'Editar ficha' }).click()
await doctor.getByRole('dialog').getByLabel('Observaciones').waitFor({ timeout: 8000 })
await doctor.waitForTimeout(500)
await doctor.screenshot({ path: '/salida/paciente-02-ficha.png' })
await doctor.getByRole('dialog').getByLabel('Medicamento', { exact: true }).scrollIntoViewIfNeeded()
await doctor.screenshot({ path: '/salida/paciente-03-ficha-medicacion.png' })
await doctor.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click()

const MARCA = ' · nota E2E'
await editarObservaciones((texto) => texto + MARCA)
await doctor.getByText('nota E2E').waitFor({ timeout: 8000 })
check('la ficha guarda y se repinta', true)
await editarObservaciones((texto) => texto.replace(MARCA, ''))
await doctor.getByText('nota E2E').waitFor({ state: 'detached', timeout: 8000 })
const fichaDespues = await doctor.locator('main').innerText()
check('guardar la ficha no pierde ni altera nada', fichaAntes === fichaDespues)

check('sin errores de JavaScript', errores.length === 0, errores.slice(0, 3).join(' | '))

await nav.close()
console.log(`\n${fallos.length === 0 ? 'TODO OK' : `FALLOS: ${fallos.join(', ')}`}`)
process.exit(fallos.length === 0 ? 0 : 1)
