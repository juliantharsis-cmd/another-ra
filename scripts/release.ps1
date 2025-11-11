# Release Script for Semantic Versioning
# Usage: .\scripts\release.ps1 [patch|minor|major] [message]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("patch", "minor", "major")]
    [string]$Type,
    
    [Parameter(Mandatory=$false)]
    [string]$Message = ""
)

# Get current version from package.json
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$currentVersion = $packageJson.version
Write-Host "Current version: $currentVersion" -ForegroundColor Cyan

# Parse version
$versionParts = $currentVersion -split '\.'
$major = [int]$versionParts[0]
$minor = [int]$versionParts[1]
$patch = [int]$versionParts[2]

# Calculate new version
switch ($Type) {
    "patch" {
        $patch++
        $newVersion = "$major.$minor.$patch"
    }
    "minor" {
        $minor++
        $patch = 0
        $newVersion = "$major.$minor.$patch"
    }
    "major" {
        $major++
        $minor = 0
        $patch = 0
        $newVersion = "$major.$minor.$patch"
    }
}

Write-Host "New version: $newVersion" -ForegroundColor Green

# Confirm
$confirm = Read-Host "Create release v$newVersion? (y/n)"
if ($confirm -ne "y") {
    Write-Host "Release cancelled." -ForegroundColor Yellow
    exit
}

# Update package.json
Write-Host "Updating package.json..." -ForegroundColor Cyan
$packageJson.version = $newVersion
$packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"

# Create git commit
$commitMessage = if ($Message) {
    "Release v$newVersion`: $Message"
} else {
    "Release v$newVersion"
}

Write-Host "Creating git commit..." -ForegroundColor Cyan
git add package.json
git commit -m $commitMessage

# Create git tag
$tagMessage = if ($Message) {
    "Release v$newVersion`: $Message"
} else {
    "Release v$newVersion"
}

Write-Host "Creating git tag v$newVersion..." -ForegroundColor Cyan
git tag -a "v$newVersion" -m $tagMessage

# Summary
Write-Host "`n✅ Release created successfully!" -ForegroundColor Green
Write-Host "Version: v$newVersion" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Push commits: git push origin main" -ForegroundColor White
Write-Host "2. Push tag: git push origin v$newVersion" -ForegroundColor White
Write-Host "3. Create GitHub release at: https://github.com/yourusername/yourrepo/releases/new" -ForegroundColor White

