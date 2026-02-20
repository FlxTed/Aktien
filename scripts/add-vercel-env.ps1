# Push env vars to Vercel (from .env or generate NEXTAUTH_SECRET).
# Run from repo root. Requires: npx vercel link (and login).

$ErrorActionPreference = "Continue"
$projectPath = Split-Path -Parent $PSScriptRoot
Set-Location $projectPath

$configPath = Join-Path $projectPath ".vercel\project.json"
if (-not (Test-Path $configPath)) {
  Write-Host "Run 'npx vercel link' first." -ForegroundColor Red
  exit 1
}

$config = Get-Content $configPath | ConvertFrom-Json
$env:VERCEL_ORG_ID = $config.orgId
$env:VERCEL_PROJECT_ID = $config.projectId

function Add-VercelEnv($name, $value, $targets) {
  if (-not $value -or $value.Length -eq 0) { return }
  $tmp = [System.IO.Path]::GetTempFileName()
  [System.IO.File]::WriteAllText($tmp, $value)
  foreach ($t in $targets) {
    $proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npx vercel env add $name $t --force --yes < `"$tmp`"" -WorkingDirectory $projectPath -PassThru -Wait -NoNewWindow
    if ($proc.ExitCode -eq 0) { Write-Host "  $name -> $t" -ForegroundColor Green }
  }
  Remove-Item $tmp -Force
}

# Parse .env (KEY=VALUE, optional quotes)
$envVars = @{}
$envFile = Join-Path $projectPath ".env"
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
      $key = $Matches[1]
      $val = $Matches[2].Trim().Trim('"').Trim("'")
      $envVars[$key] = $val
    }
  }
}

$targets = @("production", "preview")

Write-Host "Adding env vars to Vercel..." -ForegroundColor Cyan

# NEXTAUTH_URL (use production URL for Vercel)
$url = "https://aktien-six.vercel.app"
Add-VercelEnv "NEXTAUTH_URL" $url $targets

# NEXTAUTH_SECRET (from .env or generate)
$secret = $envVars["NEXTAUTH_SECRET"]
if (-not $secret -or $secret -match "generate-with|your-|example") {
  $secret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
  Write-Host "  Generated new NEXTAUTH_SECRET" -ForegroundColor Gray
}
Add-VercelEnv "NEXTAUTH_SECRET" $secret $targets

# DATABASE_URL (must be Postgres - from .env)
$dbUrl = $envVars["DATABASE_URL"]
if ($dbUrl -and ($dbUrl.StartsWith("postgresql://") -or $dbUrl.StartsWith("postgres://"))) {
  Add-VercelEnv "DATABASE_URL" $dbUrl $targets
} else {
  Write-Host "  DATABASE_URL not added (add a Postgres URL to .env or in Vercel dashboard)" -ForegroundColor Yellow
}

# FINNHUB_API_KEY
$finnhub = $envVars["FINNHUB_API_KEY"]
if ($finnhub -and $finnhub -notmatch "your-|example") {
  Add-VercelEnv "FINNHUB_API_KEY" $finnhub $targets
} else {
  Write-Host "  FINNHUB_API_KEY not added (add to .env or in Vercel dashboard)" -ForegroundColor Yellow
}

# OPENAI_API_KEY (for Finn AI analysis)
$openai = $envVars["OPENAI_API_KEY"]
if ($openai -and $openai.Length -gt 20 -and $openai -match "^sk-") {
  Add-VercelEnv "OPENAI_API_KEY" $openai $targets
} else {
  Write-Host "  OPENAI_API_KEY not added (add to .env or in Vercel dashboard for AI features)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Done. Redeploy to apply: vercel --prod" -ForegroundColor Green
Write-Host "To add DATABASE_URL / FINNHUB_API_KEY / OPENAI_API_KEY: put them in .env and run this script again, or add at:" -ForegroundColor Gray
Write-Host "  https://vercel.com/sitegen-studio/aktien/settings/environment-variables" -ForegroundColor Gray
