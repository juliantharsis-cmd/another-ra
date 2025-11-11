# Git Setup Instructions - Step by Step

## Step 1: Install Git

**Git is not currently installed on your system.**

### Download and Install:

1. **Download Git for Windows:**
   - Go to: https://git-scm.com/download/win
   - Click "Download for Windows"
   - The download will start automatically

2. **Install Git:**
   - Run the downloaded installer (Git-2.x.x-64-bit.exe)
   - Click "Next" through the installation wizard
   - **Recommended settings:**
     - ✅ Use Git from the command line and also from 3rd-party software
     - ✅ Checkout Windows-style, commit Unix-style line endings
     - ✅ Use Windows' default console window
   - Click "Install" and wait for completion

3. **Restart PowerShell/Terminal:**
   - Close and reopen your PowerShell or terminal
   - This ensures Git is in your PATH

4. **Verify Installation:**
   ```powershell
   git --version
   ```
   You should see something like: `git version 2.x.x`

---

## Step 2: Configure Git (First Time Only)

After installing Git, configure it with your name and email:

```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

**Example:**
```powershell
git config --global user.name "Julian THARSIS"
git config --global user.email "julian.tharsis@example.com"
```

---

## Step 3: Initialize Git Repository

Navigate to your project directory and initialize Git:

```powershell
cd "C:\Users\SESA666986\Documents\Cursor P"
git init
```

This creates a `.git` folder in your project (hidden by default).

---

## Step 4: Create Your First Commit

### 4a. Check what files will be committed:
```powershell
git status
```

### 4b. Add all files to staging:
```powershell
git add .
```

### 4c. Create your first commit:
```powershell
git commit -m "Initial commit: Another RA project with Companies page, pagination, and Airtable integration"
```

---

## Quick Verification

After completing all steps, verify everything works:

```powershell
# Check Git is installed
git --version

# Check repository status
git status

# View commit history
git log --oneline
```

You should see your initial commit in the log!

---

## What's Next?

Now that Git is set up, you can:

1. **Make changes to your code**
2. **Check what changed:**
   ```powershell
   git status
   git diff
   ```

3. **Commit your changes:**
   ```powershell
   git add .
   git commit -m "Description of your changes"
   ```

4. **View your commit history:**
   ```powershell
   git log --oneline
   ```

5. **Roll back if needed:**
   ```powershell
   # See commit history
   git log --oneline
   
   # Roll back to a specific commit
   git reset --hard <commit-hash>
   ```

---

## Need Help?

- See [`VERSION_CONTROL_GUIDE.md`](./VERSION_CONTROL_GUIDE.md) for detailed documentation
- Common commands are in `git-quick-commands.ps1`

---

**After installing Git, come back and I can help you complete steps 2-4!**


