# Rutas que pertenecen al trabajo de AutoTech Panel (producto 3, en silencio).
# Úsalas con stash-autotech-panel.ps1 y restore-autotech-panel.ps1

$script:AutotechPanelPaths = @(
  "docs/autotech-panel",
  "src/pages/panel.astro",
  "public/css/autotech-panel.css",
  "public/js/autotech-panel.js"
)

# Archivos mezclados (diseño + Panel). Revisar con `git add -p` si hace falta.
$script:AutotechPanelMixedPaths = @()
