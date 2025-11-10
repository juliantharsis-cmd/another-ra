# Setup GitHub Remote Repository
# This script will help you connect your local repository to GitHub

Write-Host "=== GitHub Remote Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Not a git repository. Run 'git init' first." -ForegroundColor Red
    exit 1
}

# Check if remote already exists
$existingRemote = git remote get-url origin 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "⚠️  Remote 'origin' already exists: $existingRemote" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to replace it? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "Cancelled." -ForegroundColor Yellow
        exit 0
    }
    git remote remove origin
}

Write-Host ""
Write-Host "Please provide your GitHub repository URL." -ForegroundColor Yellow
Write-Host "Examples:" -ForegroundColor Gray
Write-Host "  - HTTPS: https://github.com/username/repo-name.git" -ForegroundColor Gray
Write-Host "  - SSH:   git@github.com:username/repo-name.git" -ForegroundColor Gray
Write-Host ""

$repoUrl = Read-Host "GitHub Repository URL"

if ([string]::IsNullOrWhiteSpace($repoUrl)) {
    Write-Host "❌ Error: Repository URL cannot be empty." -ForegroundColor Red
    exit 1
}

# Add the remote
Write-Host ""
Write-Host "Adding remote 'origin'..." -ForegroundColor Cyan
git remote add origin $repoUrl

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Remote 'origin' added successfully!" -ForegroundColor Green
    
    # Verify the remote
    Write-Host ""
    Write-Host "Verifying remote..." -ForegroundColor Cyan
    git remote -v
    
    Write-Host ""
    Write-Host "=== Next Steps ===" -ForegroundColor Cyan
    Write-Host "1. Push your code to GitHub:" -ForegroundColor Yellow
    Write-Host "   git push -u origin master" -ForegroundColor White
    Write-Host ""
    Write-Host "2. If your default branch is 'main' instead of 'master':" -ForegroundColor Yellow
    Write-Host "   git push -u origin master:main" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Or rename your local branch to 'main':" -ForegroundColor Yellow
    Write-Host "   git branch -M main" -ForegroundColor White
    Write-Host "   git push -u origin main" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "❌ Error: Failed to add remote." -ForegroundColor Red
    exit 1
}

