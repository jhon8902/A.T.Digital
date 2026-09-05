/**
 * Arranca `astro dev` sin emular Netlify Dev.
 * El plugin de @astrojs/netlify llama a api.netlify.com; sin red, el proceso muere
 * con "Failed retrieving site data / extensions".
 *
 * NETLIFY_DEV=1 hace que @netlify/vite-plugin no se inyecte (es el mismo flag
 * que usa `netlify dev` para no duplicar el emulador).
 */
process.env.NETLIFY_DEV ??= "1";

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const astroBin = path.join(root, "node_modules", "astro", "astro.js");

const child = spawn(
  process.execPath,
  [astroBin, "dev", ...process.argv.slice(2)],
  {
    cwd: root,
    env: process.env,
    stdio: "inherit",
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
