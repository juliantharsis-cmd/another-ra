# Fix ERR_CONNECTION_REFUSED Error

## Quick Fix Steps

### 1. Verify API Server is Running

Open these URLs in your browser:
- `http://localhost:3001/health` 
- `http://127.0.0.1:3001/health`

If these work, the server is running. If not, continue below.

### 2. Restart the API Server

**In a new terminal window:**

1. Open a terminal in Cursor (Terminal → New Terminal)
2. Navigate to server directory:
   ```bash
   cd server
   ```
3. Stop any running server (Ctrl+C if needed)
4. Start the server:
   ```bash
   npm run dev
   ```
5. You should see:
   ```
   🚀 API Server running on http://localhost:3001
   📋 Health check: http://localhost:3001/health
   📊 Companies API: http://localhost:3001/api/companies
   ```

### 3. Verify Frontend is Using Correct URL

The frontend should be calling: `http://localhost:3001/api/companies`

Check in browser console (F12):
- Look for the exact URL being called
- Verify it's `http://localhost:3001` not `http://localhost:3000`

### 4. Check Both Servers Are Running

You need TWO terminals running:

**Terminal 1 - API Server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### 5. Test Connection Manually

Open browser console (F12) and run:
```javascript
fetch('http://localhost:3001/api/companies')
  .then(r => r.json())
  .then(data => console.log('Success!', data))
  .catch(err => console.error('Error:', err))
```

## Common Causes

1. **Server not started** - Most common cause
2. **Wrong port** - Server on different port
3. **Server crashed** - Check terminal for errors
4. **Firewall blocking** - Windows firewall may block port 3001
5. **Timing issue** - Frontend loads before server starts

## Verify Server Status

Run this command to check if server is listening:
```powershell
Get-NetTCPConnection -LocalPort 3001 -State Listen
```

If you see output, server is running. If empty, server is not running.

## Still Not Working?

1. **Check server terminal** for error messages
2. **Try different URL**: `http://127.0.0.1:3001` instead of `localhost`
3. **Check Windows Firewall** - may need to allow port 3001
4. **Restart both servers** completely
5. **Clear browser cache** and hard refresh (Ctrl+Shift+R)

