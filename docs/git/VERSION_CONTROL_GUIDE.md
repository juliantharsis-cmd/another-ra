# Version Control Guide for Another RA

This guide explains how to use Git to maintain versions of your work and roll back changes when needed.

## Prerequisites

### Install Git

1. **Download Git for Windows**: https://git-scm.com/download/win
2. **Install** with default settings (or customize as needed)
3. **Restart your terminal/PowerShell** after installation

### Verify Installation

```powershell
git --version
```

## Initial Setup

### 1. Initialize Git Repository (if not already done)

```powershell
cd "C:\Users\SESA666986\Documents\Cursor P"
git init
```

### 2. Configure Git (first time only)

```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 3. Create Initial Commit

```powershell
# Add all files
git add .

# Create first commit
git commit -m "Initial commit: Another RA project with Companies page and pagination"
```

## Daily Workflow

### Making Changes and Committing

1. **Check what changed**:
   ```powershell
   git status
   ```

2. **See detailed changes**:
   ```powershell
   git diff
   ```

3. **Stage specific files** (recommended):
   ```powershell
   git add src/components/CompanyTable.tsx
   git add src/app/spaces/system-config/companies/page.tsx
   ```

4. **Or stage all changes**:
   ```powershell
   git add .
   ```

5. **Commit with descriptive message**:
   ```powershell
   git commit -m "Add server-side pagination to Companies page"
   ```

### Best Practices for Commit Messages

- Be descriptive: "Add pagination" is better than "Update"
- Use present tense: "Add feature" not "Added feature"
- Keep it concise but informative

**Examples:**
- ✅ `"Add server-side pagination with page size selection"`
- ✅ `"Fix Airtable update error handling"`
- ✅ `"Update CompanyTable styling for better spacing"`
- ❌ `"fix"`
- ❌ `"updates"`

## Rolling Back Changes

### 1. Undo Uncommitted Changes (Before Commit)

**Discard changes to a specific file:**
```powershell
git checkout -- src/components/CompanyTable.tsx
```

**Discard ALL uncommitted changes:**
```powershell
git reset --hard HEAD
```
⚠️ **Warning**: This permanently deletes uncommitted changes!

### 2. Undo Last Commit (Keep Changes)

**Undo commit but keep your changes:**
```powershell
git reset --soft HEAD~1
```
Your changes will be staged and ready to recommit.

**Undo commit and unstage changes:**
```powershell
git reset HEAD~1
```
Your changes will be in your working directory but not staged.

### 3. Roll Back to a Previous Commit

**View commit history:**
```powershell
git log --oneline
```

**Roll back to a specific commit:**
```powershell
# Replace <commit-hash> with the actual hash from git log
git reset --hard <commit-hash>
```

**Example:**
```powershell
git log --oneline
# Output:
# abc1234 Add pagination
# def5678 Fix update error
# ghi9012 Initial commit

git reset --hard def5678  # Roll back to "Fix update error"
```

### 4. Create a Branch Before Major Changes

**Create a new branch:**
```powershell
git checkout -b feature/new-feature-name
```

**Work on the branch, commit changes:**
```powershell
git add .
git commit -m "Work in progress on new feature"
```

**Switch back to main branch:**
```powershell
git checkout main
```

**If you want to discard the branch:**
```powershell
git branch -D feature/new-feature-name
```

**If you want to merge the branch:**
```powershell
git merge feature/new-feature-name
```

## Viewing History

### See All Commits
```powershell
git log
```

### See Compact History
```powershell
git log --oneline --graph --all
```

### See What Changed in a Commit
```powershell
git show <commit-hash>
```

## Creating Checkpoints (Tags)

**Create a tag for important milestones:**
```powershell
git tag -a v1.0.0 -m "First stable version with pagination"
```

**List all tags:**
```powershell
git tag
```

**Roll back to a tag:**
```powershell
git checkout v1.0.0
```

## Quick Reference

| Task | Command |
|------|---------|
| Check status | `git status` |
| See changes | `git diff` |
| Stage file | `git add <file>` |
| Stage all | `git add .` |
| Commit | `git commit -m "message"` |
| View history | `git log --oneline` |
| Undo uncommitted changes | `git checkout -- <file>` |
| Undo last commit (keep changes) | `git reset --soft HEAD~1` |
| Roll back to commit | `git reset --hard <hash>` |
| Create branch | `git checkout -b <name>` |
| Switch branch | `git checkout <name>` |
| Create tag | `git tag -a v1.0.0 -m "message"` |

## Recommended Workflow

1. **Before making major changes**, create a branch:
   ```powershell
   git checkout -b feature/pagination-enhancement
   ```

2. **Make your changes** and test them

3. **Commit frequently** with descriptive messages:
   ```powershell
   git add .
   git commit -m "Add pagination controls"
   ```

4. **If something breaks**, roll back:
   ```powershell
   git log --oneline  # Find the commit before the break
   git reset --hard <good-commit-hash>
   ```

5. **When feature is complete**, merge to main:
   ```powershell
   git checkout main
   git merge feature/pagination-enhancement
   ```

## Backup Strategy

### Option 1: Remote Repository (Recommended)

**Create a GitHub/GitLab repository** and push your code:

```powershell
# Add remote (replace with your repository URL)
git remote add origin https://github.com/yourusername/another-ra.git

# Push to remote
git push -u origin main
```

**Benefits:**
- Automatic backup in the cloud
- Access from anywhere
- Easy collaboration
- Can roll back even if local repo is lost

### Option 2: Local Backup

**Copy entire project folder** to another location periodically:
```powershell
# Example: Backup to external drive
Copy-Item -Path "C:\Users\SESA666986\Documents\Cursor P" -Destination "D:\Backups\Another-RA-$(Get-Date -Format 'yyyy-MM-dd')" -Recurse
```

## Troubleshooting

### "Git is not recognized"
- Install Git from https://git-scm.com/download/win
- Restart your terminal after installation

### "Not a git repository"
- Run `git init` in your project directory

### "Changes not showing in git status"
- Make sure you're in the correct directory
- Check if files are in `.gitignore`

### Accidentally deleted important changes?
- Check `git reflog` to find lost commits
- Use `git cherry-pick <commit-hash>` to recover

## Next Steps

1. **Install Git** if not already installed
2. **Initialize repository**: `git init`
3. **Make your first commit**: `git add . && git commit -m "Initial commit"`
4. **Create a branch** before major changes: `git checkout -b feature/name`
5. **Commit frequently** with good messages
6. **Set up remote backup** (GitHub/GitLab) for safety

---

**Remember**: Git is your safety net. Commit often, and you'll always be able to roll back if something goes wrong!

