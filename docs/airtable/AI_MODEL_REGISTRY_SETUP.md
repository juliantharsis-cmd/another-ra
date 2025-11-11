# AI Model Registry Setup Guide

## Quick Setup

### 1. Create the Airtable Table

Run the setup script:

```bash
cd server
npm run create:ai-model-registry-table
```

This will automatically create the "AI Model Registry" table in your System Configuration Airtable base with all required fields.

### 2. Verify Table Creation

1. Go to your Airtable base (System Configuration space)
2. Verify the "AI Model Registry" table exists
3. Check that all fields are present (see `AI_MODEL_REGISTRY_TABLE.md` for field list)

### 3. Initial Model Population

Models will be automatically discovered and added when:
- A user tests a connection to an AI provider
- The system discovers models from provider APIs
- Models are verified during chat requests

### 4. Manual Model Management (Optional)

You can manually add/edit models in Airtable:
- Mark models as "Recommended" to set defaults
- Add cost information
- Set deprecation dates
- Update features and regions

## How It Works

### Automatic Flow

1. **User tests connection** → System discovers models → Updates Airtable
2. **User uses chat** → System checks Airtable → Uses recommended/available models
3. **Model verification** → Updates "Last Verified" timestamp in Airtable

### Hybrid Approach Priority

```
Request for Models
    ↓
1. Check In-Memory Cache (1 hour TTL)
    ├─ Hit: Return immediately ✅
    └─ Miss: Continue
        ↓
2. Check Airtable Registry (< 24 hours old)
    ├─ Recent data: Use it ✅
    └─ Stale/Missing: Continue
        ↓
3. Discover from Provider API
    ├─ Update Airtable ✅
    ├─ Update Cache ✅
    └─ Return models ✅
```

## Benefits

- ✅ **Scalability**: Shared across multiple server instances
- ✅ **Persistence**: Survives server restarts
- ✅ **Performance**: Caching reduces API calls
- ✅ **Flexibility**: Non-developers can manage models
- ✅ **Resilience**: Multiple fallback layers

## Troubleshooting

### Table Not Found
- Run the setup script: `npm run create:ai-model-registry-table`
- Check Airtable base ID in environment variables

### Models Not Updating
- Check Airtable API key permissions
- Verify table name matches: "AI Model Registry"
- Check server logs for errors

### Fallback to API Discovery
- This is normal if Airtable is unavailable
- System will still work, just without shared persistence

