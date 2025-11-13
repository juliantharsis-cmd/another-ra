# Adding Pro Account as Collaborator - Step by Step

## Quick Steps

### Step 1: Navigate to Repository Settings

1. Go to your repository: `https://github.com/juliantharsis-cmd/another-ra`
2. Click on the **"Settings"** tab (top right of the repository page)
3. In the left sidebar, click **"Collaborators and teams"** (under "Access")

### Step 2: Add Collaborator

1. Click the green **"Add people"** button (or **"Invite a collaborator"**)
2. In the search box, enter:
   - Your Pro account **username**, OR
   - Your Pro account **email address**
3. Select your Pro account from the dropdown
4. Choose permission level:
   - **Read** - Can view and clone only
   - **Write** - Can push, create branches, and create pull requests (Recommended)
   - **Admin** - Full access including settings (Use if it's your own account)
5. Click **"Add [username] to this repository"**

### Step 3: Accept Invitation (on Pro Account)

1. Log in to GitHub with your **Pro account**
2. You'll receive an email notification OR
3. Go to: `https://github.com/juliantharsis-cmd/another-ra/invitations`
4. Click **"Accept invitation"**

### Step 4: Verify Access

1. While logged in as Pro account, try accessing:
   - `https://github.com/juliantharsis-cmd/another-ra`
2. You should see the repository (no longer says "Private" or requires access request)
3. You can now clone, push, and pull from this account

---

## What You'll Need

- ✅ Your Pro account **username** or **email address**
- ✅ Access to your Pro account email (to accept invitation)
- ✅ Admin access to the repository (you have this)

---

## Permission Levels Explained

### Read
- ✅ View repository
- ✅ Clone repository
- ✅ Create forks
- ❌ Cannot push changes
- ❌ Cannot create branches

### Write (Recommended)
- ✅ Everything in Read, plus:
- ✅ Push to repository
- ✅ Create branches
- ✅ Create pull requests
- ✅ Merge pull requests (if allowed)
- ❌ Cannot change repository settings
- ❌ Cannot delete repository

### Admin (Use if it's your account)
- ✅ Everything in Write, plus:
- ✅ Change repository settings
- ✅ Manage collaborators
- ✅ Delete repository
- ✅ Transfer ownership

---

## After Adding Collaborator

### For Pro Account User:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/juliantharsis-cmd/another-ra.git
   cd another-ra
   ```

2. **Configure Git (if not already done):**
   ```bash
   git config user.name "Your Pro Account Name"
   git config user.email "your-pro-account@email.com"
   ```

3. **Verify you can push:**
   ```bash
   # Create a test branch
   git checkout -b test-pro-account-access
   
   # Make a small change (or empty commit)
   git commit --allow-empty -m "Test: Pro account access verified"
   
   # Push to verify access
   git push origin test-pro-account-access
   ```

4. **Clean up test branch:**
   ```bash
   # Switch back to main
   git checkout main
   
   # Delete local test branch
   git branch -d test-pro-account-access
   
   # Delete remote test branch (optional)
   git push origin --delete test-pro-account-access
   ```

---

## Troubleshooting

### Issue: "User not found" when searching
- **Solution:** Make sure you're typing the exact username or email
- **Solution:** The Pro account must have a GitHub account (not just email)

### Issue: Invitation not received
- **Solution:** Check spam folder
- **Solution:** Go directly to: `https://github.com/juliantharsis-cmd/another-ra/invitations`
- **Solution:** Check if invitation is pending in repository settings

### Issue: "Permission denied" when pushing
- **Solution:** Make sure you accepted the invitation
- **Solution:** Verify you're logged in with the Pro account
- **Solution:** Check permission level (needs Write or Admin)

### Issue: Can't see repository after accepting
- **Solution:** Refresh the page
- **Solution:** Log out and log back in
- **Solution:** Check you're on the correct GitHub account

---

## Next Steps After Setup

1. ✅ Both accounts can now work on the repository
2. ✅ Set up branch protection (see `GITHUB_TEAM_ORGANIZATION.md`)
3. ✅ Configure CODEOWNERS if needed
4. ✅ Set up development workflow

---

**Ready to proceed?** Follow the steps above, and let me know if you need help with any step!

