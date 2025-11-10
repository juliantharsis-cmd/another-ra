# Initialize Git Repository for Another RA
# Run this AFTER installing Git

Write-Host "=== Initializing Git Repository ===" -ForegroundColor Green
Write-Host ""

# Check if Git is installed
try {
    $gitVersion = git --version 2>&1
    Write-Host "✅ Git is installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Git first:" -ForegroundColor Yellow
    Write-Host "  1. Download from: https://git-scm.com/download/win" -ForegroundColor White
    Write-Host "  2. Run the installer" -ForegroundColor White
    Write-Host "  3. Restart PowerShell" -ForegroundColor White
    Write-Host "  4. Run this script again" -ForegroundColor White
    exit 1
}

Write-Host ""

# Check if already initialized
if (Test-Path ".git") {
    Write-Host "⚠️  Git repository already initialized" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Current status:" -ForegroundColor Cyan
    git status --short
    Write-Host ""
    Write-Host "To create a new commit, run:" -ForegroundColor Yellow
    Write-Host "  git add ." -ForegroundColor White
    Write-Host "  git commit -m 'Your message'" -ForegroundColor White
    exit 0
}

# Initialize repository
Write-Host "Initializing Git repository..." -ForegroundColor Cyan
git init
Write-Host "✅ Repository initialized" -ForegroundColor Green
Write-Host ""

# Check configuration
$userName = git config user.name
$userEmail = git config user.email

if (-not $userName -or -not $userEmail) {
    Write-Host "⚠️  Git user configuration needed" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please run these commands:" -ForegroundColor Yellow
    Write-Host "  git config --global user.name 'Your Name'" -ForegroundColor White
    Write-Host "  git config --global user.email 'your.email@example.com'" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run this script again to create the first commit." -ForegroundColor Yellow
    exit 0
}

Write-Host "✅ Git configured as: $userName <$userEmail>" -ForegroundColor Green
Write-Host ""

# Stage all files
Write-Host "Staging all files..." -ForegroundColor Cyan
git add .
Write-Host "✅ Files staged" -ForegroundColor Green
Write-Host ""

# Show what will be committed
Write-Host "Files to be committed:" -ForegroundColor Cyan
git status --short
Write-Host ""

# Create initial commit
Write-Host "Creating initial commit..." -ForegroundColor Cyan
$commitMessage = "Initial commit: Another RA project with Companies page, pagination, and Airtable integration"
git commit -m $commitMessage

Write-Host ""
Write-Host "✅ Success! Repository initialized and first commit created!" -ForegroundColor Green
Write-Host ""
Write-Host "View your commit history:" -ForegroundColor Cyan
Write-Host "  git log --oneline" -ForegroundColor White
Write-Host ""
Write-Host "See detailed guide: VERSION_CONTROL_GUIDE.md" -ForegroundColor Cyan
Write-Host ""


