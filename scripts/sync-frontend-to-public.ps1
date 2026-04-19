#Requires -Version 5.1
<#
.SYNOPSIS
  Mirrors the static SPA from Frontend/PropOS-Entreprise-main into Backend/public.

.DESCRIPTION
  Delegates to scripts/sync-frontend-to-public.js so behavior matches `npm run sync:public`.
  Run from anywhere:  pwsh -File scripts/sync-frontend-to-public.ps1
  Or from repo root:   .\scripts\sync-frontend-to-public.ps1
#>
$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
$js = Join-Path $here 'sync-frontend-to-public.js'
if (-not (Test-Path -LiteralPath $js)) {
  Write-Error "Not found: $js"
  exit 1
}
node $js
exit $LASTEXITCODE
