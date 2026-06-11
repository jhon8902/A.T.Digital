# Vuelve a main para trabajar diseño sin el WIP de AutoMatch.
# Uso: .\scripts\switch-to-design.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

$dirty = git status --porcelain
if ($dirty) {
  Write-Host "Tienes cambios sin guardar. Haz commit en feature/automatch antes:"
  git status --short
  exit 1
}

git checkout main
Write-Host "Ahora estas en main (diseño estable, AutoMatch version anterior)."
