# Recupera el ultimo stash de AutoMatch.
# Uso: .\scripts\restore-automatch.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

$stash = git stash list | Select-String "wip: automatch" | Select-Object -First 1

if (-not $stash) {
  Write-Host "No hay stash con mensaje 'wip: automatch'."
  Write-Host "Stashes disponibles:"
  git stash list
  exit 1
}

Write-Host "Recuperando: $stash"
git stash pop

Write-Host "AutoMatch restaurado. Si hay conflictos, resuelvelos y luego git add."
