# AI Model Registry - Provider Name Lookup Setup

## Current Implementation

The AI Model Registry is connected to the Integration Marketplace via a **linked record field** called "Provider". However, the provider name is currently resolved **programmatically** by the application when fetching models.

### How It Works Now

1. **Relationship**: The "Provider" field in AI Model Registry links to Integration Marketplace records
2. **Name Resolution**: When the application loads models, it automatically fetches the provider name from the linked record
3. **Automatic Updates**: When you change a provider name in Integration Marketplace, the next time you view the AI Model Registry, it will show the updated name

## Manual Setup: Airtable Lookup Field (Optional)

If you want the provider name to be **automatically synced in Airtable itself** (not just in the application), you can manually create a lookup field:

### Steps

1. **Open your Airtable base** (System Configuration space)
2. **Go to the "AI Model Registry" table**
3. **Add a new field**:
   - Click the "+" button to add a field
   - Name it: **"Provider Name"**
   - Type: **Lookup**
   - Source field: **Provider** (the linked record field)
   - Field to lookup: **Name** (from Integration Marketplace)
4. **Save the field**

### Result

After creating the lookup field:
- The "Provider Name" field will automatically show the provider name from Integration Marketplace
- When you change a provider name in Integration Marketplace, the "Provider Name" field in AI Model Registry will automatically update
- This works at the Airtable level, not just in the application

## Application Behavior

The application will:
1. **Use the lookup field if it exists** (when we add support for it)
2. **Fall back to programmatic resolution** if the lookup field doesn't exist
3. **Always show the current provider name** from Integration Marketplace

## Benefits of Lookup Field

- ✅ **Automatic sync** in Airtable UI
- ✅ **No API calls needed** to resolve names
- ✅ **Faster performance** (no need to fetch linked records)
- ✅ **Works in Airtable views and formulas**

## Current Status

- ✅ Relationship created (Provider field links to Integration Marketplace)
- ✅ Application resolves provider names programmatically
- ⚠️ Lookup field must be created manually in Airtable UI (API doesn't support it)

