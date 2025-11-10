# Running Another RA in GitHub Codespaces

Complete step-by-step guide to run your app in Codespaces, just like locally.

## Step 1: Create Codespace

1. Go to your repository: `https://github.com/juliantharsis-cmd/another-ra`
2. Click the green **"Code"** button
3. Select the **"Codespaces"** tab
4. Click **"Create codespace on main"**
5. Wait for Codespace to initialize (1-2 minutes)

## Step 2: Configure Environment Variables

### Option A: Using Codespaces Secrets (Recommended)

1. In Codespace, click the **⚙️ Settings** icon (bottom left)
2. Go to **"Codespaces"** → **"Secrets"**
3. Add these secrets:
   - `AIRTABLE_PERSONAL_ACCESS_TOKEN` = your Airtable token
   - `AIRTABLE_SYSTEM_CONFIG_BASE_ID` = your base ID
   - `AIRTABLE_COMPANY_TABLE_ID` = your table ID

### Option B: Create .env File Manually

1. In the Codespace terminal, run:
   ```bash
   cd server
   cp env.example .env
   ```

2. Edit `server/.env` and add your Airtable credentials:
   ```env
   PORT=3001
   NODE_ENV=development
   DATABASE_TYPE=airtable
   AIRTABLE_PERSONAL_ACCESS_TOKEN=your_actual_token_here
   AIRTABLE_SYSTEM_CONFIG_BASE_ID=appGtLbKhmNkkTLVL
   AIRTABLE_COMPANY_TABLE_ID=tbl82H6ezrakMSkV1
   AIRTABLE_COMPANY_TABLE_NAME=Companies
   ```

## Step 3: Install Dependencies

The `.devcontainer/setup.sh` script runs automatically when Codespace is created, but if you need to run it manually:

```bash
bash .devcontainer/setup.sh
```

Or install manually:

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

## Step 4: Verify API URL Configuration

Before starting servers, verify the frontend is configured correctly:

```bash
# Check if .env.local exists and has the correct API URL
cat .env.local

# If it's missing or wrong, update it:
bash .devcontainer/update-api-url.sh
```

The API URL should be:
- **Codespaces:** `https://your-codespace-name-3001.preview.app.github.dev/api`
- **NOT:** `http://localhost:3001/api` (this won't work from Codespaces frontend)

## Step 5: Start the Servers

### Option A: Manual Start (Like Locally)

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
# Make sure you're in the root directory (not server/)
npm run dev
```

**Important:** The frontend must be restarted after changing `.env.local`!

### Option B: Use Start Script

```bash
bash .devcontainer/start.sh
```

This starts both servers in the background.

## Step 6: Access Your App

### Port Forwarding (Automatic)

Codespaces automatically forwards ports. You'll see notifications like:
- **"Port 3000 is available"** → Click to open frontend
- **"Port 3001 is available"** → Click to open backend API

### Manual Access

1. Click on the **"Ports"** tab at the bottom of VS Code
2. Find ports **3000** (frontend) and **3001** (backend)
3. Click the **🌐 globe icon** to open in browser
4. Or right-click → **"Open in Browser"**

### URLs

- **Frontend:** `https://your-codespace-name-3000.preview.app.github.dev`
- **Backend API:** `https://your-codespace-name-3001.preview.app.github.dev`

## Step 7: Verify Everything Works

1. **Check Backend:**
   ```bash
   curl http://localhost:3001/api/status
   ```
   Should return: `{"status":"ok",...}`

2. **Check Frontend:**
   - Open the frontend URL in browser
   - You should see your app

## Troubleshooting

### Ports Not Forwarding

1. Go to **"Ports"** tab
2. Click **"Forward a Port"**
3. Enter `3000` and `3001`

### Environment Variables Not Loading

**Backend:**
1. Check `server/.env` exists
2. Restart the backend server
3. Verify variables are set correctly

**Frontend:**
1. Check `.env.local` exists in root directory
2. Verify `NEXT_PUBLIC_API_URL` points to Codespaces backend (not localhost)
3. **Restart the frontend server** (environment variables are loaded at startup)
4. Run: `bash .devcontainer/update-api-url.sh` to fix the URL

### Dependencies Not Installed

```bash
# Reinstall frontend
rm -rf node_modules package-lock.json
npm install

# Reinstall backend
cd server
rm -rf node_modules package-lock.json
npm install
cd ..
```

### Servers Won't Start

Check logs:
```bash
# Backend logs
tail -f backend.log

# Frontend logs  
tail -f frontend.log
```

## Daily Workflow

Once set up, your daily workflow is:

1. **Open Codespace** (from GitHub repo page)
2. **Start servers:**
   ```bash
   # Terminal 1
   cd server && npm run dev
   
   # Terminal 2
   npm run dev
   ```
3. **Make changes** (edit files)
4. **See changes** (auto-reload in browser)
5. **Commit changes:**
   ```bash
   git add .
   git commit -m "Your message"
   git push
   ```

## Differences from Local

| Local | Codespaces |
|-------|-----------|
| `http://localhost:3000` | `https://codespace-3000.preview.app.github.dev` |
| `.env` files | Same, but stored in cloud |
| Terminal | Same VS Code terminal |
| File editing | Same VS Code editor |
| Git | Same Git commands |

## Tips

1. **Save your work:** Codespaces auto-save, but commit regularly
2. **Port forwarding:** Ports are automatically forwarded
3. **Multiple terminals:** Use `+` button to open new terminals
4. **Extensions:** Install VS Code extensions as needed
5. **Free tier:** 60 hours/month free (enough for development)

## Stopping Codespace

1. Click **⚙️ Settings** → **"Codespaces"** → **"Stop Current Codespace"**
2. Or close the browser tab (auto-stops after inactivity)

Your work is saved automatically!

---

**Ready to start?** Create your Codespace and follow the steps above! 🚀

