# Quick Reference Guide: Bulk Table Creation

## 🚀 Quick Start Checklist

### 1. Backend (5 files)
```bash
✅ server/src/types/TableName.ts
✅ server/src/services/TableNameAirtableService.ts
✅ server/src/controllers/TableNameController.ts
✅ server/src/routes/tableNameRoutes.ts
✅ server/src/index.ts (add import + app.use)
```

### 2. Frontend (4 files)
```bash
✅ src/lib/api/tableName.ts
✅ src/components/templates/configs/tableNameConfig.tsx
✅ src/app/spaces/emission-management/table-name/page.tsx
✅ src/app/spaces/emission-management/table-name/layout.tsx
```

### 3. Integration (3 files)
```bash
✅ src/lib/featureFlags.ts (add flag)
✅ src/components/Sidebar.tsx (add menu item + defaults)
✅ src/components/SettingsModal.tsx (add toggle)
```

---

## 🔑 Critical Patterns

### Backend Controller (MUST USE)
```typescript
export class TableNameController {
  private service: TableNameAirtableService | null = null  // ✅ Lazy init
  
  private getService(): TableNameAirtableService {
    if (!this.service) {
      this.service = new TableNameAirtableService()
    }
    return this.service
  }
  
  async getAll(req: Request, res: Response) {
    await this.getService().getAll(...)  // ✅ Use getService()
  }
}
```

### Relationship Field Naming
```typescript
// ✅ Backend Service
ScopeName: scopeNames.map(r => r.name)  // PascalCase, no spaces

// ✅ Frontend Interface
ScopeName?: string | string[]  // Match exactly

// ✅ Frontend Config
{ key: 'ScopeName', type: 'readonly' }  // Match exactly
```

### Route Registration
```typescript
// ✅ server/src/index.ts
import tableNameRoutes from './routes/tableNameRoutes'
app.use('/api/table-name', tableNameRoutes)  // kebab-case
```

### Feature Flag Setup
```typescript
// ✅ featureFlags.ts
type FeatureFlag = ... | 'tableName'
const featureFlags = {
  ...,
  tableName: process.env.NEXT_PUBLIC_FEATURE_TABLE_NAME === 'true' || true,
}

// ✅ Sidebar.tsx (both server & client defaults)
const [featureFlags] = useState(() => ({
  ...,
  tableName: true,  // Add to both
}))
```

---

## 🐛 Common Bugs & Quick Fixes

| Bug | Quick Fix |
|-----|-----------|
| "Airtable API token required" | Use lazy initialization in controller |
| Relationship names not showing | Check field names match exactly (PascalCase) |
| Route 404 | Register route in `server/src/index.ts` |
| Feature flag not working | Add to Sidebar defaults (both server & client) |
| Field missing in detail panel | Add to `panel.sections[].fields` array |

---

## 📋 Naming Conventions

| Component | Pattern | Example |
|-----------|---------|---------|
| Type | PascalCase | `NormalizedActivity.ts` |
| Service | PascalCase + AirtableService | `NormalizedActivityAirtableService.ts` |
| Controller | PascalCase + Controller | `NormalizedActivityController.ts` |
| Route | camelCase + Routes | `normalizedActivityRoutes.ts` |
| API Client | camelCase | `normalizedActivity.ts` |
| Config | camelCase + Config | `normalizedActivityConfig.tsx` |
| Page | kebab-case | `normalized-activities/page.tsx` |
| API Route | kebab-case | `/api/normalized-activities` |
| Feature Flag | camelCase | `normalizedActivities` |

---

## ✅ Validation

Run validation script:
```bash
npx tsx scripts/validate-table-implementation.ts normalizedActivity
```

Checks:
- ✅ All files exist
- ✅ Lazy initialization pattern
- ✅ Route registration
- ✅ Feature flag setup
- ✅ Field name consistency

---

## 📚 Full Documentation

See: `docs/features/BULK_TABLE_CREATION_STRATEGY.md`

