# AI Model Version Management - Architecture Decision

## Current Implementation vs. Airtable Storage

### Current Approach (In-Memory Cache + localStorage)

**Pros:**
- ✅ Fast performance (in-memory cache)
- ✅ No external dependencies
- ✅ Works offline
- ✅ Simple implementation
- ✅ Low latency

**Cons:**
- ❌ Cache lost on server restart
- ❌ Not shared across server instances (multi-instance deployments)
- ❌ localStorage is client-side only (not accessible to server)
- ❌ No centralized model version management
- ❌ Requires code deployment to update model lists
- ❌ Can't track model availability history
- ❌ No way to add metadata (deprecation dates, costs, feature flags)

### Airtable Storage Approach

**Pros:**
- ✅ Centralized model management
- ✅ Update model lists without code deployment
- ✅ Shared across all server instances
- ✅ Persistent storage
- ✅ Can track model availability over time
- ✅ Can add rich metadata (deprecation dates, costs, feature flags, regions)
- ✅ Better for multi-tenant scenarios
- ✅ Can be managed by non-developers
- ✅ Audit trail of changes

**Cons:**
- ❌ Additional API calls to Airtable
- ❌ Dependency on Airtable availability
- ❌ Slightly more complex implementation
- ❌ Need to handle Airtable rate limits
- ❌ Slightly higher latency (but can be cached)

## Recommended: Hybrid Approach

The best solution combines both approaches for optimal performance and scalability:

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Request                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              AIService (Backend)                         │
│                                                          │
│  1. Check In-Memory Cache (1 hour TTL)                 │
│     ├─ Hit: Return cached models                        │
│     └─ Miss: Continue to step 2                         │
│                                                          │
│  2. Check Airtable (Model Registry)                    │
│     ├─ Has recent data (< 24 hours): Use it            │
│     └─ Stale/Missing: Continue to step 3                │
│                                                          │
│  3. Discover from Provider API                          │
│     ├─ Query provider's /models endpoint               │
│     ├─ Validate models (test connection)               │
│     └─ Update Airtable with new data                   │
│                                                          │
│  4. Update In-Memory Cache                              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Benefits of Hybrid Approach

1. **Performance**: In-memory cache for fast responses
2. **Scalability**: Airtable shared across instances
3. **Resilience**: Fallback to API discovery if Airtable unavailable
4. **Flexibility**: Can update models via Airtable UI
5. **Persistence**: Model data survives server restarts
6. **Rich Metadata**: Store costs, deprecation dates, regions, etc.

### Airtable Schema Design

**Table: `AI Model Registry`**

| Field Name | Type | Description |
|------------|------|-------------|
| **Provider ID** | Single line text | `google`, `openai`, `anthropic` |
| **Model ID** | Single line text | Unique model identifier (e.g., `gemini-1.5-flash-latest`) |
| **Model Name** | Single line text | Display name |
| **Status** | Single select | `active`, `deprecated`, `beta`, `preview` |
| **Available** | Checkbox | Currently available via API |
| **Last Verified** | Date | Last time model was verified |
| **Discovery Method** | Single select | `api`, `manual`, `fallback` |
| **Cost per 1K tokens** | Number | Pricing information |
| **Max Tokens** | Number | Maximum context window |
| **Features** | Multiple select | `chat`, `vision`, `embeddings`, `streaming` |
| **Regions** | Multiple select | `us`, `eu`, `global` |
| **Deprecation Date** | Date | When model will be deprecated |
| **Recommended** | Checkbox | Recommended model for provider |
| **Sort Order** | Number | Display order |
| **Metadata** | JSON | Additional provider-specific data |

### Implementation Strategy

1. **Create Airtable Table**: `AI Model Registry`
2. **Update AIService**: Add Airtable integration layer
3. **Cache Strategy**: 
   - In-memory: 1 hour TTL
   - Airtable: 24 hour freshness check
   - Provider API: Fallback only
4. **Background Job**: Periodic refresh (optional, every 6 hours)

### Code Structure

```typescript
// server/src/services/AIModelRegistryService.ts
export class AIModelRegistryService {
  // Check Airtable for model data
  async getModelsFromAirtable(providerId: string): Promise<Model[]>
  
  // Update Airtable with discovered models
  async updateModelsInAirtable(providerId: string, models: Model[]): Promise<void>
  
  // Get recommended model for provider
  async getRecommendedModel(providerId: string): Promise<string | null>
}

// server/src/services/AIService.ts
export class AIService {
  private modelCache: Map<string, CachedModels>
  private registryService: AIModelRegistryService
  
  async getAvailableModels(providerId, apiKey, baseUrl, forceRefresh) {
    // 1. Check cache
    // 2. Check Airtable
    // 3. Discover from API
    // 4. Update Airtable
    // 5. Update cache
  }
}
```

### Migration Path

1. **Phase 1**: Keep current implementation, add Airtable table
2. **Phase 2**: Add Airtable read layer (read-only)
3. **Phase 3**: Add Airtable write layer (update on discovery)
4. **Phase 4**: Make Airtable primary source, API as fallback
5. **Phase 5**: Add background refresh job

## Implementation Status

✅ **Hybrid Approach Implemented**

The hybrid approach has been implemented with:
- ✅ `AIModelRegistryService` for Airtable integration
- ✅ Updated `AIService` with hybrid model discovery
- ✅ Automatic model discovery and Airtable updates
- ✅ Model verification tracking
- ✅ Setup script for table creation

## Recommendation

**Use the Hybrid Approach** for production systems because:

1. **Scalability**: Essential for multi-instance deployments
2. **Maintainability**: Non-developers can manage models
3. **Performance**: Caching maintains speed
4. **Future-proof**: Can add features like cost tracking, deprecation warnings
5. **Resilience**: Multiple fallback layers

The current implementation is good for **development/testing**, but for **production**, the hybrid approach provides better scalability and maintainability.

