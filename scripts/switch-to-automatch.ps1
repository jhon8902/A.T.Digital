# Cambia a la rama de trabajo AutoMatch (WIP completo).
# Uso: .\scripts\switch-to-automatch.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

$dirty = git status --porcelain
if ($dirty) {
  Write-Host "Tienes cambios sin guardar en main. Haz commit o stash antes:"
  git status --short
  exit 1
}

git checkout feature/automatch
Write-Host "Ahora estas en feature/automatch (AutoMatch + leads WIP)."
