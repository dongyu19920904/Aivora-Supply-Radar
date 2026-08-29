param(
  [string]$ProjectRef = '',
  [string]$Repository = 'dongyu19920904/Aivora-Supply-Radar',
  [string]$LegacyApiUrl = 'https://supply.aivora.cn'
)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$cliPath = Join-Path $projectRoot 'node_modules\supabase\bin\supabase.exe'
if (-not (Test-Path -LiteralPath $cliPath -PathType Leaf)) {
  throw 'Supabase CLI binary not found. Run pnpm install first.'
}

if (-not $ProjectRef) {
  $parsedVariables = gh variable list --repo $Repository --json name,value | ConvertFrom-Json
  $variables = @($parsedVariables)
  $ProjectRef = ($variables | Where-Object { $_.name -eq 'SUPABASE_PROJECT_REF' } | Select-Object -First 1).value
}
if (-not $ProjectRef) { throw 'SUPABASE_PROJECT_REF is not configured.' }

$keyJson = (& $cliPath projects api-keys --project-ref $ProjectRef --output json | Out-String).Trim()
if ($LASTEXITCODE -ne 0) { throw 'Unable to obtain Supabase API keys.' }
$keys = $keyJson | ConvertFrom-Json
$serviceRoleKey = ($keys | Where-Object { $_.name -in @('service_role', 'legacy_service_role') } | Select-Object -First 1).api_key
if (-not $serviceRoleKey) { throw 'Supabase service_role key is unavailable.' }

$env:SUPABASE_URL = "https://$ProjectRef.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = $serviceRoleKey
$env:LEGACY_RADAR_API_URL = $LegacyApiUrl
try {
  & pnpm exec tsx (Join-Path $PSScriptRoot 'import-legacy-baseline.ts')
  if ($LASTEXITCODE -ne 0) { throw 'Legacy baseline import failed.' }
} finally {
  Remove-Item Env:\SUPABASE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:\SUPABASE_SERVICE_ROLE_KEY -ErrorAction SilentlyContinue
  Remove-Item Env:\LEGACY_RADAR_API_URL -ErrorAction SilentlyContinue
  $serviceRoleKey = $null
  $keyJson = $null
  $keys = $null
}
