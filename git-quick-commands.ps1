# Quick Git Commands Helper
# Source this file or copy commands as needed

Write-Host "=== Git Quick Commands ===" -ForegroundColor Green
Write-Host ""

# Function to show current status
function Show-GitStatus {
    Write-Host "Current Status:" -ForegroundColor Cyan
    git status
}

# Function to create a commit
function New-GitCommit {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Message
    )
    git add .
    git commit -m $Message
    Write-Host "✅ Committed: $Message" -ForegroundColor Green
}

# Function to view history
function Show-GitHistory {
    Write-Host "Commit History:" -ForegroundColor Cyan
    git log --oneline --graph -10
}

# Function to roll back to previous commit
function Reset-GitToPrevious {
    param(
        [switch]$KeepChanges
    )
    if ($KeepChanges) {
        Write-Host "Rolling back (keeping changes)..." -ForegroundColor Yellow
        git reset --soft HEAD~1
    } else {
        Write-Host "⚠️  Rolling back (discarding changes)..." -ForegroundColor Red
        $confirm = Read-Host "Are you sure? (yes/no)"
        if ($confirm -eq "yes") {
            git reset --hard HEAD~1
            Write-Host "✅ Rolled back" -ForegroundColor Green
        } else {
            Write-Host "Cancelled" -ForegroundColor Yellow
        }
    }
}

# Function to create a branch
function New-GitBranch {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Name
    )
    git checkout -b $Name
    Write-Host "✅ Created and switched to branch: $Name" -ForegroundColor Green
}

# Function to list branches
function Show-GitBranches {
    Write-Host "Branches:" -ForegroundColor Cyan
    git branch -a
}

# Function to switch branch
function Switch-GitBranch {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Name
    )
    git checkout $Name
    Write-Host "✅ Switched to branch: $Name" -ForegroundColor Green
}

# Display available functions
Write-Host "Available Functions:" -ForegroundColor Cyan
Write-Host "  Show-GitStatus              - Show current Git status" -ForegroundColor White
Write-Host "  New-GitCommit -Message '...' - Create a new commit" -ForegroundColor White
Write-Host "  Show-GitHistory             - Show commit history" -ForegroundColor White
Write-Host "  Reset-GitToPrevious         - Roll back to previous commit" -ForegroundColor White
Write-Host "  Reset-GitToPrevious -KeepChanges - Roll back but keep changes" -ForegroundColor White
Write-Host "  New-GitBranch -Name '...'    - Create a new branch" -ForegroundColor White
Write-Host "  Show-GitBranches            - List all branches" -ForegroundColor White
Write-Host "  Switch-GitBranch -Name '...' - Switch to a branch" -ForegroundColor White
Write-Host ""
Write-Host "Example Usage:" -ForegroundColor Yellow
Write-Host "  Show-GitStatus" -ForegroundColor White
Write-Host "  New-GitCommit -Message 'Add pagination feature'" -ForegroundColor White
Write-Host "  New-GitBranch -Name 'feature/pagination'" -ForegroundColor White
Write-Host ""

