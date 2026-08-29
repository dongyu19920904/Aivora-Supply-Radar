param(
  [Parameter(Mandatory = $true)]
  [string]$OrganizationId,
  [string]$ProjectName = 'aivora-supply-radar-v2',
  [string]$Region = 'ap-southeast-1',
  [string]$Repository = 'dongyu19920904/Aivora-Supply-Radar',
  [string]$DeploymentRepository = 'dongyu19920904/CloudFlare-AI-Insight-Daily'
)

$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$cliPath = Join-Path $projectRoot 'node_modules\supabase\bin\supabase.exe'
if (-not (Test-Path -LiteralPath $cliPath -PathType Leaf)) {
  throw 'Supabase CLI binary not found. Run pnpm install first.'
}

function Invoke-SupabaseJson {
  param([string[]]$Arguments)

  $jsonText = (& $cliPath @Arguments --output json | Out-String).Trim()
  if ($LASTEXITCODE -ne 0) {
    throw "Supabase CLI failed: $($Arguments -join ' ')"
  }
  # Windows PowerShell 5.1 preserves ConvertFrom-Json arrays as one pipeline
  # object when returned directly from a function. Assign first so callers see
  # individual projects instead of aggregated array-valued properties.
  $parsed = $jsonText | ConvertFrom-Json
  return $parsed
}

function New-RandomSecret {
  param([int]$Bytes = 36)

  $randomBytes = New-Object byte[] $Bytes
  $generator = [Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $generator.GetBytes($randomBytes)
    return ([Convert]::ToBase64String($randomBytes) -replace '[+/=]', 'A') + '!a1'
  } finally {
    $generator.Dispose()
  }
}

function Test-SupabaseApi {
  param(
    [string]$ProjectUrl,
    [string]$AnonKey
  )

  $headers = @{
    apikey = $AnonKey
    Authorization = "Bearer $AnonKey"
  }
  $catalogResponse = Invoke-WebRequest `
    -Uri "$ProjectUrl/rest/v1/product_catalog?select=id&limit=1" `
    -Headers $headers `
    -Method Get `
    -UseBasicParsing
  if ($catalogResponse.StatusCode -ne 200) {
    throw "Supabase catalog smoke test returned HTTP $($catalogResponse.StatusCode)."
  }

  $summaryResponse = Invoke-WebRequest `
    -Uri "$ProjectUrl/rest/v1/rpc/get_product_catalog_summary" `
    -Headers $headers `
    -Method Post `
    -ContentType 'application/json' `
    -Body '{}' `
    -UseBasicParsing
  if ($summaryResponse.StatusCode -ne 200) {
    throw "Supabase summary RPC smoke test returned HTTP $($summaryResponse.StatusCode)."
  }

  Write-Output 'Supabase REST and summary RPC smoke tests passed (HTTP 200).'
}

$existingProjects = @(Invoke-SupabaseJson -Arguments @('projects', 'list'))
$project = $existingProjects | Where-Object { $_.name -eq $ProjectName } | Select-Object -First 1
$databasePassword = $null
$projectRef = $null
$projectUrl = $null
$recoveryStateStored = $false

if (-not $project) {
  $databasePassword = New-RandomSecret
  Write-Output "Creating the organization's default free project '$ProjectName' in $Region..."
  & $cliPath projects create $ProjectName `
    --org-id $OrganizationId `
    --db-password $databasePassword `
    --region $Region `
    --yes
  if ($LASTEXITCODE -ne 0) {
    throw 'Supabase project creation failed. No migration or deployment was attempted.'
  }

  for ($attempt = 1; $attempt -le 36; $attempt++) {
    $existingProjects = @(Invoke-SupabaseJson -Arguments @('projects', 'list'))
    $project = $existingProjects | Where-Object { $_.name -eq $ProjectName } | Select-Object -First 1
    if ($project -and -not $recoveryStateStored) {
      $projectRef = if ($project.ref) { $project.ref } else { $project.id }
      $projectUrl = "https://$projectRef.supabase.co"
      $databasePassword | gh secret set SUPABASE_DB_PASSWORD --repo $Repository
      if ($LASTEXITCODE -ne 0) { throw 'Unable to store SUPABASE_DB_PASSWORD.' }
      gh variable set SUPABASE_PROJECT_REF --repo $Repository --body $projectRef
      gh variable set NEXT_PUBLIC_SUPABASE_URL --repo $Repository --body $projectUrl
      $recoveryStateStored = $true
      Write-Output 'Stored the database recovery state before waiting for project health.'
    }
    if ($project -and $project.status -in @('ACTIVE', 'ACTIVE_HEALTHY')) { break }
    Write-Output "Waiting for Supabase project health ($attempt/36)..."
    Start-Sleep -Seconds 10
  }

  if (-not $project -or $project.status -notin @('ACTIVE', 'ACTIVE_HEALTHY')) {
    throw 'Supabase project did not become healthy within six minutes.'
  }
} else {
  throw "Project '$ProjectName' already exists. Refusing to guess its database password."
}

