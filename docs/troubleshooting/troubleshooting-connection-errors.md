# Troubleshooting Frontend Connection Errors

## Common Connection Errors

### 1. "Cannot connect to API server"
**Symptoms:**
- Error message: "Cannot connect to API server at http://localhost:3001/api"
- Network error in browser console

**Solutions:**
- ✅ Verify API server is running: `http://localhost:3001/health`
- ✅ Check if port 3001 is available
- ✅ Restart the API server

### 2. CORS Errors
**Symptoms:**
- Browser console shows: "CORS policy: No 'Access-Control-Allow-Origin' header"
- Request blocked by browser

**Solutions:**
- ✅ CORS is now configured to allow `http://localhost:3000`
- ✅ Restart the API server after CORS changes
- ✅ Check browser console for specific CORS error

### 3. 404 Not Found
**Symptoms:**
- Error: "Route not found" or 404 status

**Solutions:**
- ✅ Verify API URL: Should be `http://localhost:3001/api/companies`
- ✅ Check that routes are properly registered

### 4. Network Error
**Symptoms:**
- TypeError: Failed to fetch
- Connection refused

**Solutions:**
- ✅ Ensure API server is running on port 3001
- ✅ Check firewall settings
- ✅ Try `http://127.0.0.1:3001` instead of `localhost`

## Debugging Steps

### Step 1: Check API Server Status
Open in browser: `http://localhost:3001/health`

Should return:
```json
{
  "status": "ok",
  "timestamp": "...",
  "service": "Another RA API"
}
```

### Step 2: Test Companies Endpoint
Open in browser: `http://localhost:3001/api/companies`

Should return JSON with companies array.

### Step 3: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for error messages
4. Check Network tab for failed requests

### Step 4: Verify Environment Variables
Check that frontend is using correct API URL:
- Default: `http://localhost:3001/api`
- Can be overridden with `NEXT_PUBLIC_API_URL` in `.env.local`

### Step 5: Check Server Logs
Look at the server terminal for:
- Request logs: `2025-01-XX - GET /api/companies`
- Error messages
- CORS-related logs

## Quick Fixes

### Restart Both Servers
1. Stop API server (Ctrl+C in terminal)
2. Stop Frontend server (Ctrl+C in terminal)
3. Start API server: `cd server && npm run dev`
4. Start Frontend: `npm run dev`

### Clear Browser Cache
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Or clear browser cache

### Check Ports
```powershell
# Check if port 3001 is in use
Get-NetTCPConnection -LocalPort 3001

# Check if port 3000 is in use
Get-NetTCPConnection -LocalPort 3000
```

## Testing Connection

### From Browser Console
```javascript
fetch('http://localhost:3001/api/companies')
  .then(r => r.json())
  .then(data => console.log('Success:', data))
  .catch(err => console.error('Error:', err))
```

### From PowerShell
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/api/companies" -UseBasicParsing
```

## Still Having Issues?

1. Check the exact error message in browser console
2. Verify both servers are running
3. Check server terminal for error logs
4. Try accessing API directly in browser
5. Check network tab in browser DevTools

