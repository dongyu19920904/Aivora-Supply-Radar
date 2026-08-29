param(
  [string]$ProjectRef = '',
  [string]$Repository = 'dongyu19920904/Aivora-Supply-Radar'
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
$anonKey = ($keys | Where-Object { $_.name -in @('anon', 'legacy_anon') } | Select-Object -First 1).api_key
$serviceRoleKey = ($keys | Where-Object { $_.name -in @('service_role', 'legacy_service_role') } | Select-Object -First 1).api_key
if (-not $anonKey -or -not $serviceRoleKey) { throw 'Required Supabase API keys are unavailable.' }

$env:SUPABASE_URL = "https://$ProjectRef.supabase.co"
$env:SUPABASE_ANON_KEY = $anonKey
$env:SUPABASE_SERVICE_ROLE_KEY = $serviceRoleKey
try {
  & pnpm exec tsx (Join-Path $PSScriptRoot 'audit-supabase-snapshot.ts')
  if ($LASTEXITCODE -ne 0) { throw 'Supabase snapshot audit failed.' }
} finally {
  Remove-Item Env:\SUPABASE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:\SUPABASE_ANON_KEY -ErrorAction SilentlyContinue
  Remove-Item Env:\SUPABASE_SERVICE_ROLE_KEY -ErrorAction SilentlyContinue
  $anonKey = $null
  $serviceRoleKey = $null
  $keyJson = $null
  $keys = $null
}
