# Migrate Repository to New GitHub Repository
# This script helps you copy or move your repository to a new GitHub repository

param(
    [Parameter(Mandatory=$true)]
    [string]$NewRepoUrl,
    
    [Parameter(Mandatory=$false)]
    [switch]$KeepOriginal = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Mirror = $false
)

Write-Host "=== Repository Migration Script ===" -ForegroundColor Cyan
Write-Host ""

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Not a git repository. Run this script from the repository root." -ForegroundColor Red
    exit 1
}

# Show current remote
Write-Host "Current Remote Configuration:" -ForegroundColor Yellow
git remote -v
Write-Host ""

# Validate new repository URL
if ($NewRepoUrl -notmatch "^https://github.com/|^git@github.com:") {
    Write-Host "❌ Error: Invalid repository URL format." -ForegroundColor Red
    Write-Host "   Expected format: https://github.com/username/repo.git" -ForegroundColor Yellow
    Write-Host "   Or: git@github.com:username/repo.git" -ForegroundColor Yellow
    exit 1
}

# Check if new repository exists (basic check)
Write-Host "⚠️  Make sure the new repository exists on GitHub before continuing!" -ForegroundColor Yellow
Write-Host "   New Repository: $NewRepoUrl" -ForegroundColor Gray
Write-Host ""

$confirm = Read-Host "Continue with migration? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Migration cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Starting migration..." -ForegroundColor Cyan

if ($KeepOriginal) {
    Write-Host "Mode: Copy (keeping original remote)" -ForegroundColor Green
    
    # Add new remote with different name
    $newRemoteName = "new-repo"
    Write-Host "Adding new remote: $newRemoteName" -ForegroundColor Yellow
    git remote add $newRemoteName $NewRepoUrl
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error: Failed to add remote. It might already exist." -ForegroundColor Red
        Write-Host "   Remove it first with: git remote remove $newRemoteName" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✅ Remote added successfully" -ForegroundColor Green
    Write-Host ""
    Write-Host "Pushing to new repository..." -ForegroundColor Yellow
    
    if ($Mirror) {
        Write-Host "Using mirror mode (complete copy)..." -ForegroundColor Gray
        git push --mirror $newRemoteName
    } else {
        Write-Host "Pushing all branches..." -ForegroundColor Gray
        git push $newRemoteName --all
        
        Write-Host "Pushing all tags..." -ForegroundColor Gray
        git push $newRemoteName --tags
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Current remotes:" -ForegroundColor Yellow
        git remote -v
        Write-Host ""
        Write-Host "To push to new repo: git push $newRemoteName <branch-name>" -ForegroundColor Cyan
        Write-Host "To push to original: git push origin <branch-name>" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "❌ Error: Failed to push to new repository." -ForegroundColor Red
        Write-Host "   Check:" -ForegroundColor Yellow
        Write-Host "   1. Repository exists and is accessible" -ForegroundColor Gray
        Write-Host "   2. You have Write access to the repository" -ForegroundColor Gray
        Write-Host "   3. You're authenticated (check: git config credential.helper)" -ForegroundColor Gray
        exit 1
    }
} else {
    Write-Host "Mode: Move (replacing original remote)" -ForegroundColor Yellow
    Write-Host ""
    
    $confirmMove = Read-Host "⚠️  This will replace your current 'origin' remote. Continue? (y/N)"
    if ($confirmMove -ne "y" -and $confirmMove -ne "Y") {
        Write-Host "Migration cancelled." -ForegroundColor Yellow
        exit 0
    }
    
    # Change origin remote URL
    Write-Host "Updating origin remote..." -ForegroundColor Yellow
    git remote set-url origin $NewRepoUrl
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error: Failed to update remote URL." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Remote URL updated" -ForegroundColor Green
    Write-Host ""
    Write-Host "Pushing to new repository..." -ForegroundColor Yellow
    
    if ($Mirror) {
        Write-Host "Using mirror mode (complete copy)..." -ForegroundColor Gray
        git push --mirror origin
    } else {
        Write-Host "Pushing main branch..." -ForegroundColor Gray
        git push -u origin main
        
        Write-Host "Pushing all branches..." -ForegroundColor Gray
        git push origin --all
        
        Write-Host "Pushing all tags..." -ForegroundColor Gray
        git push origin --tags
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "New remote configuration:" -ForegroundColor Yellow
        git remote -v
        Write-Host ""
        Write-Host "⚠️  Remember to:" -ForegroundColor Yellow
        Write-Host "   1. Update any documentation with new repository URL" -ForegroundColor Gray
        Write-Host "   2. Update CI/CD configurations if needed" -ForegroundColor Gray
        Write-Host "   3. Notify team members about the new location" -ForegroundColor Gray
    } else {
        Write-Host ""
        Write-Host "❌ Error: Failed to push to new repository." -ForegroundColor Red
        Write-Host "   Restoring original remote..." -ForegroundColor Yellow
        
        # Try to restore (if we saved it)
        Write-Host "   Please manually restore with: git remote set-url origin <original-url>" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "=== Migration Complete ===" -ForegroundColor Green

