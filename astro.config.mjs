import { defineConfig } from "astro/config";
import netlify from "@astrojs/netlify";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://autotechdigital.netlify.app",
  output: "server",
  adapter: netlify(),
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes("/admin") &&
        !page.includes("/api/") &&
        !page.includes("/.netlify/"),
    }),
  ],
});







