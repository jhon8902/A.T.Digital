# Vuelve a main desde AutoTech Panel.
# Uso: .\scripts\switch-from-autotech-panel.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

$dirty = git status --porcelain
if ($dirty) {
  Write-Host "Tienes cambios sin guardar. Haz commit o stash antes:"
  git status --short
  exit 1
}

git checkout main
Write-Host "Ahora estas en main (sitio editorial estable)."
