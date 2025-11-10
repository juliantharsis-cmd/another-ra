# Creating User Preferences Table via API

## ✅ Automated Creation Script

I've created a script that uses the Airtable Metadata API to create the "User Preferences" table programmatically!

## Quick Start

```bash
cd server
npm run create:preferences-table
```

## Prerequisites

1. **Environment Variables** - Ensure `server/.env` has:
   ```bash
   AIRTABLE_PERSONAL_ACCESS_TOKEN=your_token_here
   AIRTABLE_SYSTEM_CONFIG_BASE_ID=your_base_id_here
   ```

2. **API Token Permissions** - Your token needs:
   - `schema.bases:read` - To check if table exists
   - `schema.bases:write` - To create the table

## What the Script Does

1. ✅ Checks if table already exists (skips if found)
2. ✅ Creates table with all required fields
3. ✅ Sets up formula fields (Unique Key, Checksum)
4. ✅ Configures field types and options
5. ✅ Provides next steps for manual configuration

## Manual Steps After Creation

The script will create the table, but you'll need to:

1. **Set Required Fields** (in Airtable UI):
   - "User Id" → Required
   - "Key" → Required

2. **Set Default Value**:
   - "Visibility" → Default: `private`

## Troubleshooting

### Error: "schema.bases:write" permission required
- **Solution**: Update your Personal Access Token in Airtable
- Go to: Account Settings → Developer → Personal Access Tokens
- Ensure token has "schema.bases:write" scope

### Error: Base not found
- **Solution**: Check `AIRTABLE_SYSTEM_CONFIG_BASE_ID` in `.env`
- Verify the base ID is correct

### Error: Table already exists
- **Solution**: The script will skip creation if table exists
- If you want to recreate, delete the table in Airtable UI first

## Alternative: Manual Creation

If the API approach doesn't work, use the Airtable Scripting script:
- File: `scripts/create-preferences-table.js`
- Run in: Airtable → Extensions → Scripting

## Verification

After creation, verify the table:
```bash
npm run test:preferences
```

This will test all CRUD operations and confirm the table is working correctly.

