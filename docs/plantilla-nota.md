# 📋 Plantilla Editorial — A.T. Digital

Usa esta plantilla como guía cada vez que vayas a crear una nota nueva en el formulario.
Los campos del formulario corresponden exactamente a las secciones de abajo.

---

## CAMPO: Título

```
[Marca] [Modelo] [Año]: [gancho que dé ganas de leer]
```

El gancho genera **expectativa**, no un catálogo de cifras. El lector tiene que querer entrar al artículo.

**Ejemplo:**

```
Aston Martin Valen 2027: 113 años y jamás había soltado un V12 como este
```

---

## CAMPO: Subtítulo

Una sola oración que amplíe el titular. Máximo 150 caracteres.

**Ejemplo:**

```
La berlina compacta de CUPRA llega renovada con más autonomía y tecnología de última generación.
```

---

## CAMPO: Categoría

| Categoría      | Cuándo usarla                                     |
| -------------- | ------------------------------------------------- |
| `electricos`   | Autos 100 % eléctricos (BEV)                      |
| `hibridos`     | Híbridos enchufables (PHEV) o suaves (MHEV/HEV)   |
| `deportes`     | Autos deportivos, supercar, competición           |
| `noticias`     | Noticias de marca, lanzamientos mundiales, recall |
| `pruebas`      | Pruebas/tests de manejo propios de A.T. Digital   |
| `lanzamientos` | Presentaciones oficiales en Colombia o región     |

---

## CAMPO: Contenido

El texto se divide en **5 bloques** separados por una **línea en blanco**.
Cada bloque empieza con `Título: … |` y se convierte en un bloque editorial aparte.

**Modelo de edición (todas las notas nuevas):** Aston Martin Valen 2027 — claro, sin inglés suelto, sin repetir el gancho del titular.

### Estructura (5 bloques)

```
Título: [Idea que el subtítulo no dijo] |
[3–4 oraciones. Ampliar: quién lo hace, nombre, precio o contexto. No repetir el gancho del título ni el listado del subtítulo.]

Título: [Diseño / carrocería] |
[Dato concreto. Carrocería, no «piel». Baúl «es de» X litros. Sin metáforas vacías.]

Título: [Interior / puestos] |
[Puestos, no filas. Nombres de asientos o modos: español primero, marca entre paréntesis.]

Título: [Motor / cifras] |
[hp y km/h. Si la marca no dio 0-100, decir qué midió. «Velocidad máxima», no «techo». «Pesa X kg menos», no «recorta».]

Título: [Cierre que coincida con la última frase] |
[Hecho confirmado. En deportes: emocional + dato. Si no hay manual, explicar el beneficio de esa caja para la categoría. Si el auto no llega a Colombia, no cerrar con «no hay fecha ni precio aquí».]
```

> **Tip:** Un dato ancla (hp, unidades, «el más…») como mucho **dos veces** en toda la nota.  
> **Tip:** No uses HTML en este campo; solo texto plano y una línea en blanco entre bloques.  
> **Tip:** El detalle fino (versiones, rivales, cargas) va al **resumen técnico**, no al párrafo.

---

## CAMPO: Imágenes (URLs)

| Campo    | Rol en la nota publicada                        | Proporción recomendada |
| -------- | ----------------------------------------------- | ---------------------- |
| Imagen 1 | **Portada principal** (aparece arriba del todo) | 16:9 horizontal        |
| Imagen 2 | Bloque interior / detallado segunda sección     | 16:9 o 4:3             |
| Imagen 3 | Detalle diseño / rueda / faros                  | 1:1 o 4:3              |
| Imagen 4 | Interior / cockpit                              | 16:9                   |
| Imagen 5 | Foto de acción / dinámica                       | 16:9                   |

**Fuentes gratuitas de imágenes en alta calidad:**

- https://unsplash.com — busca la marca + modelo
- https://www.pexels.com
- URLs oficiales del fabricante (sala de prensa)

**Ejemplo de URL válida:**

```
https://images.unsplash.com/photo-1617814075967-3b6e5b4e6e97?w=1200&q=80
```

---

## CAMPO: Videos (opcional)

Ruta relativa al video dentro del proyecto, o URL externa.

**Ejemplos:**

```
../img/videos-pruebas/cupra-born-prueba.mp4
https://www.youtube.com/watch?v=XXXXXXXXXXX
```

---

## CAMPO: Resumen técnico

Los **párrafos** de contenido van en lenguaje claro; el **resumen técnico** concentra los datos para comparar: precio, motor, versiones, autonomía, rivales, pros/contras.

En notas **nacionales** con modelo real en Colombia, el resumen es prácticamente obligatorio. Solo completa lo confirmado; los campos vacíos no se publican.

Puedes pegar el bloque del asistente (`spec_campo: valor`, una línea por campo) en **Importar resumen técnico** del formulario.

Campos principales: segmento, precio estimado, versiones, origen, motorización, potencia, torque, batería/autonomía, carga, 0–100, tracción, seguridad, equipamiento, pros, contras, competidores, precio COP.

---

## Checklist antes de publicar

- [ ] Título tiene marca, modelo, año y un gancho que da ganas de leer
- [ ] Subtítulo ≤ 150 caracteres y no se copia entero en el bloque 1
- [ ] Contenido: 5 bloques `Título: … |` separados por línea en blanco
- [ ] Sin mph u otro inglés sin traducir; hp, no cv; siglas de taller explicadas la primera vez
- [ ] El título del bloque 5 coincide con la última frase
- [ ] Si no llega a Colombia, el cierre es un dato curioso, no la ausencia local
- [ ] En `deportes`, el cierre es emocional y, si aplica, explica el beneficio de la transmisión
- [ ] Imagen 1 cargada (es la portada)
- [ ] Categoría correcta según la tabla
- [ ] Resumen técnico completo si es nota nacional con modelo real
- [ ] Revisión ortográfica rápida

---

ADN vivo (prompt maestro): `docs/prompt-maestro-editorial.md`.

_Plantilla A.T. Digital — actualizada agosto 2026 (ADN v1, post Valen)_
