# How to Check Server Output

## Method 1: Check Status Endpoint (Easiest)

Open your browser or use curl:
```
http://localhost:3001/api/status
```

This will show you:
- Which data source is being used (Airtable or Mock Data)
- Whether Airtable is configured
- Base ID and Table Name

## Method 2: View Server Terminal

The server is running in the background. To see the output:

1. **In Cursor/VS Code:**
   - Look for a terminal tab at the bottom
   - The server output should be visible there
   - Look for messages like:
     - `📊 Using Airtable as data source`
     - `⚠️  Airtable credentials not found, using mock data`

2. **In a separate terminal:**
   - Open PowerShell or Command Prompt
   - Navigate to the server directory:
     ```bash
     cd "C:\Users\SESA666986\Documents\Cursor P\server"
     ```
   - Run the server:
     ```bash
     npm run dev
     ```
   - You'll see all console output in real-time

## Method 3: Check Logs via API

Test the companies endpoint to see if it's working:
```
http://localhost:3001/api/companies
```

If you see companies, check if they match your Airtable data or mock data.

## Troubleshooting

If you see "Mock Data" in the status:
1. Verify `.env` file exists in `server` directory
2. Check that environment variables are set correctly
3. Restart the server after creating/updating `.env`

