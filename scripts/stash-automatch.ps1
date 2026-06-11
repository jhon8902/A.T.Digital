# Guarda temporalmente los cambios de AutoMatch para poder commitear solo diseño.
# Uso: .\scripts\stash-automatch.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

. "$PSScriptRoot\automatch-paths.ps1"

$existing = @()
foreach ($path in $AutomatchPaths) {
  if (Test-Path $path) {
    $existing += $path
  }
}

if ($existing.Count -eq 0) {
  Write-Host "No hay rutas de AutoMatch para guardar en stash."
  exit 0
}

Write-Host "Guardando en stash (solo AutoMatch):"
$existing | ForEach-Object { Write-Host "  - $_" }

git stash push -u -m "wip: automatch" -- @existing

Write-Host ""
Write-Host "Listo. Los cambios de AutoMatch quedaron en stash."
Write-Host "Ahora puedes commitear el resto (diseño, header, CSS, etc.)."
Write-Host ""
Write-Host "Archivos mezclados (revisar manualmente si los tocaste):"
$AutomatchMixedPaths | ForEach-Object { Write-Host "  - $_" }
Write-Host "  Usa: git add -p ruta/archivo   para incluir solo lineas de diseño"
Write-Host ""
Write-Host "Para recuperar AutoMatch despues: .\scripts\restore-automatch.ps1"
