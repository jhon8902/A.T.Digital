# Rutas que pertenecen al trabajo de AutoMatch (carrusel, catálogo, find, CTAs de comparación).
# Úsalas con stash-automatch.ps1 y restore-automatch.ps1

$script:AutomatchPaths = @(
  "src/components/automatch",
  "src/lib/automatch-catalog.ts",
  "src/data/automatch",
  "public/data/automatch",
  "public/css/automatch-find.css",
  "public/css/automatch-cta.css",
  "public/js/automatch-v3.js",
  "public/js/automatch.js",
  "public/js/automatch-v2.js",
  "src/pages/automatch.astro",
  "src/pages/automatch-find.astro",
  "src/components/leads/AutoMatchCTA.astro"
)

# Archivos mezclados (diseño + AutoMatch). Revisar con `git add -p` si hace falta.
$script:AutomatchMixedPaths = @(
  "src/pages/index.astro",
  "src/pages/notas/[id].astro"
)