$projectRef = if ($projectRef) { $projectRef } elseif ($project.ref) { $project.ref } else { $project.id }
$projectUrl = if ($projectUrl) { $projectUrl } else { "https://$projectRef.supabase.co" }

# Store the generated database password before applying migrations so a later
# recovery can be performed without exposing it in logs.
if (-not $recoveryStateStored) {
  $databasePassword | gh secret set SUPABASE_DB_PASSWORD --repo $Repository
  if ($LASTEXITCODE -ne 0) { throw 'Unable to store SUPABASE_DB_PASSWORD.' }
  gh variable set SUPABASE_PROJECT_REF --repo $Repository --body $projectRef
  gh variable set NEXT_PUBLIC_SUPABASE_URL --repo $Repository --body $projectUrl
}

& $cliPath link --project-ref $projectRef --password $databasePassword --yes
if ($LASTEXITCODE -ne 0) { throw 'Unable to link the new Supabase project.' }

Write-Output 'Applying database migrations...'
& $cliPath db push --include-all --password $databasePassword --yes
if ($LASTEXITCODE -ne 0) { throw 'Database migration failed.' }

$apiKeys = @(Invoke-SupabaseJson -Arguments @('projects', 'api-keys', '--project-ref', $projectRef))
$anonKey = ($apiKeys | Where-Object { $_.name -in @('anon', 'legacy_anon') } | Select-Object -First 1).api_key
$serviceRoleKey = ($apiKeys | Where-Object { $_.name -in @('service_role', 'legacy_service_role') } | Select-Object -First 1).api_key
if (-not $anonKey -or -not $serviceRoleKey) {
  throw 'Supabase did not return the required legacy anon/service_role keys.'
}

Test-SupabaseApi -ProjectUrl $projectUrl -AnonKey $anonKey

$adminPassword = New-RandomSecret -Bytes 24
$adminSessionSecret = New-RandomSecret -Bytes 48

$anonKey | gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY --repo $Repository
$serviceRoleKey | gh secret set SUPABASE_SERVICE_ROLE_KEY --repo $Repository
$adminPassword | gh secret set ADMIN_PASSWORD --repo $Repository
$adminSessionSecret | gh secret set ADMIN_SESSION_SECRET --repo $Repository

$anonKey | gh secret set SUPPLY_V2_SUPABASE_ANON_KEY --repo $DeploymentRepository
$serviceRoleKey | gh secret set SUPPLY_V2_SUPABASE_SERVICE_ROLE_KEY --repo $DeploymentRepository
$adminPassword | gh secret set SUPPLY_V2_ADMIN_PASSWORD --repo $DeploymentRepository
$adminSessionSecret | gh secret set SUPPLY_V2_ADMIN_SESSION_SECRET --repo $DeploymentRepository
gh variable set SUPPLY_V2_SUPABASE_URL --repo $DeploymentRepository --body $projectUrl
gh variable set SUPPLY_V2_PROJECT_REF --repo $DeploymentRepository --body $projectRef

$databasePassword = $null
$anonKey = $null
$serviceRoleKey = $null
$adminPassword = $null
$adminSessionSecret = $null

Write-Output "Supabase project ready: $ProjectName ($projectRef, $Region)"
Write-Output 'Migrations and GitHub secret configuration completed.'
