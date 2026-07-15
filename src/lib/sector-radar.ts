export type SectorTrend = {
  tag: string;
  title: string;
  summary: string;
  date: string;
  metric: string;
};

export type SectorRadarEdition = {
  /** Identificador estable, p. ej. "2026-s1-jul" */
  id: string;
  /** Etiqueta visible en el archivo */
  label: string;
  /** Periodo que cubre el análisis */
  period: string;
  /** Fecha de publicación en el sitio (ISO) */
  publishedAt: string;
  preview: {
    title: string;
    summary: string;
  };
  hero: {
    description: string;
    stats: ReadonlyArray<{ value: string; label: string }>;
  };
  source: {
    label: string;
    text: string;
  };
  trends: SectorTrend[];
};

/**
 * Historial del Radar del sector.
 * Al actualizar: mover la edición activa al array `archive` y crear una nueva en `active`.
 */
const active: SectorRadarEdition = {
  id: "2026-s1-jul",
  label: "Julio 2026",
  period: "Primer semestre 2026",
  publishedAt: "2026-07-01",
  preview: {
    title: "El sector cerró el primer semestre con un repunte del 50,1%",
    summary:
      "157.620 matrículas, electrificados en 4 de cada 10 ventas y financiamiento verde al alza.",
  },
  hero: {
    description:
      "Balance Fenalco y ANDI (julio 2026): recuperación del mercado, boom de electrificados y señales de compra para el segundo semestre.",
    stats: [
      { value: "6", label: "focos activos" },
      { value: "S1", label: "2026 analizado" },
      { value: "Jul", label: "actualización" },
    ],
  },
  source: {
    label: "Fuente",
    text: "Informe conjunto Fenalco y ANDI (1 de julio de 2026). Matriculaciones según Runt; financiamiento según reportes bancarios públicos.",
  },
  trends: [
    {
      tag: "Mercado",
      title: "Repunte histórico en matrículas",
      summary:
        "157.620 vehículos nuevos entre enero y junio de 2026. Junio fue el mes más fuerte, con 29.038 registros.",
      date: "Jul 2026",
      metric: "+50,1% vs. 2025",
    },
    {
      tag: "Electromovilidad",
      title: "4 de cada 10 autos nuevos son electrificados",
      summary:
        "24.477 eléctricos matriculados (+235,5%) y 15,5% de cuota de mercado. Tesla supera las 10.000 unidades.",
      date: "Jul 2026",
      metric: "43,8% del total",
    },
    {
      tag: "Híbridos",
      title: "Casi un tercio del mercado",
      summary:
        "44.605 híbridos vendidos (+74,6%). Suzuki, Toyota y KIA lideran el segmento en el semestre.",
      date: "Jul 2026",
      metric: "28,3% de cuota",
    },
    {
      tag: "Financiamiento",
      title: "Crédito verde al alza",
      summary:
        "Mejores tasas impulsan la compra. El Banco de Bogotá desembolsó más de $112.000 millones en S1.",
      date: "Jun 2026",
      metric: "+61% crédito en junio",
    },
    {
      tag: "Flotas",
      title: "Renovación corporativa marca el ritmo",
      summary:
        "Flotas comerciales y mayor confianza del consumidor explican el repunte del mercado.",
      date: "Jul 2026",
      metric: "Meta: +250.000 u.",
    },
    {
      tag: "Infraestructura",
      title: "Carga rápida para logística eléctrica",
      summary:
        "Terpel, Ergenia y otros operadores amplían redes CCS2 y Tipo 2 en corredores clave.",
      date: "Jul 2026",
      metric: "Red en expansión",
    },
  ],
};

const archive: SectorRadarEdition[] = [
  {
    id: "2026-q1-feb",
    label: "Febrero 2026",
    period: "Tendencias Q1 2026",
    publishedAt: "2026-02-15",
    preview: {
      title: "Tendencias clave que estamos siguiendo esta semana",
      summary:
        "Electromovilidad, ADAS y lanzamientos locales con foco en Colombia.",
    },
    hero: {
      description:
        "Un resumen visual y editorial de lo que está moviendo la industria: tecnologías, regulaciones y señales de compra.",
      stats: [
        { value: "6", label: "focos activos" },
        { value: "12", label: "semanas de análisis" },
        { value: "2026", label: "actualización" },
      ],
    },
    source: {
      label: "Fuente",
      text: "Compilación editorial A.T. Digital (feb. 2026). Señales de mercado, normativa e infraestructura sin balance gremial único.",
    },
    trends: [
      {
        tag: "Electromovilidad",
        title: "Infraestructura de carga en ciudades intermedias",
        summary:
          "Crecen los proyectos de carga rápida en corredores urbanos y regionales, con nuevos actores privados.",
        date: "Feb 2026",
        metric: "+32% estaciones nuevas",
      },
      {
        tag: "ADAS",
        title: "Seguridad activa como estándar de compra",
        summary:
          "Los compradores priorizan frenado autónomo, mantenimiento de carril y sensores 360 en la comparación.",
        date: "Feb 2026",
        metric: "3 de cada 5 lo exige",
      },
      {
        tag: "Híbridos",
        title: "Mezcla ideal entre autonomía y costo",
        summary:
          "La adopción de híbridos sube en flotas y familias por ahorro en combustible y menor ansiedad de carga.",
        date: "Ene 2026",
        metric: "+18% en ventas",
      },
      {
        tag: "Normativa",
        title: "Incentivos locales para tecnologías limpias",
        summary:
          "Nuevos beneficios tributarios y facilidades de circulación impulsan la demanda de modelos electrificados.",
        date: "Ene 2026",
        metric: "4 ciudades con cambios",
      },
      {
        tag: "Conectividad",
        title: "Software definido para la experiencia a bordo",
        summary:
          "Los fabricantes integran actualizaciones OTA para mejorar rendimiento, entretenimiento y seguridad.",
        date: "Dic 2025",
        metric: "60% con OTA",
      },
      {
        tag: "Mercado",
        title: "Lanzamientos compactos para Colombia",
        summary:
          "El segmento compacto electrificado gana terreno con precios más accesibles y mayor disponibilidad.",
        date: "Dic 2025",
        metric: "+22% en consultas",
      },
    ],
  },
];

export const sectorRadarActive = active;
export const sectorRadarArchive = archive;

/** Compatibilidad con imports existentes (siempre la edición activa). */
export const sectorRadarTrends = active.trends;
export const sectorRadarPreview = active.preview;
export const sectorRadarHero = active.hero;
export const sectorRadarSource = active.source;
