# Desarrollo local — formulario y APIs

Guía para que el panel `/formulario` funcione en tu PC sin timeouts ni sorpresas.

---

## Comando correcto

```bash
npm run dev
```

Abre **http://localhost:4321/formulario** (puerto por defecto de Astro).

No hace falta `netlify dev` para editar notas en local; `npm run dev` es el flujo habitual.

---

## Por qué existía el error de 3 segundos

Con el adaptador `@astrojs/netlify`, `astro dev` emula funciones serverless con **lambda-local**, que corta cada petición a **3 segundos**.

Guardar una nota hace esto:

1. El navegador llama a `/api/save-note`
2. La función conecta a **Postgres remoto** (Neon / Netlify DB)
3. Esa conexión en frío suele tardar **más de 3 s** → `TimeoutError`

**No es culpa del contenido de la nota** (Instagram, imágenes, texto largo, etc.). Es límite del emulador local + base remota.

En **producción** (Netlify) el timeout es **26 s** (`netlify.toml`) y no pasa esto.

---

## Solución permanente en el repo

Archivo: **`scripts/dev-admin-api.mjs`**

Plugin de Vite que, solo en desarrollo, atiende estas rutas **directo en Node** (sin lambda-local):

| Ruta | Uso |
|------|-----|
| `POST /api/save-note` | Crear nota |
| `PUT` / `POST /api/update-note` | Editar nota |
| `DELETE` / `POST /api/delete-note` | Borrar nota |
| `POST /api/upload-cloudinary` | Respaldo subida imágenes por servidor |

Registrado en **`astro.config.mjs`** → `vite.plugins: [devAdminApi()]`.

### ⚠️ No quitar sin reemplazo

Si se elimina `devAdminApi()` de `astro.config.mjs`, el formulario volverá a fallar en local con `Task timed out after 3.00 seconds` al guardar.

Si añades una **nueva API de admin** (protegida con Basic Auth en `src/lib/admin-auth.ts`), regístrala también en `ADMIN_API_ROUTES` dentro de `scripts/dev-admin-api.mjs`.

---

## Variables de entorno (`.env`)

Copia `.env.example` a `.env` y completa:

```env
DATABASE_URL=postgresql://...
FORMULARIO_ADMIN_USER=tu_usuario
FORMULARIO_ADMIN_PASSWORD=tu_clave

PUBLIC_CLOUDINARY_CLOUD_NAME=...
PUBLIC_CLOUDINARY_UPLOAD_PRESET=...
PUBLIC_CLOUDINARY_FOLDER=atdigital/notas
```

Sin `DATABASE_URL`, guardar falla aunque no haya timeout.

Las imágenes del formulario suben **directo a Cloudinary desde el navegador** (no pasan por el proxy de 8 MB). El guardado de la nota sí usa la base de datos.

---

## Checklist si algo falla otra vez

1. ¿Corre `npm run dev` y reiniciaste tras cambios en `astro.config.mjs`?
2. ¿En la terminal de arranque aparece `[dev-admin-api] APIs del formulario activas (sin timeout de 3 s)`?
3. ¿Existe `.env` con `DATABASE_URL` válida?
4. ¿Iniciaste sesión en `/formulario` (Basic Auth)?
5. Si el error es solo en **producción**, revisa variables en Netlify UI, no este doc.

---

## Referencia rápida

| Tema | Archivo |
|------|---------|
| Plugin dev | `scripts/dev-admin-api.mjs` |
| Config Astro | `astro.config.mjs` |
| Timeout producción | `netlify.toml` → `[functions."save-note"]` timeout = 26 |
| Auth admin | `src/lib/admin-auth.ts`, `src/middleware.ts` |
| Formulario JS | `public/js/formulario.js` |
| Cloudinary imágenes | `docs/migracion-imagenes-cloudinary.md` |
