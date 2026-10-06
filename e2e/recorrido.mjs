/**
 * Recorrido por las pantallas de trabajo: tablero del día, agenda, historial,
 * cobro y recibo, documentos y firma, caja, gastos, inventario e informes.
 *
 * **Escribe datos** (citas, una consulta, un pago, un documento firmado, un
 * gasto): después hay que recrear la base con `make reset` en la API.
 *
 *   npm run e2e recorrido
 */
import { chromium } from 'playwright'

const B = process.env.BASE
const fallos = []
const errores = []
const nav = await chromium.launch()
// El contenedor corre en UTC: sin esto, «las 11:15» serían las 7:15 de la clínica.
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

// ============================================================ Doctor
const doc = await entrar('laura.fernandez@dentalsonrisa.do')

// --- Hoy
await visible(doc.getByRole('heading', { name: 'Por llegar' }))
await visible(doc.getByRole('button', { name: /^(Confirmar|Llegó)$/ }).first())
const tablero = await doc.locator('main').innerText()
check('el tablero del día tiene sus tres columnas',
  ['Por llegar', 'En sala', 'Atendidos'].every((t) => tablero.includes(t)))
check('enseña las citas de hoy del seed', /\d+ citas?/.test(tablero) && /Confirmar|Llegó/.test(tablero), tablero.replace(/\s+/g, ' ').slice(0, 200))
await doc.screenshot({ path: '/salida/recorrido-01-hoy.png', fullPage: true })
// Con el seed recién cargado hay una cita confirmada: «Llegó» la pasa a la sala.
const enSalaAntes = await doc.getByText('En sala', { exact: true }).count()
await doc.getByRole('button', { name: 'Llegó' }).first().click()
await doc.waitForTimeout(1500)
check('una tarjeta avanza con un clic', await doc.getByText('En sala', { exact: true }).count() > enSalaAntes)

// --- Agenda
await menu(doc, 'Agenda').click()
await visible(doc.getByRole('heading', { name: 'Agenda' }))
await doc.waitForTimeout(1200)
const bloques = await doc.locator('main button[title*="·"]').count()
check('la semana dibuja las citas como bloques', bloques >= 5, `${bloques} bloques`)
await doc.screenshot({ path: '/salida/recorrido-02-agenda-semana.png', fullPage: true })
await doc.getByRole('group', { name: 'Vista' }).getByRole('button', { name: 'Día' }).click()
await doc.waitForTimeout(800)
check('la vista de día tiene una columna por doctor',
  (await doc.locator('main').innerText()).includes('Dr(a). Miguel Antonio Reyes Peralta'))
await doc.screenshot({ path: '/salida/recorrido-03-agenda-dia.png', fullPage: true })
await doc.getByRole('group', { name: 'Vista' }).getByRole('button', { name: 'Lista' }).click()
await doc.waitForSelector('tbody tr', { timeout: 8000 })
await doc.waitForTimeout(1500) // la lista pide cuatro semanas: llega después de la del día
check('la lista trae las citas con su estado', await doc.locator('tbody tr').count() >= 6, `${await doc.locator('tbody tr').count()} filas`)

// Nueva cita con F2, sobre un hueco ocupado: choca y ofrece el sobrecupo
await doc.keyboard.press('F2')
const cita = doc.getByRole('dialog')
await visible(cita.getByText('Nueva cita'))
await cita.getByRole('combobox', { name: 'Buscar paciente' }).fill('Gómez')
await cita.getByRole('listbox', { name: 'Buscar paciente' }).getByRole('option').first().click()
await cita.getByLabel('Hora').fill('11:15')
await cita.getByLabel('Doctor').selectOption({ label: 'Dr(a). Miguel Antonio Reyes Peralta' })
await cita.getByRole('button', { name: 'Agendar cita' }).click()
check('un hueco ocupado dice con quién choca',
  await visible(cita.getByText(/ya tiene una cita de/)), (await cita.getByRole('alert').innerText().catch(() => '')).slice(0, 110))
await doc.screenshot({ path: '/salida/recorrido-04-cita-choque.png' })
await cita.getByLabel('Agendar como sobrecupo').check()
await cita.getByLabel('Motivo del sobrecupo').fill('Urgencia')
await cita.getByRole('button', { name: 'Agendar cita' }).click()
check('el sobrecupo agenda de todos modos', await visible(doc.getByText('Cita agendada')))

// --- Expediente: historial, consulta y cobro
await doc.goto(`${B}/pacientes/2`, { waitUntil: 'networkidle' })
await visible(doc.getByRole('button', { name: 'Nueva consulta' }))
await doc.getByRole('button', { name: 'Nueva consulta' }).click()
const consulta = doc.getByRole('dialog')
await consulta.getByLabel('Servicio de la línea 1').selectOption({ label: 'Resina · 1 superficie' })
await consulta.getByLabel('Pieza de la línea 1').fill('26')
await consulta.getByLabel('Caras de la línea 1').fill('O')
check('elegir el servicio trae su precio de la tarifa',
  await consulta.getByLabel('Precio de la línea 1').inputValue() === '2800.00')
