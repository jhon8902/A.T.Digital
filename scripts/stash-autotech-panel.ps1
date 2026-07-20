# Guarda temporalmente los cambios de AutoTech Panel para commitear otra cosa.
# Uso: .\scripts\stash-autotech-panel.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

. "$PSScriptRoot\autotech-panel-paths.ps1"

$existing = @()
foreach ($path in $AutotechPanelPaths) {
  if (Test-Path $path) {
    $existing += $path
  }
}

if ($existing.Count -eq 0) {
  Write-Host "No hay rutas de AutoTech Panel para guardar en stash."
  exit 0
}

Write-Host "Guardando en stash (solo AutoTech Panel):"
$existing | ForEach-Object { Write-Host "  - $_" }

git stash push -u -m "wip: autotech-panel" -- @existing

Write-Host ""
Write-Host "Listo. Para recuperar: .\scripts\restore-autotech-panel.ps1"
