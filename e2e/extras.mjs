/**
 * Lo que se sumó tras el recorrido principal: resumen del paciente, fotos y
 * exámenes, implantes con lote, odontograma (pestañas, versiones, clases de
 * Black), ítems del plan, comprobantes fiscales, cierre de caja, vista de mes,
 * recordatorios, tarifas y secuencias de NCF.
 *
 * **Escribe datos** (archivos, una consulta, un implante, un comprobante, un
 * cierre de caja, una tarifa): después hay que recrear la base con `make reset`.
 *
 *   npm run e2e extras
 */
import { chromium } from 'playwright'

const B = process.env.BASE
const fallos = []
const errores = []
const nav = await chromium.launch()
const LUGAR = { timezoneId: 'America/Santo_Domingo', locale: 'es-DO' }

// Un PNG válido de 1×1: el servidor decide el tipo por el contenido.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)
const foto = (nombre) => ({ name: nombre, mimeType: 'image/png', buffer: PNG })

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

// --- Recordatorios de mañana
check('el tablero ofrece avisar a las citas de mañana',
  await visible(doc.getByRole('heading', { name: /Citas de mañana/ })) &&
  await visible(doc.getByRole('link', { name: 'Avisar por WhatsApp' }).first()))

// --- Resumen del paciente
await doc.goto(`${B}/pacientes/1`, { waitUntil: 'networkidle' })
await visible(doc.getByText('Próxima cita'))
const resumen = await doc.locator('main').innerText()
check('el resumen trae seguro, plan y el implante con su lote',
  resumen.includes('ARS Humano') && resumen.includes('PT-2026-0001') &&
  resumen.includes('Implante 36 · lote LT-2026-A4179'),
  resumen.replace(/\s+/g, ' ').slice(0, 160))
await doc.screenshot({ path: '/salida/extras-01-resumen.png', fullPage: true })

// --- Foto de una consulta
const entradaFoto = doc.locator('li', { hasText: 'Foto' }).locator('input[type="file"]').first()
await entradaFoto.setInputFiles(foto('intraoral.png'))
check('la foto queda en su consulta',
  await visible(doc.getByRole('button', { name: 'Ver Fotografía' }).first()))

// --- Fotos y exámenes
await doc.getByRole('tab', { name: 'Documentos' }).click()
await visible(doc.getByRole('heading', { name: 'Fotos y exámenes' }))
await doc.getByRole('button', { name: 'Subir', exact: true }).click()
const subir = doc.getByRole('dialog')
await subir.locator('#archivos-subida').setInputFiles(foto('panoramica-control.png'))
await subir.getByLabel('Tipo').selectOption({ label: 'Panorámica' })
await subir.getByLabel('Título').fill('Panorámica de control')
await subir.getByRole('button', { name: 'Subir', exact: true }).click()
check('el examen aparece en el expediente',
  await visible(doc.getByRole('button', { name: /Panorámica de control/ })))
await doc.getByRole('button', { name: /Panorámica de control/ }).click()
const visor = doc.getByRole('dialog')
check('el visor enseña la imagen desde memoria, no desde una URL pública',
  await visible(visor.locator('img[src^="blob:"]')))
await doc.screenshot({ path: '/salida/extras-02-archivo.png' })
await visor.getByText('Cerrar', { exact: true }).click()

// --- Odontograma: pestañas, clases de Black, versiones e implantes
await doc.getByRole('tab', { name: 'Odontograma' }).click()
await doc.waitForSelector('svg[role="group"]', { timeout: 15000 })
check('la paleta va por pestañas',
  await visible(doc.getByRole('tab', { name: /Restauraciones/ })) &&
  await visible(doc.getByRole('tab', { name: /Prótesis e implantes/ })))
const odonto = await doc.locator('main').innerText()
check('la tabla calcula la clase de Black', /Clase (I|II|III|IV|V|VI)\b/.test(odonto))
check('los implantes llevan lote y seguimiento',
  odonto.includes('LT-2026-A4179') && odonto.includes('Segunda fase'))
await doc.screenshot({ path: '/salida/extras-03-odontograma.png', fullPage: true })

await doc.getByRole('button', { name: 'Seguimiento' }).first().click()
const seguimiento = doc.getByRole('dialog')
await seguimiento.getByLabel('Qué se hizo').selectOption({ label: 'Carga protésica' })
await seguimiento.getByLabel('Hallazgos').fill('Corona atornillada, oclusión ajustada')
await seguimiento.getByRole('button', { name: 'Guardar seguimiento' }).click()
check('la carga deja el implante cargado', await visible(doc.getByText('Cargado', { exact: true })))

await doc.getByRole('button', { name: 'Nueva versión' }).click()
await doc.getByRole('dialog').getByRole('button', { name: 'Crear versión' }).click()
check('la línea de tiempo suma la versión nueva',
  await visible(doc.getByRole('list', { name: 'Versiones del odontograma' }).getByText('v2')))

// --- Implante desde la línea de consulta
await doc.goto(`${B}/pacientes/2`, { waitUntil: 'networkidle' })
await doc.getByRole('button', { name: 'Nueva consulta' }).click()
const consulta = doc.getByRole('dialog')
await consulta.getByLabel('Servicio de la línea 1').selectOption({ label: 'Implante dental unitario (cirugía)' })
await consulta.getByLabel('Pieza de la línea 1').fill('46')
await consulta.getByRole('button', { name: 'Registrar consulta' }).click()
check('una línea de implante pide su lote',
  await visible(doc.getByRole('button', { name: 'Registrar lote' })))
