# 🚀 Codespaces Quick Start

## One-Time Setup (5 minutes)

### 1. Create Codespace
- Go to repo → Click **"Code"** → **"Codespaces"** → **"Create codespace"**

### 2. Configure Environment Variables

**Backend (.env):**
```bash
cd server
cp env.example .env
# Edit .env with your Airtable credentials
```

**Frontend (.env.local) - Auto-configured!**
The setup script automatically configures the API URL for Codespaces.
If needed, update it manually:
```bash
bash .devcontainer/update-api-url.sh
```

### 3. Install Dependencies (auto-runs, but if needed):
```bash
npm install
cd server && npm install && cd ..
```

## Daily Use (2 commands)

### Start Both Servers

**Important:** Make sure `.env.local` is configured first:
```bash
cat .env.local  # Should show Codespaces backend URL
```

**Option 1: Two Terminals (Recommended)**
```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend (in root directory)
npm run dev
```

**Option 2: Background Script**
```bash
bash .devcontainer/start.sh
```

### Access Your App
- **Frontend:** Click port 3000 notification → Open in browser
- **Backend API:** Click port 3001 notification → Test endpoint

## URLs
- Frontend: `https://your-codespace-3000.preview.app.github.dev`
- Backend: `https://your-codespace-3001.preview.app.github.dev`

## Quick Commands

```bash
# Check backend status
curl http://localhost:3001/api/status

# View logs
tail -f backend.log    # Backend
tail -f frontend.log   # Frontend

# Stop servers
# Press Ctrl+C in terminal, or:
pkill -f "npm run dev"
```

## Troubleshooting

### Port 3001 Already in Use?
```bash
bash .devcontainer/fix-port-3001.sh
```

### CORS Errors?
```bash
bash .devcontainer/update-api-url.sh
npm run dev  # Restart frontend
```

## That's It! 🎉

Your app runs exactly like locally, but in the cloud.

See `CODESPACES_SETUP.md` for detailed instructions.

