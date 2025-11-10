# How to Start Both Servers

## IMPORTANT: You Need TWO Terminal Windows

### Terminal 1: API Server

1. Open a terminal in Cursor
2. Run:
   ```bash
   cd server
   npm run dev
   ```
3. **Wait for:** `🚀 API Server running on http://localhost:3001`
4. **Keep this terminal open!**

### Terminal 2: Frontend

1. Open a **NEW** terminal in Cursor (Terminal → New Terminal)
2. Make sure you're in the **project root** (not `server` folder)
3. Run:
   ```bash
   npm run dev
   ```
4. **Wait for:** `Ready on http://localhost:3000`
5. **Keep this terminal open!**

## Verify Both Are Running

**Check Terminal 1:** Should show API server messages
**Check Terminal 2:** Should show Next.js compilation messages

**Test in browser:**
- API: `http://localhost:3001/health` → Should show JSON
- Frontend: `http://localhost:3000` → Should show the app

## If You See ERR_CONNECTION_REFUSED

1. **Check Terminal 1** - Is the API server actually running?
2. **Look for errors** in the terminal output
3. **Restart Terminal 1** if you see any errors
4. **Refresh browser** after server starts (Ctrl+Shift+R)

## Quick Test

Open in browser: `http://localhost:3001/api/companies`

If you see JSON data, the server is working!
If you see "This site can't be reached", the server is NOT running.

