# Recupera el stash de AutoTech Panel.
# Uso: .\scripts\restore-autotech-panel.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

$stash = git stash list | Select-String "wip: autotech-panel" | Select-Object -First 1
if (-not $stash) {
  Write-Host "No hay stash de AutoTech Panel."
  exit 0
}

git stash pop
Write-Host "AutoTech Panel restaurado desde stash."
