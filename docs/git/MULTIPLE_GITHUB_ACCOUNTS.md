# Connecting Multiple GitHub Accounts

This guide covers how to connect a second GitHub account (your Pro account) to work with this repository.

---

## Option 1: Add as Collaborator (Recommended for Team Work)

This is the simplest approach if you want both accounts to have access to the same repository.

### Steps:

1. **Add Collaborator on GitHub:**
   - Go to: `https://github.com/juliantharsis-cmd/another-ra/settings/access`
   - Click **"Add people"** or **"Invite a collaborator"**
   - Enter the username or email of your Pro account
   - Select permission level:
     - **Read** - Can view and clone
     - **Write** - Can push and create branches
     - **Admin** - Full access (recommended if it's your account)
   - Click **"Add [username] to this repository"**

2. **Accept Invitation:**
   - Log in to your Pro account
   - Check email or GitHub notifications
   - Accept the collaboration invitation

3. **Clone Repository (on Pro Account):**
   ```bash
   git clone https://github.com/juliantharsis-cmd/another-ra.git
   cd another-ra
   ```

4. **Configure Git for Pro Account:**
   ```bash
   git config user.name "Your Pro Account Name"
   git config user.email "your-pro-account@email.com"
   ```

---

## Option 2: Transfer Repository to Organization

If you want both accounts to be part of an organization:

1. **Create GitHub Organization:**
   - Go to: `https://github.com/organizations/new`
   - Create organization (can be free or paid)
   - Add both accounts as owners/members

2. **Transfer Repository:**
   - Go to repository settings
   - Scroll to **"Danger Zone"**
   - Click **"Transfer ownership"**
   - Enter organization name
   - Confirm transfer

3. **Both accounts can now access:**
   - Both accounts will have access through the organization
   - Can set up teams and permissions

---

## Option 3: Work with Multiple Accounts Locally

If you want to use both accounts from the same machine:

### Setup SSH Keys for Multiple Accounts

1. **Generate SSH Key for Pro Account:**
   ```powershell
   # Generate SSH key with a specific name
   ssh-keygen -t ed25519 -C "your-pro-account@email.com" -f ~/.ssh/id_ed25519_pro
   ```

2. **Add SSH Key to Pro Account:**
   - Copy public key: `cat ~/.ssh/id_ed25519_pro.pub`
   - Go to: `https://github.com/settings/keys` (on Pro account)
   - Click **"New SSH key"**
   - Paste key and save

3. **Create SSH Config File:**
   ```powershell
   # Create/edit SSH config
   notepad ~/.ssh/config
   ```

   Add this configuration:
   ```
   # Personal Account (juliantharsis-cmd)
   Host github.com-personal
       HostName github.com
       User git
       IdentityFile ~/.ssh/id_ed25519
       IdentitiesOnly yes

   # Pro Account
   Host github.com-pro
       HostName github.com
       User git
       IdentityFile ~/.ssh/id_ed25519_pro
       IdentitiesOnly yes
   ```

4. **Update Remote URL:**
   ```powershell
   # For personal account (current)
   git remote set-url origin git@github.com-personal:juliantharsis-cmd/another-ra.git

   # OR for Pro account
   git remote set-url origin git@github.com-pro:your-pro-username/another-ra.git
   ```

5. **Test Connection:**
   ```powershell
   # Test personal account
   ssh -T git@github.com-personal

   # Test Pro account
   ssh -T git@github.com-pro
   ```

---

## Option 4: Use Git Credential Manager (Windows)

Windows Git Credential Manager can handle multiple accounts:

1. **Configure Credential Helper:**
   ```powershell
   git config --global credential.helper manager-core
   ```

2. **When Pushing/Pulling:**
   - Git will prompt for credentials
   - Use different credentials for different accounts
   - Credential Manager will remember them

3. **Switch Accounts:**
   - Go to: Windows Credential Manager
   - Search for "github.com"
   - Edit or remove stored credentials
   - Next push will prompt for new credentials

---

## Option 5: Use Repository-Specific Git Config

Configure Git per repository instead of globally:

```powershell
# In your repository directory
cd "C:\Users\SESA666986\Documents\Cursor P"

# Set local config (only for this repo)
git config user.name "Your Pro Account Name"
git config user.email "your-pro-account@email.com"

# Keep global config for other repos
git config --global user.name "Julian THARSIS"
git config --global user.email "julian.tharsis@example.com"
```

---

## Recommended Approach

**For Team Collaboration:**
- ✅ **Option 1** (Add as Collaborator) - Simplest and best for team work
- Both accounts can push/pull
- Clear access control
- Easy to manage permissions

**For Personal Use:**
- ✅ **Option 3** (SSH Keys) - Best for switching between accounts
- Clean separation
- No credential prompts
- Works well with multiple repos

---

## Quick Setup Script

I can create a PowerShell script to automate the setup. Would you like me to create:
1. A script to add the Pro account as collaborator?
2. A script to set up SSH keys for multiple accounts?
3. A script to switch between accounts?

---

## Verification

After setup, verify it works:

```powershell
# Check current user
git config user.name
git config user.email

# Check remote
git remote -v

# Test push (create a test branch first)
git checkout -b test-pro-account
git commit --allow-empty -m "Test commit from Pro account"
git push origin test-pro-account
```

---

## Troubleshooting

### Issue: "Permission denied" when pushing
- **Solution:** Check SSH key is added to correct GitHub account
- **Solution:** Verify remote URL matches the account you're using

### Issue: Wrong account commits
- **Solution:** Set repository-specific config: `git config user.name "Correct Name"`

### Issue: Credential conflicts
- **Solution:** Clear stored credentials: `git credential-manager-core erase https://github.com`
- **Solution:** Use SSH instead of HTTPS

---

**Which option would you like to use?** Let me know and I can help you set it up!

