# PowerShell script to start the API server with proper environment loading
# This ensures .env file is always loaded correctly

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "Starting API Server with Airtable connection..." -ForegroundColor Green
Write-Host ""

# Load environment variables from .env file
if (Test-Path ".env") {
    Write-Host "✅ Found .env file" -ForegroundColor Green
    Get-Content .env | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
    Write-Host "✅ Environment variables loaded" -ForegroundColor Green
} else {
    Write-Host "⚠️  WARNING: .env file not found!" -ForegroundColor Yellow
    Write-Host "   Create .env file in server/ directory with:" -ForegroundColor Yellow
    Write-Host "   AIRTABLE_PERSONAL_ACCESS_TOKEN=your_token" -ForegroundColor Yellow
    Write-Host "   DATABASE_TYPE=airtable" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Starting server..." -ForegroundColor Cyan
Write-Host ""

# Start the server
npm run dev

