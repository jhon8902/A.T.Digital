# Muestra que quedaria para commit SIN tocar AutoMatch (no commitea solo; tu apruebas).
# Uso: .\scripts\commit-design-only.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

. "$PSScriptRoot\automatch-paths.ps1"

$skip = [System.Collections.Generic.HashSet[string]]::new(
  [string[]]($AutomatchPaths + $AutomatchMixedPaths),
  [StringComparer]::OrdinalIgnoreCase
)

$all = git status --porcelain
$design = @()

foreach ($line in $all) {
  if ($line.Length -lt 4) { continue }
  $path = $line.Substring(3).Trim()
  if ($path -match ' -> ') {
    $path = ($path -split ' -> ')[0].Trim()
  }

  $skipPath = $false
  foreach ($automatchPath in $skip) {
    if ($path -eq $automatchPath -or $path.StartsWith("$automatchPath/") -or $path.StartsWith("$automatchPath\")) {
      $skipPath = $true
      break
    }
  }

  if (-not $skipPath) {
    $design += $path
  }
}

Write-Host "=== Cambios que SI entrarian en commit de DISENO ==="
if ($design.Count -eq 0) {
  Write-Host "(ninguno fuera de AutoMatch)"
} else {
  $design | Sort-Object -Unique | ForEach-Object { Write-Host "  $_" }
}

Write-Host ""
Write-Host "=== Excluidos (AutoMatch o archivos mezclados) ==="
$AutomatchPaths | ForEach-Object { Write-Host "  $_" }
$AutomatchMixedPaths | ForEach-Object { Write-Host "  $_  (mezclado)" }

Write-Host ""
Write-Host "Pasos recomendados:"
Write-Host "  1. .\scripts\stash-automatch.ps1"
Write-Host "  2. git add <archivos de diseño>"
Write-Host "  3. git commit -m 'tu mensaje'"
Write-Host "  4. .\scripts\restore-automatch.ps1   (cuando vuelvas a AutoMatch)"
