# Checklist — migrar imágenes a Cloudinary y liberar espacio

Guía para pasar de carpetas locales (`escritorio` + `public/img/`) a URLs en Cloudinary, sin romper el sitio.

---

## 1. Qué va a Cloudinary y qué no

| Tipo | ¿Migrar? | Notas |
|------|----------|--------|
| Fotos de notas nuevas (formulario) | Ya en Cloudinary | `image1`–`image6` en la BD |
| Notas antiguas estáticas (`notas-electricos`, `noticias-carrusel`, etc.) | Sí, gradual | Hoy usan `/img/...` en el `.astro` |
| Videos de pruebas (`public/img/videos-pruebas/`) | Opcional | Pesados; Cloudinary también sirve video |
| AutoMatch (`autos.json` + fichas) | Sí, gradual | Muchas rutas `/img/...` |
| Logo, OG, patrones, banners del sitio | No (por ahora) | Assets de marca; mantener en `public/` |
| Imágenes solo en tu escritorio (pre-publicación) | Archivar tras publicar | No están en el repo |

---

## 2. Antes de borrar nada

- [ ] Confirmar en [Cloudinary Media Library](https://cloudinary.com/console) que las fotos están en `atdigital/notas` (o el folder configurado).
- [ ] Abrir la nota publicada en el sitio y verificar las 6 imágenes (portada + bloques).
- [ ] Copia de seguridad: disco externo, NAS o carpeta `Archivo-ATD-2026` fuera del repo.
- [ ] No borrar `public/img/` del repo hasta terminar la migración de cada lote.

---

## 3. Notas ya en la base de datos (dinámicas)

Si la nota se creó con el formulario y solo tienes copias locales duplicadas:

1. [ ] Publicar / verificar en `/notas/[id]`.
2. [ ] En el panel o BD, confirmar que `image1`–`image6` son URLs `https://res.cloudinary.com/...`.
3. [ ] Archivar o eliminar la carpeta del escritorio de esa marca.
4. [ ] No hace falta tocar código.

---

## 4. Notas estáticas (archivos `.astro` legacy)

Rutas típicas:

- `src/pages/notas-electricos/`
- `src/pages/notas-hibridos/`
- `src/pages/notas-deportes/`
- `src/pages/noticias-carrusel/`
- `src/pages/noticias-nacionales/`

Por cada nota:

1. [ ] Subir las imágenes al formulario (Cloudinary) o directo a Cloudinary con el mismo orden (image1 = portada).
2. [ ] Crear la nota en el formulario con el mismo texto **o** actualizar URLs en el `.astro` si aún no migras a BD.
3. [ ] Si migras a BD: publicar, probar URL `/notas/id`, luego redirigir o dejar el `.astro` como legacy hasta quitarlo.
4. [ ] Quitar entradas de `staticNotes` en `electricos.astro`, `hibridos.astro`, `noticias.astro`, etc., si ya no hacen falta.
5. [ ] Eliminar la carpeta en `public/img/[marca-modelo]/` solo cuando ningún archivo la referencia (buscar en el repo: `grep -r "nombre-carpeta" src/`).

---

## 5. Videos de pruebas

Archivos antiguos en `public/img/videos-pruebas/` y referencias en `pruebas.astro`.

**Flujo actual (recomendado):** desde `/formulario`, sección Videos → subir a Cloudinary
(`PUBLIC_CLOUDINARY_VIDEO_FOLDER`, por defecto `atdigital/pruebas`). La URL queda en `video1`.

1. [ ] Subir video desde el formulario (o Media Library si falla la red).
2. [ ] Confirmar que `video1` es URL `https://res.cloudinary.com/.../video/upload/...`.
3. [ ] Probar reproducción en home y en `/pruebas`.
4. [ ] Borrar el `.mp4` local del repo si ya no se usa.

---

## 6. AutoMatch

1. [ ] Inventariar imágenes en `src/data/automatch/autos.json`.
2. [ ] Subir portadas a Cloudinary (`atdigital/automatch`).
3. [ ] Reemplazar rutas `/img/...` por URLs Cloudinary en el JSON.
4. [ ] Verificar fichas en `/automatch-find` y páginas de detalle.

---

## 7. Limpieza del escritorio (tu flujo habitual)

Después de cada nota publicada:

```
Escritorio/Imágenes-ATD/
  ├── En-proceso/     ← trabajas aquí por marca
  ├── Publicadas/     ← mover carpeta tras verificar en el sitio
  └── Archivo-2026/   ← backup anual (opcional)
```

- [ ] Mover carpeta de `En-proceso` → `Publicadas` al publicar.
- [ ] Una vez al mes: comprimir `Publicadas` y guardar fuera del PC si necesitas espacio.
- [ ] El escritorio no es backup del sitio; Cloudinary + BD son la fuente de verdad para notas nuevas.

---

## 8. Limpieza del repo (`public/img/`)

Solo cuando un lote esté migrado:

1. [ ] `git grep "ruta-de-la-imagen"` → cero resultados.
2. [ ] Build local: `npm run build` sin errores.
3. [ ] Revisar home, archivo de categoría y nota individual.
4. [ ] Commit: `chore: remove migrated img assets for [marca/modelo]`.
5. [ ] Deploy y smoke test en producción.

---

## 9. Orden sugerido (por impacto / peso)

1. [ ] Videos de pruebas (más peso en disco).
2. [ ] Notas estáticas más visitadas (grep en analytics o las del home).
3. [ ] Resto de `notas-electricos` / `notas-hibridos`.
4. [ ] `noticias-carrusel` y `noticias-nacionales`.
5. [ ] AutoMatch.
6. [ ] Assets de marca (logo, OG) — mantener local o CDN dedicado.

---

## 10. Variables de entorno (formulario)

En `.env` / Netlify:

```env
PUBLIC_CLOUDINARY_CLOUD_NAME=tu_cloud_name
PUBLIC_CLOUDINARY_UPLOAD_PRESET=tu_upload_preset_unsigned
PUBLIC_CLOUDINARY_FOLDER=atdigital/notas
PUBLIC_CLOUDINARY_VIDEO_FOLDER=atdigital/pruebas
```

Sin esto, el formulario no sube; las carpetas locales seguirían siendo necesarias.

Los videos se suben **directo desde el navegador** a Cloudinary (no pasan por el proxy de imágenes de 8 MB).

---

## Referencia rápida

- Plantilla editorial: `docs/plantilla-nota.md`
- Subida API (imágenes): `src/pages/api/upload-cloudinary.ts`
- Videos: uploader en `/formulario` → `public/js/formulario.js`
- Archivos de categoría (tarjetas unificadas): `public/css/archive-section.css`
