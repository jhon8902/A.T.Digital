import { defineConfig } from "astro/config";
import netlify from "@astrojs/netlify";
import { devAdminApi } from "./scripts/dev-admin-api.mjs";

// devAdminApi: evita TimeoutError (3 s) al guardar notas en local.
// Ver docs/desarrollo-local.md — no quitar sin leer esa guía.
export default defineConfig({
  site: "https://autotechdigital.com",
  output: "server",
  adapter: netlify(),
  vite: {
    plugins: [devAdminApi()],
  },
});







