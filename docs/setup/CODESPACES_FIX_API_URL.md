# Fix: Frontend Connecting to Codespaces Backend

## The Problem

When accessing your app via Codespaces URL, the frontend was trying to connect to `http://localhost:3001` (your local backend) instead of the Codespaces backend, causing CORS errors.

## The Solution

Configure the frontend to use the Codespaces backend URL instead of localhost.

## Step-by-Step Fix (In Codespaces)

### Step 1: Check Current Configuration

```bash
# Check if .env.local exists
cat .env.local
```

If it shows `NEXT_PUBLIC_API_URL=http://localhost:3001/api`, that's the problem!

### Step 2: Update API URL

Run the update script (automatically detects your Codespace):

```bash
bash .devcontainer/update-api-url.sh
```

This will:
- Detect your Codespace name
- Set `NEXT_PUBLIC_API_URL` to: `https://your-codespace-name-3001.preview.app.github.dev/api`

### Step 3: Verify Configuration

```bash
cat .env.local
```

Should show:
```
NEXT_PUBLIC_API_URL=https://your-codespace-name-3001.preview.app.github.dev/api
```

### Step 4: Restart Frontend Server

**Important:** Environment variables are loaded when Next.js starts, so you must restart:

```bash
# Stop the frontend (Ctrl+C if running)
# Then restart:
npm run dev
```

### Step 5: Test

1. Open the frontend in browser (port 3000)
2. Check browser console - no CORS errors!
3. The app should now connect to the Codespaces backend

## Manual Configuration (Alternative)

If the script doesn't work, manually create/update `.env.local`:

```bash
# Get your Codespace name from:
# - Terminal prompt: codespace@your-codespace-name:~/workspace/another-ra$
# - Or from the URL: https://your-codespace-name-3000.preview.app.github.dev

# Create/update .env.local
echo "NEXT_PUBLIC_API_URL=https://YOUR-CODESPACE-NAME-3001.preview.app.github.dev/api" > .env.local

# Verify
cat .env.local
```

## Troubleshooting

### Still Getting CORS Errors?

1. **Check backend is running in Codespaces:**
   ```bash
   curl http://localhost:3001/api/status
   ```

2. **Verify the API URL format:**
   - ✅ Correct: `https://codespace-name-3001.preview.app.github.dev/api`
   - ❌ Wrong: `http://localhost:3001/api`
   - ❌ Wrong: `https://codespace-name-3000.preview.app.github.dev/api` (wrong port)

3. **Check backend CORS logs:**
   Look at backend terminal - it should show:
   ```
   🔍 CORS: Checking origin: https://your-codespace-name-3000.preview.app.github.dev
   ✅ CORS: Allowing GitHub Codespaces origin
   ```

4. **Restart both servers:**
   ```bash
   # Backend
   cd server
   npm run dev
   
   # Frontend (in root)
   npm run dev
   ```

## For Future Codespaces

The setup script (`.devcontainer/setup.sh`) now automatically configures this when the Codespace is created. But if you need to update it later, just run:

```bash
bash .devcontainer/update-api-url.sh
```