await doc.screenshot({ path: '/salida/recorrido-05-consulta.png' })
await consulta.getByRole('button', { name: 'Registrar consulta' }).click()
check('la consulta queda en el historial con su saldo',
  await visible(doc.getByText('Pendiente RD$ 2,800.00')))
await doc.screenshot({ path: '/salida/recorrido-06-historial.png', fullPage: true })

await doc.getByRole('tab', { name: 'Odontograma' }).click()
await doc.waitForSelector('svg[role="group"]', { timeout: 15000 })
check('la línea ejecutada pintó el odontograma', (await doc.content()).includes('#1E88E5'))

await doc.getByRole('tab', { name: 'Historial' }).click()
await doc.getByRole('button', { name: 'Cobrar', exact: true }).first().click()
const pago = doc.getByRole('dialog')
check('cobrar propone el saldo de la consulta',
  await pago.getByLabel('Monto (RD$)').inputValue() === '2800.00')
await pago.getByLabel('Monto (RD$)').fill('1000')
await pago.getByRole('button', { name: 'Registrar pago' }).click()
check('el pago da su recibo', await visible(pago.getByText(/Recibo\s+0000\d\d/)))
await pago.getByRole('link', { name: 'Imprimir recibo' }).click()
await doc.waitForURL('**/recibos/*', { timeout: 8000 })
const recibo = await doc.locator('article').innerText()
check('el recibo lleva clínica, número y saldo',
  recibo.includes('CLÍNICA DENTAL SONRISA') && recibo.includes('Saldo pendiente') && recibo.includes('RD$ 1,800.00'),
  recibo.replace(/\s+/g, ' ').slice(0, 140))
await doc.screenshot({ path: '/salida/recorrido-07-recibo.png' })

await doc.goto(`${B}/pacientes/2?pestana=cuenta`, { waitUntil: 'networkidle' })
check('la cuenta enseña el balance y el abono',
  await visible(doc.getByText('abonado RD$ 1,000.00 de RD$ 2,800.00')))

// --- Plan y presupuesto
await doc.goto(`${B}/pacientes/1/planes/1`, { waitUntil: 'networkidle' })
await visible(doc.getByText('PT-2026-0001').first())
const plan = await doc.locator('main').innerText()
check('el plan enseña lo cotizado, el descuento y lo hecho',
  plan.includes('RD$ 103,930.00') && plan.includes('Hecho') && plan.includes('Pendiente'))
await doc.screenshot({ path: '/salida/recorrido-08-plan.png', fullPage: true })

// --- Documentos, firma y receta
await doc.goto(`${B}/pacientes/1?pestana=documentos`, { waitUntil: 'networkidle' })
await visible(doc.getByRole('button', { name: 'Nuevo documento' }))
check('el consentimiento del seed aparece firmado',
  await visible(doc.getByText('Firmado por Juan Carlos Peña Rosario')))
await doc.getByRole('button', { name: 'Nuevo documento' }).click()
const emitir = doc.getByRole('dialog')
await emitir.getByLabel('Plantilla').selectOption({ label: 'Consentimiento informado · se firma' })
await visible(emitir.getByLabel('Contenido'))
check('la plantilla llega combinada con los datos del paciente',
  (await emitir.getByLabel('Contenido').inputValue()).includes('Juan Carlos Peña Rosario'))
await emitir.getByRole('button', { name: 'Emitir documento' }).click()
await visible(doc.getByText('Pendiente de firma'))
await doc.getByRole('button', { name: 'Firmar' }).first().click()
await doc.getByRole('button', { name: 'Generar enlace de firma' }).click()
const enlace = await doc.getByLabel('Enlace de firma').inputValue()
check('se genera un enlace de firma', enlace.includes('/firmar/'))

// La firma, en un navegador sin sesión
const anonimo = await (await nav.newContext({ viewport: { width: 820, height: 1180 }, ...LUGAR })).newPage()
anonimo.on('pageerror', (e) => errores.push(`pageerror firma: ${e.message}`))
await anonimo.goto(enlace.replace(/^https?:\/\/[^/]+/, B), { waitUntil: 'networkidle' })
await visible(anonimo.getByText('Firma aquí'))
check('la página de firma no pide sesión ni enseña el menú',
  await anonimo.getByRole('navigation', { name: 'Principal' }).count() === 0)
await anonimo.getByLabel('Nombre de quien firma').fill('Juan Carlos Peña Rosario')
const lienzo = await anonimo.getByRole('img', { name: 'Zona para firmar' }).boundingBox()
await anonimo.mouse.move(lienzo.x + 60, lienzo.y + 90)
await anonimo.mouse.down()
for (let i = 1; i <= 14; i++) {
  await anonimo.mouse.move(lienzo.x + 60 + i * 30, lienzo.y + 90 + (i % 2 ? -35 : 30), { steps: 3 })
}
await anonimo.mouse.up()
await anonimo.screenshot({ path: '/salida/recorrido-09-firma.png' })
await anonimo.getByRole('button', { name: 'Firmar y enviar' }).click()
check('la firma se recibe', await visible(anonimo.getByText('Firma recibida. Gracias.')))

