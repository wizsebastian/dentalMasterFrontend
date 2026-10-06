# Prueba de humo

```bash
# 1. API levantada
cd ../dentalMasterApi && make up

# 2. Servidor de desarrollo accesible desde el contenedor
npm run dev -- --host

# 3. Las pruebas, contra la IP de red que imprime Vite
npm run e2e            # recorrido clínico completo (smoke.mjs)
npm run e2e botones    # los dos bancos de pruebas y su vuelta
npm run e2e loaders    # el loading de isotipos de ambos bancos
npm run e2e notaciones # menú contextual y tabla sobre el lienzo de la librería
npm run e2e catalogo   # catálogo, configuración y permisos por rol
npm run e2e paciente   # alta y edición de paciente, buscador y ficha médica
npm run e2e recorrido  # agenda, consulta, cobro, firma, caja, gastos, inventario, informes
npm run e2e extras     # archivos, implantes, odontograma, NCF, cierre de caja, tarifas, mes
npm run e2e informes   # reporte por doctor y «Mi producción» (sólo lee)
npm run e2e mejoras    # Salir, búsqueda sin tildes, teléfono, selects, pincel, datos de la clínica
npm run e2e onboarding # la guía de primeros pasos (necesita `make vacio`)
```

Cada guion es `e2e/<nombre>.mjs`; uno nuevo no necesita tocar `package.json`.

`catalogo` y `paciente` escriben en la base de desarrollo y **deshacen lo que hacen**:
después de correrlos, `make verify` sigue dando 101 PASS. Si uno se interrumpe a medias
puede dejar un servicio o una categoría de prueba; `make reset` en la API lo limpia.

Si el `:5173` ya está ocupado por un servidor sin `--host`, se levanta otro y se le
apunta:

```bash
npm run dev -- --host --port 5174 --strictPort
PUERTO=5174 npm run e2e catalogo
```

`npm run e2e` detecta la IP automáticamente. Las capturas quedan en `e2e/salida/`.

No se usa `host.docker.internal` porque Vite lo rechaza por `server.allowedHosts`;
por IP sí responde.

`recorrido`, `extras` y `mejoras` son la excepción a «deshacen lo que hacen»: agendan, cobran, firman,
facturan y suben archivos de verdad, y parten del seed recién cargado (las citas de hoy, el
siguiente NCF). Antes y después de correr cada uno, `make reset` en la API.
