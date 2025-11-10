# Git Setup Script for Another RA Project
# Run this script to initialize Git and create your first commit

Write-Host "=== Git Setup for Another RA ===" -ForegroundColor Green
Write-Host ""

# Check if Git is installed
try {
    $gitVersion = git --version
    Write-Host "✅ Git is installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Git from: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host "After installation, restart PowerShell and run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Check if already a git repository
if (Test-Path ".git") {
    Write-Host "⚠️  Git repository already initialized" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Current status:" -ForegroundColor Cyan
    git status
    Write-Host ""
    Write-Host "To create a new commit, run:" -ForegroundColor Yellow
    Write-Host "  git add ." -ForegroundColor White
    Write-Host "  git commit -m 'Your commit message'" -ForegroundColor White
    exit 0
}

# Initialize Git repository
Write-Host "Initializing Git repository..." -ForegroundColor Cyan
git init

Write-Host ""
Write-Host "✅ Git repository initialized!" -ForegroundColor Green
Write-Host ""

# Check Git configuration
Write-Host "Checking Git configuration..." -ForegroundColor Cyan
$userName = git config user.name
$userEmail = git config user.email

if (-not $userName -or -not $userEmail) {
    Write-Host "⚠️  Git user name or email not configured" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please configure Git with:" -ForegroundColor Yellow
    Write-Host "  git config --global user.name 'Your Name'" -ForegroundColor White
    Write-Host "  git config --global user.email 'your.email@example.com'" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "✅ Git configured as: $userName <$userEmail>" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Green
Write-Host ""
Write-Host "1. Stage all files:" -ForegroundColor Cyan
Write-Host "   git add ." -ForegroundColor White
Write-Host ""
Write-Host "2. Create your first commit:" -ForegroundColor Cyan
Write-Host "   git commit -m 'Initial commit: Another RA project'" -ForegroundColor White
Write-Host ""
Write-Host "3. View commit history:" -ForegroundColor Cyan
Write-Host "   git log --oneline" -ForegroundColor White
Write-Host ""
Write-Host "4. For detailed guide, see: VERSION_CONTROL_GUIDE.md" -ForegroundColor Cyan
Write-Host ""

