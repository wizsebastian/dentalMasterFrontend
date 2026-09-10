# Prueba de humo

```bash
# 1. API levantada
cd ../dentalMasterApi && make up

# 2. Servidor de desarrollo accesible desde el contenedor
npm run dev -- --host

# 3. Las pruebas, contra la IP de red que imprime Vite
npm run e2e            # recorrido clínico completo (smoke.mjs)
npm run e2e botones    # los dos bancos de pruebas y su vuelta
```

`npm run e2e` detecta la IP automáticamente. Las capturas quedan en `e2e/salida/`.

No se usa `host.docker.internal` porque Vite lo rechaza por `server.allowedHosts`;
por IP sí responde.
