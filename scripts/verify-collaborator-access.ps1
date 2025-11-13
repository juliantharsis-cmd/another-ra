# Verify Collaborator Access Script
# Run this script after adding your Pro account as a collaborator

Write-Host "=== Verify Collaborator Access ===" -ForegroundColor Cyan
Write-Host ""

# Check current Git configuration
Write-Host "Current Git Configuration:" -ForegroundColor Yellow
Write-Host "  User Name: $(git config user.name)" -ForegroundColor Gray
Write-Host "  User Email: $(git config user.email)" -ForegroundColor Gray
Write-Host ""

# Check remote configuration
Write-Host "Remote Configuration:" -ForegroundColor Yellow
git remote -v
Write-Host ""

# Check if we can fetch
Write-Host "Testing repository access..." -ForegroundColor Yellow
try {
    $fetchResult = git fetch origin --dry-run 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully connected to repository!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Could not fetch. This might be normal if repository is up to date." -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error connecting to repository" -ForegroundColor Red
    Write-Host "   Make sure you've accepted the collaboration invitation" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. If you haven't already, accept the collaboration invitation:" -ForegroundColor White
Write-Host "   https://github.com/juliantharsis-cmd/another-ra/invitations" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Test pushing a branch:" -ForegroundColor White
Write-Host "   git checkout -b test-access" -ForegroundColor Gray
Write-Host "   git commit --allow-empty -m 'Test access'" -ForegroundColor Gray
Write-Host "   git push origin test-access" -ForegroundColor Gray
Write-Host ""
Write-Host "3. If push succeeds, you have Write access!" -ForegroundColor Green