await doc.getByRole('button', { name: 'Registrar lote' }).click()
const implante = doc.getByRole('dialog')
await implante.getByLabel('Sistema').selectOption({ label: 'Straumann BLX' })
await implante.getByLabel('Lote').fill('lt-2026-e2e01')
await implante.getByLabel('Diámetro (mm)').fill('4.1')
await implante.getByLabel('Longitud (mm)').fill('10')
await implante.getByRole('button', { name: 'Registrar implante' }).click()
check('con el lote anotado la línea lo dice', await visible(doc.getByText('· lote registrado')))
await doc.screenshot({ path: '/salida/extras-04-implante.png', fullPage: true })

await menu(doc, 'Inventario').click()
await doc.getByLabel('Buscar implantes por lote').fill('e2e01')
check('buscar por lote dice a quién llamar',
  await visible(doc.getByText('LT-2026-E2E01')) && await visible(doc.getByRole('link', { name: /María/ })))

// --- Ítem del plan
await doc.goto(`${B}/pacientes/1/planes/1`, { waitUntil: 'networkidle' })
await visible(doc.getByText('PT-2026-0001').first())
await doc.getByRole('button', { name: /^Editar Corona/ }).first().click()
const item = doc.getByRole('dialog')
await item.getByLabel('Descuento %').fill('10')
await item.getByRole('button', { name: 'Guardar' }).click()
check('un ítem del plan se edita sin quitarlo', await visible(doc.getByText('Ítem actualizado')))

// --- Agenda: vista de mes
await doc.goto(`${B}/agenda?vista=mes`, { waitUntil: 'networkidle' })
await visible(doc.getByRole('button', { name: 'Ver el día 15' }))
check('el mes pinta seis semanas', await doc.getByRole('button', { name: /^Ver el día \d+$/ }).count() === 42)
await doc.screenshot({ path: '/salida/extras-05-mes.png', fullPage: true })

// ============================================================ Recepción
const rec = await entrar('recepcion@dentalsonrisa.do')

await rec.goto(`${B}/pacientes/1?pestana=cuenta`, { waitUntil: 'networkidle' })
await visible(rec.getByRole('heading', { name: 'Comprobantes fiscales' }))
await rec.getByRole('button', { name: 'Emitir comprobante' }).click()
const factura = rec.getByRole('dialog')
check('lo facturable es lo ejecutado que aún no tiene comprobante',
  await visible(factura.getByText('Qué se factura')))
await factura.getByRole('button', { name: 'Emitir comprobante' }).click()
await rec.waitForURL('**/facturas/*', { timeout: 8000 })
const hoja = await rec.locator('article').innerText()
check('el comprobante toma el siguiente NCF y lleva los datos fiscales',
  hoja.includes('NCF B0200000004') && hoja.includes('RNC') && hoja.includes('Válido hasta'),
  hoja.replace(/\s+/g, ' ').slice(0, 160))
await rec.screenshot({ path: '/salida/extras-06-factura.png', fullPage: true })

await rec.goto(`${B}/pacientes/1?pestana=cuenta`, { waitUntil: 'networkidle' })
await visible(rec.getByRole('heading', { name: 'Pagos' }))
await rec.locator('li', { hasText: '000001' }).locator('input[type="file"]').setInputFiles(foto('voucher.png'))
check('el comprobante del pago queda adjunto',
  await visible(rec.locator('li', { hasText: '000001' }).getByRole('button', { name: 'Comprobante' })))

await rec.getByRole('button', { name: 'Registrar pago' }).click()
const pago = rec.getByRole('dialog')
await pago.getByLabel('Monto (RD$)').fill('500')
await pago.getByRole('button', { name: 'Registrar pago' }).click()
await visible(pago.getByText(/Recibo\s+0000\d\d/))

// El diálogo del pago sigue abierto y deja inerte el menú: se va por URL.
await rec.goto(`${B}/caja`, { waitUntil: 'networkidle' })
await rec.getByRole('button', { name: 'Cerrar caja' }).click()
const cierre = rec.getByRole('dialog')
await cierre.getByLabel('Efectivo contado').fill('400')
await cierre.getByLabel('Explicación de la diferencia').fill('Faltan 100: se dio mal un vuelto')
await cierre.getByRole('button', { name: 'Cerrar caja' }).click()
check('el cierre guarda la foto del día con su diferencia',
  await visible(rec.getByText('Caja cerrada').first()) && await visible(rec.getByText('Faltan 100: se dio mal un vuelto')))
await rec.screenshot({ path: '/salida/extras-07-cierre.png', fullPage: true })

// ============================================================ Administración
const admin = await entrar('admin@dentalsonrisa.do')

await admin.goto(`${B}/configuracion?pestana=ncf`, { waitUntil: 'networkidle' })
check('las secuencias de NCF enseñan lo que queda',
  await visible(admin.getByText('B0200000005')) && await visible(admin.getByText('Crédito fiscal')))

await admin.goto(`${B}/catalogo?pestana=tarifas`, { waitUntil: 'networkidle' })
await admin.getByRole('button', { name: 'Nueva tarifa' }).click()
const tarifa = admin.getByRole('dialog')
await tarifa.getByLabel('Nombre').fill('Convenio e2e')
await tarifa.getByLabel('Ajuste %').fill('-10')
await tarifa.getByRole('button', { name: 'Crear tarifa' }).click()
check('una tarifa nueva nace con sus precios', await visible(admin.getByText('Tarifa «Convenio e2e» creada')))
await admin.getByRole('tab', { name: 'Servicios y precios' }).click()
check('y aparece como columna del catálogo',
  await visible(admin.getByRole('columnheader', { name: 'Convenio e2e' })))

check('sin errores de JavaScript', errores.length === 0, errores.slice(0, 3).join(' | '))

await nav.close()
console.log(`\n${fallos.length === 0 ? 'TODO OK' : `FALLOS: ${fallos.join(', ')}`}`)
process.exit(fallos.length === 0 ? 0 : 1)
