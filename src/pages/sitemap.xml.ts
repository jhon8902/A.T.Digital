import type { APIRoute } from "astro";
import { buildSitemapXml } from "../lib/sitemap-urls";

export const GET: APIRoute = async () => {
  try {
    const xml = await buildSitemapXml();
    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error generando sitemap.xml:", error);
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
      {
        status: 500,
        headers: { "Content-Type": "application/xml; charset=utf-8" },
      },
    );
  }
};
