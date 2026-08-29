param(
  [Parameter(Mandatory = $true)]
  [string]$Executable,
  [string]$ChildArgument = '',
  [string]$ProjectRef = '',
  [string]$Repository = 'dongyu19920904/Aivora-Supply-Radar'
)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$cliPath = Join-Path $projectRoot 'node_modules\supabase\bin\supabase.exe'
if (-not (Test-Path -LiteralPath $cliPath -PathType Leaf)) {
  throw 'Supabase CLI binary not found. Run pnpm install first.'
}
if (-not $Executable) { throw 'A child executable is required.' }

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

$randomBytes = New-Object byte[] 48
$generator = [Security.Cryptography.RandomNumberGenerator]::Create()
$generator.GetBytes($randomBytes)
$buildSessionSecret = [Convert]::ToBase64String($randomBytes)
$generator.Dispose()

$env:NEXT_PUBLIC_SITE_URL = 'https://supply.aivora.cn'
$env:NEXT_PUBLIC_SUPABASE_URL = "https://$ProjectRef.supabase.co"
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = $anonKey
$env:SUPABASE_SERVICE_ROLE_KEY = $serviceRoleKey
$env:ADMIN_PASSWORD = 'build-only-placeholder'
$env:ADMIN_SESSION_SECRET = $buildSessionSecret
try {
  if ($ChildArgument) {
    & $Executable $ChildArgument
  } else {
    & $Executable
  }
  if ($LASTEXITCODE -ne 0) { throw "Child command failed: $Executable" }
} finally {
  Remove-Item Env:\NEXT_PUBLIC_SITE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:\NEXT_PUBLIC_SUPABASE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:\NEXT_PUBLIC_SUPABASE_ANON_KEY -ErrorAction SilentlyContinue
  Remove-Item Env:\SUPABASE_SERVICE_ROLE_KEY -ErrorAction SilentlyContinue
  Remove-Item Env:\ADMIN_PASSWORD -ErrorAction SilentlyContinue
  Remove-Item Env:\ADMIN_SESSION_SECRET -ErrorAction SilentlyContinue
  $anonKey = $null
  $serviceRoleKey = $null
  $buildSessionSecret = $null
  $randomBytes = $null
  $keyJson = $null
  $keys = $null
}
