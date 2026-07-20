# Cambia a la rama de trabajo AutoTech Panel (producto 3, WIP privado).
# Uso: .\scripts\switch-to-autotech-panel.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

$dirty = git status --porcelain
if ($dirty) {
  Write-Host "Tienes cambios sin guardar. Haz commit o stash antes:"
  git status --short
  exit 1
}

$branch = git branch --list "feature/autotech-panel"
if (-not $branch) {
  Write-Host "La rama feature/autotech-panel no existe. Creala con:"
  Write-Host "  git checkout -b feature/autotech-panel"
  exit 1
}

git checkout feature/autotech-panel
Write-Host "Ahora estas en feature/autotech-panel (AutoTech Panel WIP)."
