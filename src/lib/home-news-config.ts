/** Cuántas notas muestra el home en la sección Sector automotor. */
export const HOME_NEWS_HERO_COUNT = 1;
/** Slides del carrusel hero en vista "Todas" (incluye la destacada). */
export const HOME_NEWS_CAROUSEL_LIMIT = 7;
/** Notas a omitir en /noticias (hero + carrusel del home). */
export const HOME_NEWS_ARCHIVE_SKIP =
  HOME_NEWS_HERO_COUNT + HOME_NEWS_CAROUSEL_LIMIT;

/** Pool cargado en SSR para filtros Nacional/Internacional (más notas en DOM, scroll). */
export const HOME_NEWS_POOL_SIZE = 20;
/** Notas en el carrusel de tarjetas al filtrar por alcance (incluye nacionales más antiguas). */
export const HOME_NEWS_SCOPE_POOL_SIZE = 40;

/** Carrusel de la sección Eléctricos en home. */
export const HOME_ELECTRICOS_CAROUSEL_LIMIT = 7;
export const HOME_ELECTRICOS_ARCHIVE_SKIP = HOME_ELECTRICOS_CAROUSEL_LIMIT;

/** Carrusel de la sección Híbridos en home. */
export const HOME_HIBRIDOS_CAROUSEL_LIMIT = 7;
export const HOME_HIBRIDOS_ARCHIVE_SKIP = HOME_HIBRIDOS_CAROUSEL_LIMIT;
