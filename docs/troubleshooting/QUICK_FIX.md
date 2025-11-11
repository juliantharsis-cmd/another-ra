# Quick Fix for ERR_CONNECTION_REFUSED

## The Problem
Frontend cannot connect to API server at `http://localhost:3001`

## Solution Steps

### Step 1: Verify API Server is Running

**Open in your browser:**
```
http://localhost:3001/health
```

**Expected result:** JSON response with `{"status":"ok",...}`

**If this doesn't work:** The server is not running. Go to Step 2.

### Step 2: Start the API Server

**In Cursor, open a NEW terminal:**

1. Click **Terminal** → **New Terminal** (or press Ctrl+`)
2. Run these commands:
   ```bash
   cd server
   npm run dev
   ```
3. **Wait for this message:**
   ```
   🚀 API Server running on http://localhost:3001
   ```
4. **Keep this terminal open** - don't close it!

### Step 3: Verify Frontend is Running

**In a separate terminal (or check existing one):**

1. Make sure you're in the project root (not `server` folder)
2. Run:
   ```bash
   npm run dev
   ```
3. Should see: `Ready on http://localhost:3000`

### Step 4: Refresh Browser

1. **Hard refresh:** Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Or **close and reopen** the browser tab
3. Navigate to: `http://localhost:3000/spaces/system-config/companies`

### Step 5: Check Browser Console

1. Press **F12** to open DevTools
2. Go to **Console** tab
3. Look for error messages
4. If you see `ERR_CONNECTION_REFUSED`, the server is not running

## Common Issues

### Issue 1: Server Crashed
**Symptom:** Server was running but stopped
**Fix:** Restart the server (Step 2)

### Issue 2: Port Already in Use
**Symptom:** Error about port 3001 being in use
**Fix:** 
```powershell
# Find and kill process on port 3001
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process -Force
```

### Issue 3: Server Not Starting
**Symptom:** No output when running `npm run dev`
**Fix:** Check for errors in terminal, verify `node_modules` exists

### Issue 4: Browser Cache
**Symptom:** Still seeing old errors after fixing
**Fix:** Clear browser cache or use incognito mode

## Test Connection

**In browser console (F12), run:**
```javascript
fetch('http://localhost:3001/api/companies')
  .then(r => r.json())
  .then(data => console.log('✓ Success!', data))
  .catch(err => console.error('✗ Error:', err))
```

If this works, the connection is fine. If not, the server isn't running.

## Still Not Working?

1. **Check server terminal** for error messages
2. **Verify both servers are running** (API on 3001, Frontend on 3000)
3. **Try different URL:** `http://127.0.0.1:3001` instead of `localhost`
4. **Check Windows Firewall** - may need to allow Node.js
5. **Restart your computer** if all else fails

