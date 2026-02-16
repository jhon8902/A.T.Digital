# 📐 GUÍA DE TIPOGRAFÍA Y TAMAÑOS DE FUENTES

## Sistema Tipográfico Escalable Implementado

Hemos creado un sistema completo de escalas tipográficas basado en **variables CSS** que se adaptan automáticamente según el dispositivo.

---

## ⚙️ Escala de Tamaños de Fuentes

### Títulos (Headings)

| Elemento | Desktop        | Tablet         | Mobile          | Uso                            |
| -------- | -------------- | -------------- | --------------- | ------------------------------ |
| **H1**   | 56px (3.5rem)  | 40px (2.5rem)  | 28px (1.75rem)  | Títulos principales de páginas |
| **H2**   | 44px (2.75rem) | 32px (2rem)    | 24px (1.5rem)   | Títulos de secciones grandes   |
| **H3**   | 32px (2rem)    | 24px (1.5rem)  | 20px (1.25rem)  | Subtítulos y card titles       |
| **H4**   | 24px (1.5rem)  | 20px (1.25rem) | 18px (1.125rem) | Títulos pequeños               |

### Body Text

| Elemento     | Tamaño          | Line Height | Uso                        |
| ------------ | --------------- | ----------- | -------------------------- |
| **Subtitle** | 20px (1.25rem)  | 1.8         | Subtítulos y descripciones |
| **Body**     | 16px (1rem)     | 1.5         | Texto principal            |
| **Small**    | 14px (0.875rem) | 1.5         | Etiquetas y metadata       |
| **Caption**  | 12px (0.75rem)  | 1.5         | Fechas y notas pequeñas    |

---

## 🎯 Cómo Usar en Tu Proyecto

### Opción 1: Clases CSS (Recomendado)

```html
<!-- Títulos -->
<h1 class="text-h1">Mi Título Principal</h1>
<h2 class="text-h2">Subtítulo Importante</h2>
<h3 class="text-h3">Subtítulo Menor</h3>
<h4 class="text-h4">Título Pequeño</h4>

<!-- Textos -->
<p class="text-subtitle">Subtítulo o descripción corta</p>
<p class="text-body">Párrafo normal con contenido principal</p>
<p class="text-small">Información secundaria</p>
<p class="text-caption">Fecha publicado, metadata</p>
```

### Opción 2: Variables CSS Directas

```css
.mi-elemento {
  font-size: var(--text-h1-desktop);
  line-height: var(--lh-tight);
  font-weight: 700;
}

/* Se ajustará automáticamente en tablet y mobile */
```

### Opción 3: HTML Nativo (Automático)

```html
<h1>Título</h1>
<!-- Automáticamente 56px desktop, 40px tablet, 28px mobile -->
<h2>Subtítulo</h2>
<p>Párrafo normal</p>
```

---

## 📱 Breakpoints Automáticos

El sistema ajusta automáticamente según el dispositivo:

```css
/* Desktop (1024px+) */
--text-h1-desktop: 3.5rem;

/* Tablet (768px - 1024px) */
@media (max-width: 1024px) {
  --text-h1-desktop: 2.75rem;
}

/* Mobile (480px - 768px) */
@media (max-width: 768px) {
  --text-h1-desktop: var(--text-h1-tablet);
}

/* Small Mobile (0 - 480px) */
@media (max-width: 480px) {
  --text-h1-desktop: var(--text-h1-mobile);
}
```

---

## ✅ Recomendaciones de Uso por Sección

### Página Principal / Home

- **H1**: Título principal del sitio (56px desktop)
- **H2**: Títulos de secciones (44px desktop)
- **Body**: Descripciones generales (16px)

### Artículos / Noticias

- **H1**: Título del artículo (56px)
- **H3**: Subtítulos en el contenido (32px)
- **Body**: Párrafos de contenido (16px)
- **Caption**: Fechas de publicación (12px)

### Tarjetas de Producto / Card

- **H3**: Nombre del producto (32px)
- **Body**: Descripción corta (16px)
- **Small**: Precio o metadata (14px)

### Formularios

- **H3**: Títulos de sección (32px)
- **Body**: Labels y textos (16px)
- **Small**: Textos de ayuda (14px)

---

## 🎨 Paleta Tipográfica Completa

```css
/* Variables disponibles en :root */
--text-h1-desktop: 3.5rem;
--text-h1-tablet: 2.5rem;
--text-h1-mobile: 1.75rem;

--text-h2-desktop: 2.75rem;
--text-h2-tablet: 2rem;
--text-h2-mobile: 1.5rem;

--text-h3-desktop: 2rem;
--text-h3-tablet: 1.5rem;
--text-h3-mobile: 1.25rem;

--text-h4-desktop: 1.5rem;
--text-h4-tablet: 1.25rem;
--text-h4-mobile: 1.125rem;

--text-subtitle: 1.25rem;
--text-body-large: 1.125rem;
--text-body: 1rem;
--text-small: 0.875rem;
--text-caption: 0.75rem;

/* Line Heights */
--lh-tight: 1.2; /* Para títulos */
--lh-normal: 1.5; /* Para texto normal */
--lh-relaxed: 1.8; /* Para párrafos largos */
```

---

## ⚡ Ventajas del Sistema

✅ **Consistencia**: Mismos tamaños en todas las páginas  
✅ **Escalabilidad**: Cambia un valor y se actualiza todo  
✅ **Responsiveness**: Automático según dispositivo  
✅ **Mantenibilidad**: Fácil de actualizar globalmente  
✅ **Accesibilidad**: Tamaños legibles en todos los dispositivos  
✅ **Performance**: Menos código CSS duplicado

---

## 🔧 Cómo Implementar en Tu Proyecto

### 1. Actualizar componentes existentes

**Antes:**

```astro
<style>
  .titulo {
    font-size: 32px;
  }
  .descripcion {
    font-size: 18px;
  }
</style>
```

**Después:**

```astro
<h2 class="text-h2">Mi Título</h2>
<p class="text-body">Mi descripción</p>

<style>
  /* No necesita CSS de font-size */
</style>
```

### 2. Nuevos componentes

Simplemente usa las clases:

```astro
<h3 class="text-h3">Nuevo Componente</h3>
<p class="text-subtitle">Subtítulo del componente</p>
```

### 3. Estilos personalizados (si es necesario)

```astro
<style>
  .card-title {
    font-size: var(--text-h3-desktop);
    color: var(--brand-primary);
  }
</style>
```

---

## 📊 Ejemplo de Implementación Completa

```astro
---
// componente.astro
---

<section class="my-section">
  <h2 class="text-h2">Sección Principal</h2>
  <p class="text-subtitle">Descripción de la sección</p>

  <div class="card">
    <h3 class="text-h3">Título de Card</h3>
    <p class="text-body">Contenido principal del card</p>
    <p class="text-small">Información adicional</p>
  </div>
</section>

<style>
  .my-section {
    padding: 2rem;
  }

  .card {
    background: white;
    padding: 1rem;
    border-radius: 8px;
  }

  /* No necesita definir font-size,
     lo heredará de las clases text-h3, text-body, etc */
</style>
```

---

## ✨ Mantenimiento

Si necesitas cambiar la escala tipográfica en el futuro:

1. Abre `/public/css/common.css`
2. Modifica las variables en `:root`
3. ¡Listo! Se actualiza en todo el proyecto automáticamente

---

**Fecha de creación:** 5 de febrero de 2026  
**Estado:** Listo para implementar en todos los componentes 🚀