await doc.keyboard.press('Escape')
await doc.reload({ waitUntil: 'networkidle' })
check('el documento pasa a firmado', await doc.getByText('Pendiente de firma').count() === 0)

await doc.getByRole('button', { name: 'Receta' }).click()
const receta = doc.getByRole('dialog')
await receta.getByLabel('Medicamento 1', { exact: true }).fill('Amoxicilina 500 mg')
await receta.getByLabel('Dosis 1').fill('1 cápsula')
await receta.getByLabel('Frecuencia 1').fill('Cada 8 horas')
await receta.getByRole('button', { name: 'Guardar receta' }).click()
check('recetar contra una alergia avisa y pide confirmar',
  await visible(receta.getByText(/choca con la alergia a Penicilina/)))
await doc.screenshot({ path: '/salida/recorrido-10-alergia.png' })
await receta.getByRole('button', { name: 'Cancelar' }).click()

// --- Caja e inventario
await menu(doc, 'Caja').click()
await visible(doc.getByText('Total cobrado'))
check('la caja del día suma el pago recién hecho',
  (await doc.locator('main').innerText()).includes('RD$ 1,000.00'))
await doc.getByRole('tab', { name: 'Cuentas por cobrar' }).click()
await doc.waitForSelector('tbody tr', { timeout: 8000 })
const porCobrar = await doc.locator('main').innerText()
check('las cuentas por cobrar traen la antigüedad', porCobrar.includes('Más de 90 días') && porCobrar.includes('Juan Carlos Peña Rosario'))
await doc.screenshot({ path: '/salida/recorrido-11-por-cobrar.png', fullPage: true })

await menu(doc, 'Inventario').click()
await doc.waitForSelector('tbody tr', { timeout: 8000 })
const inventario = await doc.locator('main').innerText()
check('el inventario avisa de lo que hay que reponer', inventario.includes('Reponer') && inventario.includes('No se almacena'))
// La resina de la consulta gastó su receta: 3 − 0,1 de jeringa.
check('ejecutar el servicio descontó su receta del almacén', inventario.includes('2.9'), inventario.match(/Resina compuesta A2[\s\S]{0,90}/)?.[0].replace(/\s+/g, ' '))
await doc.screenshot({ path: '/salida/recorrido-12-inventario.png', fullPage: true })
check('el doctor no ve Gastos ni Informes',
  await menu(doc, 'Gastos').count() === 0 && await menu(doc, 'Informes').count() === 0)

// ============================================================ Administración
const admin = await entrar('admin@dentalsonrisa.do')
await menu(admin, 'Gastos').click()
await visible(admin.getByText('Total gastado'))
await admin.getByLabel('Desde').fill('2026-09-01')
await admin.waitForSelector('tbody tr', { timeout: 8000 })
check('los gastos se desglosan por categoría', (await admin.locator('main').innerText()).includes('Alquiler'))
await admin.getByRole('button', { name: 'Registrar gasto' }).click()
const gasto = admin.getByRole('dialog')
await gasto.getByLabel('Monto (RD$)').fill('1800')
await gasto.getByLabel('Descripción').fill('Agua de octubre')
await gasto.getByLabel('Categoría').selectOption({ label: 'Servicios (luz, agua, internet)' })
await gasto.getByRole('button', { name: 'Registrar gasto' }).click()
check('se registra un gasto', await visible(admin.getByText('Gasto registrado')))
await admin.screenshot({ path: '/salida/recorrido-13-gastos.png', fullPage: true })

await menu(admin, 'Informes').click()
await visible(admin.getByText('Por liquidar'))
const informe = await admin.locator('main').innerText()
check('el informe da ingresos, gastos, neto y lo que toca a cada doctor',
  ['Ingresos', 'Gastos', 'Neto', 'Le corresponde'].every((t) => informe.includes(t)))
await admin.screenshot({ path: '/salida/recorrido-14-informes.png', fullPage: true })

await menu(admin, 'Catálogo').click()
await admin.waitForSelector('tbody tr', { timeout: 15000 })
await admin.getByRole('button', { name: 'Insumos de Resina · 1 superficie' }).click()
check('la receta del servicio da su costo y su margen',
  await visible(admin.getByRole('dialog').getByText('Margen sobre el precio particular')))

check('sin errores de JavaScript', errores.length === 0, errores.slice(0, 3).join(' | '))

await nav.close()
console.log(`\n${fallos.length === 0 ? 'TODO OK' : `FALLOS: ${fallos.join(', ')}`}`)
process.exit(fallos.length === 0 ? 0 : 1)
