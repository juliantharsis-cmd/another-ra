# Troubleshooting Field Mapping API

## Error: "Field mapping not found"

This error means the backend couldn't find or create the field mapping. Here's how to debug:

### Step 1: Check Backend Logs

After restarting the backend, try the request again and check the backend console. You should see logs like:

```
🔍 [FieldMappingService] Getting field mapping for table: users
⚠️ [FieldMappingService] No Airtable mapping found for table: users
   Available environment variables:
   - AIRTABLE_USER_TABLE_TABLE_ID: NOT SET
   - AIRTABLE_USER_TABLE_TABLE_NAME: NOT SET
```

### Step 2: Check Environment Variables

The service needs these environment variables in `server/.env`:

```bash
# Required
AIRTABLE_PERSONAL_ACCESS_TOKEN=your_token_here
AIRTABLE_SYSTEM_CONFIG_BASE_ID=your_base_id_here

# For Users table (at least one of these)
AIRTABLE_USER_TABLE_TABLE_ID=your_table_id_here
# OR
AIRTABLE_USER_TABLE_TABLE_NAME=user table

# For Companies table
AIRTABLE_COMPANY_TABLE_ID=your_table_id_here
# OR
AIRTABLE_COMPANY_TABLE_NAME=Companies
```

### Step 3: Verify Table Mapping

The service looks for these table IDs:
- `users` or `user-table` → Uses `AIRTABLE_USER_TABLE_TABLE_ID` or `AIRTABLE_USER_TABLE_TABLE_NAME`
- `companies` → Uses `AIRTABLE_COMPANY_TABLE_ID` or `AIRTABLE_COMPANY_TABLE_NAME`

**Check your `.env` file:**
```bash
# In server directory
cat .env | grep AIRTABLE_USER_TABLE
```

### Step 4: Test Airtable Metadata API Access

The service needs access to Airtable Metadata API. Test it:

```bash
# Replace with your actual values
BASE_ID="your_base_id"
API_KEY="your_token"

curl "https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json"
```

**Expected:** JSON with tables array

**If you get 401/403:** Your token needs `schema.bases:read` scope. Update your Airtable Personal Access Token with this scope.

### Step 5: Check Table Name/ID

If using table name, make sure it matches exactly (case-sensitive):

```bash
# In Airtable, check the exact table name
# It should match AIRTABLE_USER_TABLE_TABLE_NAME exactly
```

### Step 6: Try Different Table ID

Try with `companies` table instead:

```bash
curl http://localhost:3001/api/tables/companies/field-mapping
```

If this works, the issue is with the `users` table configuration.

## Common Issues

### Issue 1: Environment Variables Not Set

**Symptoms:**
- Logs show "NOT SET" for environment variables
- Error: "Field mapping not found"

**Solution:**
1. Check `server/.env` exists
2. Add missing environment variables
3. Restart backend server

### Issue 2: Airtable Metadata API Access Denied

**Symptoms:**
- Logs show: "Airtable Metadata API access denied"
- Error: "Field mapping not found"

**Solution:**
1. Go to Airtable → Account → Developer Hub
2. Create/update Personal Access Token
3. Add scope: `schema.bases:read`
4. Update `AIRTABLE_PERSONAL_ACCESS_TOKEN` in `.env`
5. Restart backend

### Issue 3: Table Not Found

**Symptoms:**
- Logs show: "Airtable table not found"
- Error: "Field mapping not found"

**Solution:**
1. Verify table ID/name is correct
2. Check table exists in the base
3. Verify base ID is correct

### Issue 4: Wrong Table ID Format

**Symptoms:**
- Table mapping found but API call fails

**Solution:**
- Use table ID (starts with `tbl`) if available
- Or use exact table name (case-sensitive)

## Quick Test Commands

```bash
# Test 1: Check if backend is running
curl http://localhost:3001/health

# Test 2: Check users table mapping
curl http://localhost:3001/api/tables/users/field-mapping

# Test 3: Check companies table mapping
curl http://localhost:3001/api/tables/companies/field-mapping

# Test 4: Check backend logs (look for FieldMappingService logs)
# In backend terminal, you should see detailed logs
```

## Next Steps

Once the API works:
1. Test in browser console (Step 2 of testing guide)
2. Test table preferences integration
3. Test end-to-end user flow

