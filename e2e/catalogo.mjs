/**
 * Catálogo y configuración, de extremo a extremo.
 *
 * Crea un servicio y una categoría y los borra al terminar: no deja rastro en
 * los datos demo, así que `make verify` sigue pasando después.
 *
 *   npm run e2e catalogo
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
  return pag
}

const filas = (pag) => pag.locator('tbody tr')

// --- Administración ---------------------------------------------------------
const admin = await entrar('admin@dentalsonrisa.do')
const menu = admin.getByRole('navigation', { name: 'Principal' })
check('administración ve Catálogo y Configuración',
  await menu.getByRole('link', { name: 'Catálogo' }).isVisible() &&
  await menu.getByRole('link', { name: 'Configuración' }).isVisible())

await menu.getByRole('link', { name: 'Catálogo' }).click()
await admin.waitForSelector('tbody tr', { timeout: 15000 })
check('lista los 47 servicios del seed', await filas(admin).count() === 47, `${await filas(admin).count()} filas`)
check('hay una columna de precio por tarifa',
  await admin.getByRole('columnheader', { name: 'Tarifa particular 2026' }).isVisible() &&
  await admin.getByRole('columnheader', { name: 'Tarifa ARS Humano 2026' }).isVisible())
const primera = await filas(admin).first().innerText()
check('los precios salen en un solo formato', /RD\$ [\d,]+\.\d{2}/.test(primera), primera.replace(/\s+/g, ' ').slice(0, 90))
await admin.screenshot({ path: '/salida/catalogo-01-servicios.png', fullPage: true })

await admin.getByLabel('Buscar servicios').fill('panoramica')
await admin.waitForTimeout(300)
check('la búsqueda ignora las tildes', await filas(admin).count() === 1, `${await filas(admin).count()} fila(s)`)
await admin.getByLabel('Buscar servicios').fill('')

// Un servicio en uso no se puede borrar
const enUso = admin.getByRole('button', { name: 'Eliminar Resina · 1 superficie' })
check('la papelera de un servicio en uso está deshabilitada', await enUso.isDisabled())

// Alta sin precio particular
await admin.getByRole('button', { name: 'Nuevo servicio' }).click()
const dialogo = admin.getByRole('dialog')
await dialogo.getByLabel('Nombre').fill('Servicio de prueba E2E')
await dialogo.getByLabel('Categoría').selectOption({ label: 'Estética' })
await dialogo.getByRole('button', { name: 'Crear servicio' }).click()
check('exige el precio de la tarifa particular',
  await dialogo.getByText('Este precio es obligatorio').isVisible())
await admin.screenshot({ path: '/salida/catalogo-02-alta.png' })

// Alta correcta
await dialogo.getByLabel('Tarifa particular 2026').fill('4500')
await dialogo.getByRole('button', { name: 'Crear servicio' }).click()
await admin.getByText('Servicio creado').waitFor({ timeout: 8000 })
await admin.getByLabel('Buscar servicios').fill('prueba E2E')
await admin.waitForTimeout(400)
const nueva = await filas(admin).first().innerText()
check('el servicio nuevo aparece con su código y su precio',
  /EST-\d{3}/.test(nueva) && nueva.includes('RD$ 4,500.00'), nueva.replace(/\s+/g, ' '))

// Edición del precio
await admin.getByRole('button', { name: 'Editar Servicio de prueba E2E' }).click()
await admin.getByRole('dialog').getByLabel('Tarifa particular 2026').fill('5200.50')
await admin.getByRole('dialog').getByRole('button', { name: 'Guardar cambios' }).click()
await admin.getByText('Servicio actualizado').waitFor({ timeout: 8000 })
const editado = await admin.getByText('RD$ 5,200.50').waitFor({ timeout: 8000 }).then(() => true, () => false)
check('el precio editado se refleja en la tabla', editado)

// Borrado: sin uso, se puede
await admin.getByRole('button', { name: 'Eliminar Servicio de prueba E2E' }).click()
await admin.getByText('eliminado').waitFor({ timeout: 8000 })
await admin.getByLabel('Buscar servicios').fill('')
await admin.waitForTimeout(400)
check('tras borrarlo vuelven a ser 47', await filas(admin).count() === 47, `${await filas(admin).count()} filas`)

// Categorías
await admin.getByRole('tab', { name: 'Categorías' }).click()
await admin.getByLabel('Nombre de la nueva categoría').waitFor({ timeout: 8000 })
await admin.getByRole('button', { name: 'Eliminar Endodoncia' }).waitFor({ timeout: 8000 })
check('la pestaña queda en la URL', admin.url().includes('pestana=categorias'))
await admin.getByLabel('Nombre de la nueva categoría').fill('endodoncia')
await admin.getByRole('button', { name: 'Añadir categoría' }).click()
await admin.getByRole('alert').waitFor({ timeout: 8000 })
check('no caben dos categorías con el mismo nombre',
  (await admin.getByRole('alert').innerText()).includes('Ya existe'))
await admin.getByLabel('Nombre de la nueva categoría').fill('Categoría E2E')
await admin.getByRole('button', { name: 'Añadir categoría' }).click()
await admin.getByText('Categoría E2E', { exact: true }).waitFor({ timeout: 8000 })
await admin.getByRole('button', { name: 'Eliminar Categoría E2E' }).click()
await admin.getByText('Categoría E2E', { exact: true }).waitFor({ state: 'detached', timeout: 8000 })
check('una categoría vacía se crea y se borra', true)
check('una categoría con servicios no se puede borrar',
  await admin.getByRole('button', { name: 'Eliminar Endodoncia' }).isDisabled())
await admin.screenshot({ path: '/salida/catalogo-03-categorias.png', fullPage: true })

// Configuración
await menu.getByRole('link', { name: 'Configuración' }).click()
// Abre en «Clínica», la primera pestaña: las unidades están en la segunda.
await admin.getByRole('tab', { name: 'Unidades dentales' }).click()
await admin.getByText('Unidad 2').waitFor({ timeout: 8000 })
check('las unidades del seed, con la alquilada marcada',
  await admin.getByText('Unidad 1', { exact: true }).isVisible() &&
  await admin.getByText('Alquilada').isVisible())
await admin.getByRole('tab', { name: 'Doctores' }).click()
await admin.waitForSelector('tbody tr', { timeout: 8000 })
const doctores = await admin.locator('tbody').innerText()
check('los doctores llevan el tratamiento puesto por la aplicación',
  await filas(admin).count() === 3 && doctores.includes('Dr(a). Laura Fernández Cruz'))
await admin.getByRole('tab', { name: 'Usuarios' }).click()
await admin.waitForSelector('tbody tr', { timeout: 8000 })
check('las cinco cuentas del seed, con la propia marcada',
  await filas(admin).count() === 5 && await admin.getByText('Tú', { exact: true }).isVisible())
await admin.screenshot({ path: '/salida/catalogo-04-usuarios.png', fullPage: true })

// --- Recepción --------------------------------------------------------------
const recepcion = await entrar('recepcion@dentalsonrisa.do')
const menuRecepcion = recepcion.getByRole('navigation', { name: 'Principal' })
check('recepción no ve Configuración',
  await menuRecepcion.getByRole('link', { name: 'Configuración' }).count() === 0)
await recepcion.goto(`${B}/configuracion`, { waitUntil: 'networkidle' })
const devuelta = await recepcion.waitForURL('**/inicio', { timeout: 8000 }).then(() => true, () => false)
check('y la ruta directa la devuelve al inicio', devuelta, recepcion.url())
await menuRecepcion.getByRole('link', { name: 'Catálogo' }).click()
await recepcion.waitForSelector('tbody tr', { timeout: 15000 })
check('recepción consulta el catálogo pero no lo edita',
  await filas(recepcion).count() === 47 &&
  await recepcion.getByRole('button', { name: 'Nuevo servicio' }).count() === 0)

check('sin errores de JavaScript', errores.length === 0, errores.slice(0, 3).join(' | '))

await nav.close()
console.log(`\n${fallos.length === 0 ? 'TODO OK' : `FALLOS: ${fallos.join(', ')}`}`)
process.exit(fallos.length === 0 ? 0 : 1)
