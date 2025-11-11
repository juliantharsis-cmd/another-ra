# Integration Marketplace - Scalable Implementation

## Overview

The Integration Marketplace has been redesigned to be **fully scalable and configurable** through Airtable. Administrators can now manage AI provider configurations directly in the System Configuration space without requiring code changes.

## Architecture

### Frontend Components

1. **Integration Marketplace UI** (`src/components/IntegrationMarketplace.tsx`)
   - Fetches providers from Airtable API
   - Displays marketplace grid with provider cards
   - Falls back to hardcoded providers if API fails

2. **Management Interface** (`src/app/spaces/system-config/integration-marketplace/page.tsx`)
   - Full CRUD interface for managing providers
   - Uses ListDetailTemplate for consistent UI
   - Located in System Configuration space

3. **API Client** (`src/lib/api/integrationMarketplace.ts`)
   - Client-side API for fetching/managing providers
   - Methods: `getProviders()`, `getAllProviders()`, `createProvider()`, `updateProvider()`, `deleteProvider()`

### Airtable Schema

See `docs/airtable/INTEGRATION_MARKETPLACE_TABLE.md` for complete schema documentation.

**Key Fields:**
- Name, Provider ID, Description
- Category, Auth Type, Base URL
- Supported Models, Default Model, Features
- Enabled flag, Sort Order

## Backend Implementation Required

### API Endpoints Needed

Create the following endpoints in your backend:

```
GET    /api/integration-marketplace/providers
       - Returns all enabled providers
       - Query params: none

GET    /api/integration-marketplace/providers/all
       - Returns all providers (including disabled)
       - For admin management interface

GET    /api/integration-marketplace/providers/:id
       - Returns single provider by ID

POST   /api/integration-marketplace/providers
       - Creates new provider
       - Body: IntegrationMarketplaceProvider (without id)

PUT    /api/integration-marketplace/providers/:id
       - Updates existing provider
       - Body: Partial<IntegrationMarketplaceProvider>

DELETE /api/integration-marketplace/providers/:id
       - Deletes provider
```

### Airtable Table Setup

1. Create table named **"Integration Marketplace"** in your Airtable base
2. Add fields as specified in `docs/airtable/INTEGRATION_MARKETPLACE_TABLE.md`
3. Create initial records for OpenAI, Anthropic, Google, and Custom providers
4. Set up views:
   - "Active Integrations" (filter: Enabled = true)
   - "All Integrations" (no filter)

### Backend Service Example

```typescript
// server/src/services/IntegrationMarketplaceService.ts
import Airtable from 'airtable'

export class IntegrationMarketplaceService {
  private base: Airtable.Base

  constructor() {
    this.base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID)
  }

  async getProviders(enabledOnly: boolean = true): Promise<IntegrationMarketplaceProvider[]> {
    const table = this.base('Integration Marketplace')
    const records = await table.select({
      filterByFormula: enabledOnly ? '{Enabled} = TRUE()' : undefined,
      sort: [{ field: 'Sort Order', direction: 'asc' }, { field: 'Name', direction: 'asc' }],
    }).all()

    return records.map(record => this.mapRecordToProvider(record))
  }

  async createProvider(data: Omit<IntegrationMarketplaceProvider, 'id'>): Promise<IntegrationMarketplaceProvider> {
    const table = this.base('Integration Marketplace')
    const record = await table.create({
      'Name': data.name,
      'Provider ID': data.providerId,
      'Description': data.description,
      'Icon': data.icon,
      'Category': data.category,
      'Auth Type': data.authType,
      'Base URL': data.baseUrl,
      'Documentation URL': data.documentationUrl,
      'Supported Models': Array.isArray(data.supportedModels) ? data.supportedModels.join(', ') : data.supportedModels,
      'Default Model': data.defaultModel,
      'Features': Array.isArray(data.features) ? data.features.join(', ') : data.features,
      'Enabled': data.enabled,
      'Sort Order': data.sortOrder,
    })

    return this.mapRecordToProvider(record)
  }

  private mapRecordToProvider(record: any): IntegrationMarketplaceProvider {
    return {
      id: record.id,
      name: record.fields['Name'],
      providerId: record.fields['Provider ID'],
      description: record.fields['Description'],
      icon: record.fields['Icon'] || 'custom',
      category: record.fields['Category'],
      authType: record.fields['Auth Type'],
      baseUrl: record.fields['Base URL'],
      documentationUrl: record.fields['Documentation URL'],
      supportedModels: record.fields['Supported Models'] 
        ? record.fields['Supported Models'].split(',').map((s: string) => s.trim())
        : undefined,
      defaultModel: record.fields['Default Model'],
      features: record.fields['Features']
        ? record.fields['Features'].split(',').map((s: string) => s.trim())
        : [],
      enabled: record.fields['Enabled'] || false,
      sortOrder: record.fields['Sort Order'],
    }
  }
}
```

## Navigation

### Sidebar Menu

The Integration Marketplace is now available in the **System Configuration** space:
- Path: `/spaces/system-config/integration-marketplace`
- Menu item: "Integration Marketplace" (under "Organization structure")
- Only visible when `integrations` feature flag is enabled

### Settings Modal

The Integration Marketplace UI is also accessible from:
- Settings → Integrations tab
- Shows user-facing marketplace for connecting providers

## User Flow

### For Administrators

1. Navigate to **System Configuration** → **Integration Marketplace**
2. View all providers in table format
3. Create/Edit/Delete providers
4. Configure provider details (name, description, models, etc.)
5. Enable/Disable providers to control visibility

### For End Users

1. Open **Settings** → **Integrations** tab
2. Browse available providers (from Airtable)
3. Click provider card to configure
4. Enter API key/PAT
5. Test connection and save

## Benefits

✅ **Scalable**: Add new providers without code changes  
✅ **Configurable**: All provider details managed in Airtable  
✅ **Consistent**: Uses same ListDetailTemplate as other tables  
✅ **Flexible**: Support for custom providers and configurations  
✅ **User-Friendly**: Separate admin and user interfaces  

## Next Steps

1. **Backend**: Implement API endpoints as specified above
2. **Airtable**: Create table and populate initial data
3. **Testing**: Test CRUD operations and provider loading
4. **Documentation**: Update user guides with new workflow

## Migration Notes

- Existing hardcoded providers in `src/lib/integrations/providers.ts` are kept as fallback
- The UI gracefully falls back to hardcoded providers if API fails
- User's saved integrations (API keys) remain in localStorage (unchanged)

