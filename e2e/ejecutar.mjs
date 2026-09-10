/** Lanza la prueba de humo en un contenedor de Playwright. */
import { execFileSync } from "node:child_process"
import { networkInterfaces } from "node:os"
import { mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const aqui = dirname(fileURLToPath(import.meta.url))
const salida = resolve(aqui, "salida")
mkdirSync(salida, { recursive: true })

// Vite rechaza el Host "host.docker.internal", así que se usa la IP de red.
const ip = Object.values(networkInterfaces())
  .flat()
  .find((i) => i && i.family === "IPv4" && !i.internal)?.address

if (!ip) {
  console.error("No se encontró una IP de red. Arranca Vite con `npm run dev -- --host`.")
  process.exit(1)
}

// Un argumento opcional elige el guion: `node e2e/ejecutar.mjs botones`
const guion = `${process.argv[2] ?? "smoke"}.mjs`
const base = `http://${ip}:5173`
console.log(`Probando ${guion} contra ${base}\n`)

execFileSync(
  "docker",
  [
    "run", "--rm",
    "-e", `BASE=${base}`,
    "-v", `${aqui}:/e2e`,
    "-v", `${salida}:/salida`,
    "-w", "/e2e",
    "mcr.microsoft.com/playwright:v1.49.0-noble",
    "sh", "-c", `npm i -s playwright@1.49.0 >/dev/null 2>&1 && node ${guion}`,
  ],
  { stdio: "inherit" },
)
