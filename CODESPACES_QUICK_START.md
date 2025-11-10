# 🚀 Codespaces Quick Start

## One-Time Setup (5 minutes)

### 1. Create Codespace
- Go to repo → Click **"Code"** → **"Codespaces"** → **"Create codespace"**

### 2. Add Environment Variables
```bash
cd server
cp env.example .env
# Edit .env with your Airtable credentials
```

### 3. Install Dependencies (auto-runs, but if needed):
```bash
npm install
cd server && npm install && cd ..
```

## Daily Use (2 commands)

### Start Both Servers

**Option 1: Two Terminals (Recommended)**
```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend  
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

## That's It! 🎉

Your app runs exactly like locally, but in the cloud.

See `CODESPACES_SETUP.md` for detailed instructions.

