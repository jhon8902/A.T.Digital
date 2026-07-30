/** Máximo de tarjetas por carrusel en el home (noticias, filtros, pruebas). */
export const HOME_CAROUSEL_LIMIT = 6;

/** Reservado (antes: nota destacada split). Vista "Todas" usa solo tarjetas. */
export const HOME_NEWS_HERO_COUNT = 0;
/** Tarjetas del carrusel principal en vista "Todas". */
export const HOME_NEWS_CAROUSEL_LIMIT = HOME_CAROUSEL_LIMIT;
/** Notas a omitir en /noticias (hero + carrusel del home). */
export const HOME_NEWS_ARCHIVE_SKIP =
  HOME_NEWS_HERO_COUNT + HOME_NEWS_CAROUSEL_LIMIT;

/** Pool cargado en SSR para filtros Nacional/Internacional (más notas en DOM, scroll). */
export const HOME_NEWS_POOL_SIZE = 20;
/** @deprecated Usar HOME_NEWS_CAROUSEL_LIMIT por alcance en el carrusel filtrado. */
export const HOME_NEWS_SCOPE_POOL_SIZE = HOME_CAROUSEL_LIMIT * 2;

/** Episodios visibles en el carrusel de Pruebas (home). */
export const HOME_PRUEBAS_HOME_LIMIT = HOME_CAROUSEL_LIMIT;

/** Tarjetas en grilla del home — Eléctricos. */
export const HOME_ELECTRICOS_HOME_LIMIT = 3;
/** @deprecated Usar HOME_ELECTRICOS_HOME_LIMIT */
export const HOME_ELECTRICOS_CAROUSEL_LIMIT = HOME_ELECTRICOS_HOME_LIMIT;
export const HOME_ELECTRICOS_ARCHIVE_SKIP = HOME_ELECTRICOS_HOME_LIMIT;

/** Tarjetas en grilla del home — Híbridos. */
export const HOME_HIBRIDOS_HOME_LIMIT = 3;
/** @deprecated Usar HOME_HIBRIDOS_HOME_LIMIT */
export const HOME_HIBRIDOS_CAROUSEL_LIMIT = HOME_HIBRIDOS_HOME_LIMIT;
export const HOME_HIBRIDOS_ARCHIVE_SKIP = HOME_HIBRIDOS_HOME_LIMIT;
