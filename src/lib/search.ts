export interface SearchEntry {
  title: string;
  description: string;
  href: string;
  category: string;
  type: "seccion" | "pagina" | "nota";
  keywords?: string[];
}

interface NoteLike {
  id: number | string;
  title?: string;
  subtitle?: string;
  category?: string;
  content?: string;
}

export const STATIC_SEARCH_ENTRIES: SearchEntry[] = [
  {
    title: "Inicio",
    description: "Portada principal de Auto-Tech-Digital.",
    href: "/#inicio",
    category: "general",
    type: "seccion",
    keywords: ["home", "portada", "inicio"],
  },
  {
    title: "Noticias",
    description: "Noticias y actualidad del sector automotor.",
    href: "/noticias",
    category: "noticias",
    type: "seccion",
    keywords: ["actualidad", "marcas", "novedades"],
  },
  {
    title: "Lanzamientos",
    description: "Nuevos modelos y presentaciones del mercado.",
    href: "/lanzamientos",
    category: "lanzamientos",
    type: "seccion",
    keywords: ["estrenos", "nuevos autos"],
  },
  {
    title: "Hibridos",
    description: "Contenido editorial sobre vehiculos hibridos.",
    href: "/hibridos",
    category: "hibridos",
    type: "seccion",
    keywords: ["hibridos", "hev", "phev"],
  },
  {
    title: "Electricos",
    description: "Seccion dedicada a autos y tecnologia electrica.",
    href: "/electricos",
    category: "electricos",
    type: "seccion",
    keywords: ["electricos", "bev", "ev"],
  },
  {
    title: "Deportes",
    description: "Automovilismo, motociclismo y alto rendimiento.",
    href: "/deportes",
    category: "deportes",
    type: "seccion",
    keywords: ["deportes", "motociclismo", "f1"],
  },
  {
    title: "Pruebas",
    description: "Pruebas de manejo y analisis editoriales.",
    href: "/pruebas",
    category: "pruebas",
    type: "seccion",
    keywords: ["test drive", "review", "pruebas"],
  },
  {
    title: "AutoMatch",
    description: "Herramienta para encontrar el auto ideal.",
    href: "/automatch-find",
    category: "automatch",
    type: "pagina",
    keywords: ["automatch", "comparador", "buscador de auto"],
  },
  {
    title: "Registro",
    description: "Formulario de registro y contacto editorial.",
    href: "/registro",
    category: "registro",
    type: "pagina",
    keywords: ["registro", "suscripcion", "suscripcion", "newsletter", "contacto"],
  },
  {
    title: "Ford Bronco: la ultima apuesta todoterreno.",
    description: "Innovaciones en diseno, seguridad y desempeno off-road.",
    href: "/noticias-carrusel/noticia-ford",
    category: "noticias",
    type: "nota",
    keywords: ["ford", "bronco", "todoterreno"],
  },
  {
    title: "Audi E-TRON: el SUV electrico mas elegante de la marca.",
    description: "Lujo electrico con enfoque en tecnologia y confort.",
    href: "/noticias-carrusel/noticia-audi",
    category: "noticias",
    type: "nota",
    keywords: ["audi", "etron", "suv electrico"],
  },
  {
    title: "BMW Concept XM: el futuro del lujo y la potencia hibrida.",
    description: "Diseno conceptual con alto rendimiento y ADN deportivo.",
    href: "/noticias-carrusel/noticia-bmw-concept",
    category: "noticias",
    type: "nota",
    keywords: ["bmw", "concept xm", "lujo"],
  },
  {
    title: "BMW Serie 5: poderoso y ahora electrificado.",
    description: "Eficiencia y desempeno en la nueva generacion del modelo.",
    href: "/noticias-carrusel/noticia-bmw",
    category: "noticias",
    type: "nota",
    keywords: ["bmw serie 5", "electrificado"],
  },
  {
    title: "DFSK E5: la hibrida para 7 pasajeros en Colombia.",
    description: "Una propuesta familiar con buen equipamiento y espacio.",
    href: "/noticias-carrusel/noticia-dfsk",
    category: "noticias",
    type: "nota",
    keywords: ["dfsk", "seres e5", "7 pasajeros"],
  },
  {
    title: "Adrenalina sobre ruedas",
    description: "Cobertura de motociclismo y automovilismo de alto nivel.",
    href: "/notas-deportes/nota-deportes-motos",
    category: "deportes",
    type: "nota",
    keywords: ["deportes", "motos", "automovilismo"],
  },
  {
    title: "Maquinas de alto rendimiento",
    description: "Ingenieria extrema aplicada a la velocidad y la pista.",
    href: "/notas-deportes/nota-deportes1",
    category: "deportes",
    type: "nota",
    keywords: ["alto rendimiento", "velocidad", "pista"],
  },
  {
    title: "Tecnologia de ultima generacion",
    description: "Materiales, telemetria y evolucion tecnica en competencia.",
    href: "/notas-deportes/nota-deportes2",
    category: "deportes",
    type: "nota",
    keywords: ["tecnologia", "telemetria", "competencia"],
  },
];

export function normalizeSearchText(value: string | undefined): string {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getEntryHaystack(entry: SearchEntry): string {
  return normalizeSearchText(
    [entry.title, entry.description, entry.category, ...(entry.keywords || [])].join(" "),
  );
}

export function scoreSearchEntry(query: string, entry: SearchEntry): number {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return 0;

  const title = normalizeSearchText(entry.title);
  const description = normalizeSearchText(entry.description);
  const category = normalizeSearchText(entry.category);
  const haystack = getEntryHaystack(entry);
  const tokens = normalizedQuery.split(" ").filter(Boolean);

  let score = 0;

  if (title === normalizedQuery) score += 140;
  if (title.startsWith(normalizedQuery)) score += 100;
  if (title.includes(normalizedQuery)) score += 70;
  if (description.includes(normalizedQuery)) score += 35;
  if (category.includes(normalizedQuery)) score += 20;
  if (haystack.includes(normalizedQuery)) score += 15;

  for (const token of tokens) {
    if (title.startsWith(token)) score += 18;
    if (title.includes(token)) score += 12;
    if (description.includes(token)) score += 6;
    if (category.includes(token)) score += 5;
    if (haystack.includes(token)) score += 3;
  }

  return score;
}

export function filterSearchEntries(
  query: string,
  entries: SearchEntry[],
  limit: number = 24,
): SearchEntry[] {
  const seen = new Set<string>();

  return entries
    .map((entry) => ({ entry, score: scoreSearchEntry(query, entry) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title))
    .map(({ entry }) => entry)
    .filter((entry) => {
      if (seen.has(entry.href)) return false;
      seen.add(entry.href);
      return true;
    })
    .slice(0, limit);
}

function stripHtml(value: string | undefined): string {
  return (value || "")
    .replace(/<br\s*\/?\s*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function mapNoteToSearchEntry(note: NoteLike): SearchEntry {
  const description =
    note.subtitle?.trim() ||
    stripHtml(note.content).slice(0, 180) ||
    "Nota editorial de Auto-Tech-Digital.";

  return {
    title: note.title?.trim() || "Nota sin titulo",
    description,
    href: `/notas/${note.id}`,
    category: note.category?.trim() || "general",
    type: "nota",
    keywords: [note.category || "", note.subtitle || ""],
  };
}