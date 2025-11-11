# Quick Git Setup - Ready to Run

## ⚠️ IMPORTANT: Install Git First

Git is not currently installed. You need to install it before proceeding.

### Quick Install Steps:

1. **Download Git:**
   - Open: https://git-scm.com/download/win
   - Click "Download for Windows"
   - Wait for download to complete

2. **Install Git:**
   - Double-click the downloaded file (Git-2.x.x-64-bit.exe)
   - Click "Next" through all screens
   - **Keep default settings** (they're fine)
   - Click "Install"
   - Wait for installation to complete

3. **Restart PowerShell:**
   - Close this PowerShell window
   - Open a new PowerShell window
   - Navigate back to your project:
     ```powershell
     cd "C:\Users\SESA666986\Documents\Cursor P"
     ```

4. **Run the setup:**
   ```powershell
   .\INIT_GIT.ps1
   ```

---

## What Will Happen

Once Git is installed and you run `.\INIT_GIT.ps1`, it will:

✅ Check Git is installed  
✅ Initialize the repository  
✅ Configure Git (if needed)  
✅ Stage all your files  
✅ Create your first commit  

**That's it!** Your project will be version controlled.

---

## Alternative: Manual Setup

If you prefer to do it manually, after installing Git:

```powershell
# 1. Configure (first time only)
git config --global user.name "Julian THARSIS"
git config --global user.email "your.email@example.com"

# 2. Initialize
git init

# 3. Add all files
git add .

# 4. First commit
git commit -m "Initial commit: Another RA project with Companies page, pagination, and Airtable integration"

# 5. Verify
git log --oneline
```

---

## After Setup

Once Git is set up, you can:

- **See what changed:** `git status`
- **Commit changes:** `git add . && git commit -m "Your message"`
- **View history:** `git log --oneline`
- **Roll back:** `git reset --hard <commit-hash>`

See [`VERSION_CONTROL_GUIDE.md`](./VERSION_CONTROL_GUIDE.md) for complete documentation.

---

**Ready? Install Git, restart PowerShell, then run `.\INIT_GIT.ps1`!**


