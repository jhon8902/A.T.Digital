import {
  getNotePublishDate,
  parseScheduledAt,
} from "./note-scheduling";

export const SITE_URL = "https://autotechdigital.com";
export const ORG_NAME = "Auto-Tech-Digital";

type NoteForSeo = {
  id: number;
  title: string;
  subtitle?: string | null;
  editor?: string | null;
  category?: string | null;
  content?: string | null;
  created_at?: string | null;
  scheduled_at?: string | null;
};

export function toAbsoluteUrl(
  pathOrUrl: string | null | undefined,
  siteUrl = SITE_URL,
): string | undefined {
  if (!pathOrUrl) return undefined;
  const cleaned = String(pathOrUrl).trim();
  if (!cleaned) return undefined;
  if (/^https?:\/\//i.test(cleaned)) return cleaned;
  const path = cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
  return new URL(path, siteUrl).href;
}

export function toIsoDateTime(value: unknown): string | undefined {
  const date = parseScheduledAt(value);
  return date ? date.toISOString() : undefined;
}

export function buildOrganizationJsonLd(siteUrl = SITE_URL) {
  return {
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: ORG_NAME,
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl}/img/og-default.webp`,
    },
    sameAs: ["https://twitter.com/autotechdigital"],
  };
}

export function buildNewsArticleJsonLd(options: {
  note: NoteForSeo;
  siteUrl?: string;
  description?: string;
  coverImage?: string | null;
  headline?: string;
}) {
  const siteUrl = options.siteUrl ?? SITE_URL;
  const publishDate = getNotePublishDate(options.note);
  const datePublished = publishDate?.toISOString();
  const dateModified =
    toIsoDateTime(options.note.scheduled_at) ??
    toIsoDateTime(options.note.created_at) ??
    datePublished;
  const authorName =
    (options.note.editor && String(options.note.editor).trim()) ||
    "Jhon Aparicio";
  const pageUrl = `${siteUrl}/notas/${options.note.id}`;
  const imageUrl = toAbsoluteUrl(options.coverImage ?? undefined, siteUrl);

  const article: Record<string, unknown> = {
    "@type": "NewsArticle",
    "@id": `${pageUrl}#article`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
    headline: options.headline || options.note.title,
    description:
      options.description ||
      options.note.subtitle ||
      options.note.title,
    inLanguage: "es-CO",
    isAccessibleForFree: true,
    author: {
      "@type": "Person",
      name: authorName,
    },
    publisher: {
      "@id": `${siteUrl}/#organization`,
    },
    url: pageUrl,
  };

  if (datePublished) article.datePublished = datePublished;
  if (dateModified) article.dateModified = dateModified;
  if (imageUrl) {
    article.image = [imageUrl];
  }
  if (options.note.category) {
    article.articleSection = String(options.note.category);
  }

  return article;
}

export function buildPageJsonLd(
  items: Array<Record<string, unknown>>,
  siteUrl = SITE_URL,
) {
  return {
    "@context": "https://schema.org",
    "@graph": [buildOrganizationJsonLd(siteUrl), ...items],
  };
}
