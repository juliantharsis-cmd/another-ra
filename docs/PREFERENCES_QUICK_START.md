# Preferences System - Quick Start

## ✅ Setup Checklist

- [ ] Create Airtable table (see Step 1)
- [ ] Configure environment variables (see Step 2)
- [ ] Test backend (see Step 3)
- [ ] Test frontend (see Step 4)

## Step 1: Create Airtable Table

**Option A: Script (Recommended)**
1. Open System configuration base in Airtable
2. Go to Extensions → Scripting
3. Copy script from `scripts/create-preferences-table.js`
4. Run the script
5. Follow instructions to set formula fields if needed

**Option B: Manual**
- See `docs/PREFERENCES_SETUP_GUIDE.md` for field list

## Step 2: Configure Environment

Add to `server/.env`:
```bash
PREFERENCES_ADAPTER=airtable  # Optional: airtable, memory, postgres
```

## Step 3: Test Backend

```bash
cd server
npm run test:preferences
```

Or manually:
```typescript
import { getPreferencesService } from './services/PreferencesService'

const service = getPreferencesService()
await service.set('user123', 'columnWidths', { name: 200 }, 'json', {
  namespace: 'table',
  tableId: 'companies',
})
```

## Step 4: Test Frontend

**Using React Hook:**
```tsx
import { usePreference } from '@/hooks/usePreferences'

const { value, update } = usePreference('columnWidths', 'table', 'companies')
```

**Using API Client:**
```typescript
import { preferencesApi } from '@/lib/api/preferences'

await preferencesApi.set('columnWidths', { name: 200 }, 'json', {
  namespace: 'table',
  tableId: 'companies',
})
```

## Quick Test Commands

```bash
# Backend test
cd server && npm run test:preferences

# API test
curl http://localhost:3001/api/preferences/user123/table/columnWidths?tableId=companies
```

## Documentation

- Full setup: `docs/PREFERENCES_SETUP_GUIDE.md`
- System docs: `docs/PREFERENCES_SYSTEM.md`
- Framework: `docs/FEATURE_BUILD_FRAMEWORK.md`

