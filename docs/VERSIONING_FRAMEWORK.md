# Versioning Framework Guide

## Recommended: Semantic Versioning (SemVer)

**Semantic Versioning** is the industry standard for software versioning. It uses a three-part version number: `MAJOR.MINOR.PATCH` (e.g., `1.2.3`)

### Version Format: `MAJOR.MINOR.PATCH`

- **MAJOR** (1.x.x): Breaking changes that are incompatible with previous versions
- **MINOR** (x.1.x): New features added in a backward-compatible manner
- **PATCH** (x.x.1): Bug fixes and small changes that are backward-compatible

### Examples

```
v1.0.0  → Initial stable release
v1.0.1  → Bug fix (patch)
v1.1.0  → New feature added (minor)
v1.1.1  → Another bug fix
v2.0.0  → Breaking changes (major)
v2.0.1  → Bug fix after major release
v2.1.0  → New features in v2
```

## When to Increment Each Number

### PATCH (x.x.1) - Bug Fixes
- Fixing bugs
- Security patches
- Performance improvements
- Documentation updates
- Code refactoring (no behavior change)

**Example:**
- `v1.0.0` → `v1.0.1`: Fixed pagination bug
- `v1.0.1` → `v1.0.2`: Security patch

### MINOR (x.1.0) - New Features
- Adding new features
- Adding new API endpoints (non-breaking)
- Adding new components
- Enhancing existing features
- Adding new configuration options

**Example:**
- `v1.0.0` → `v1.1.0`: Added attachment management feature
- `v1.1.0` → `v1.2.0`: Added emission factor version table

### MAJOR (1.x.x) - Breaking Changes
- Removing features
- Changing API contracts
- Changing database schemas (incompatible)
- Removing deprecated functionality
- Major architectural changes

**Example:**
- `v1.5.0` → `v2.0.0`: Removed old API endpoints, changed authentication system

## Pre-release Versions

For development and testing:

- **Alpha**: `v1.0.0-alpha.1`, `v1.0.0-alpha.2`
- **Beta**: `v1.0.0-beta.1`, `v1.0.0-beta.2`
- **Release Candidate**: `v1.0.0-rc.1`, `v1.0.0-rc.2`

## GitHub Release Workflow

### 1. Create a Release Branch (Optional but Recommended)

```powershell
# Create a release branch from main
git checkout -b release/v1.1.0
```

### 2. Update Version in package.json

```powershell
# Update version in package.json
# Change: "version": "1.0.0" to "version": "1.1.0"
```

### 3. Create Git Tag

```powershell
# Create annotated tag
git tag -a v1.1.0 -m "Release v1.1.0: Add attachment management feature"

# Or with detailed release notes
git tag -a v1.1.0 -m "Release v1.1.0

Features:
- Added attachment management system
- Improved file upload handling
- Added attachment preview functionality

Bug Fixes:
- Fixed pagination issue in companies table
- Resolved memory leak in file uploads"
```

### 4. Push Tag to GitHub

```powershell
# Push the tag
git push origin v1.1.0

# Or push all tags
git push origin --tags
```

### 5. Create GitHub Release

1. Go to your GitHub repository
2. Click **"Releases"** → **"Create a new release"**
3. Select the tag you just created (e.g., `v1.1.0`)
4. Add release title: `v1.1.0 - Attachment Management Feature`
5. Add release notes describing changes
6. Click **"Publish release"**

## Release Notes Template

```markdown
## v1.1.0 - Attachment Management Feature

### ✨ New Features
- Added attachment management system
- File upload with drag-and-drop support
- Attachment preview functionality
- File type validation

### 🐛 Bug Fixes
- Fixed pagination issue in companies table
- Resolved memory leak in file uploads
- Fixed attachment deletion error

### 🔧 Improvements
- Improved file upload performance
- Enhanced error handling
- Updated documentation

### 📝 Documentation
- Added attachment management guide
- Updated API documentation
```

## Automated Version Management

### Option 1: npm version (Recommended)

```powershell
# Patch version (1.0.0 → 1.0.1)
npm version patch -m "Release v%s"

# Minor version (1.0.0 → 1.1.0)
npm version minor -m "Release v%s"

# Major version (1.0.0 → 2.0.0)
npm version major -m "Release v%s"

# This automatically:
# - Updates package.json version
# - Creates a git commit
# - Creates a git tag
```

### Option 2: Manual Process

```powershell
# 1. Update package.json manually
# 2. Commit the change
git add package.json
git commit -m "Bump version to 1.1.0"

# 3. Create tag
git tag -a v1.1.0 -m "Release v1.1.0"

# 4. Push everything
git push origin main
git push origin v1.1.0
```

## Version Naming Best Practices

### ✅ Good Version Names
- `v1.0.0`
- `v1.2.3`
- `v2.0.0-beta.1`
- `v1.5.0-rc.2`

### ❌ Bad Version Names (Avoid These)
- `"add-pagination-feature"` (use commit messages instead)
- `"fix-bug-123"` (use issue numbers in release notes)
- `"chat-instruction-1"` (not descriptive)
- `"version-1"` (not following SemVer)

## CHANGELOG.md

Maintain a `CHANGELOG.md` file to track all version changes:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New feature in development

## [1.1.0] - 2025-01-15

### Added
- Attachment management system
- File upload functionality

### Fixed
- Pagination bug in companies table

## [1.0.0] - 2025-01-01

### Added
- Initial release
- Companies table with pagination
- System configuration space
```

## Quick Reference

| Action | Command |
|--------|---------|
| Create patch release | `npm version patch` |
| Create minor release | `npm version minor` |
| Create major release | `npm version major` |
| List all tags | `git tag` |
| Delete local tag | `git tag -d v1.0.0` |
| Delete remote tag | `git push origin --delete v1.0.0` |
| View tag details | `git show v1.0.0` |

## Decision Tree: Which Version to Bump?

```
Did you break backward compatibility?
├─ YES → Bump MAJOR (1.0.0 → 2.0.0)
└─ NO
   ├─ Did you add new features?
   │  ├─ YES → Bump MINOR (1.0.0 → 1.1.0)
   │  └─ NO → Bump PATCH (1.0.0 → 1.0.1)
```

## Integration with CI/CD

If you set up GitHub Actions, you can automate releases:

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    tags:
      - 'v*'
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Summary

1. **Use Semantic Versioning**: `MAJOR.MINOR.PATCH`
2. **Tag releases**: `git tag -a v1.1.0 -m "Release message"`
3. **Push tags**: `git push origin v1.1.0`
4. **Create GitHub Releases**: Use the web interface or API
5. **Maintain CHANGELOG.md**: Document all changes
6. **Use npm version**: Automate version bumps when possible

---

**Next Steps:**
1. Review your current tags and rename them if needed
2. Set up a CHANGELOG.md file
3. Create your first proper release using SemVer
4. Update your workflow to use this framework going forward

