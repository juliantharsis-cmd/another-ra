/**
 * AI Model Registry Service
 * 
 * Manages AI model availability and metadata in Airtable
 * Provides centralized model management across server instances
 */

import Airtable from 'airtable'

export interface AIModel {
  id: string // Airtable record ID
  providerId: string // 'google', 'openai', 'anthropic'
  modelId: string // Unique model identifier (e.g., 'gemini-1.5-flash-latest')
  modelName: string // Display name
  status: 'active' | 'deprecated' | 'beta' | 'preview'
  available: boolean // Currently available via API
  lastVerified?: Date // Last time model was verified
  discoveryMethod: 'api' | 'manual' | 'fallback'
  costPer1KTokens?: number // Pricing information
  maxTokens?: number // Maximum context window
  features?: string[] // ['chat', 'vision', 'embeddings', 'streaming']
  regions?: string[] // ['us', 'eu', 'global']
  deprecationDate?: Date // When model will be deprecated
  recommended: boolean // Recommended model for provider
  sortOrder?: number // Display order
  metadata?: Record<string, any> // Additional provider-specific data
}

export class AIModelRegistryService {
  private base: Airtable.Base
  private tableName: string = 'AI Model Registry'

  constructor() {
    const apiKey = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY
    const baseId = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || process.env.AIRTABLE_BASE_ID

    if (!apiKey) {
      throw new Error('AIRTABLE_PERSONAL_ACCESS_TOKEN or AIRTABLE_API_KEY must be set in environment variables')
    }

    if (!baseId) {
      throw new Error('AIRTABLE_SYSTEM_CONFIG_BASE_ID or AIRTABLE_BASE_ID must be set in environment variables')
    }

    Airtable.configure({ apiKey })
    this.base = Airtable.base(baseId)
  }

  /**
   * Get all models for a provider
   */
  async getModels(providerId: string, onlyAvailable: boolean = true): Promise<AIModel[]> {
    try {
      // Build fields list - include Provider Name if it exists (will be handled gracefully if it doesn't)
      const baseFields = ['Provider ID', 'Model ID', 'Model Name', 'Status', 'Available', 'Last Verified', 
                          'Discovery Method', 'Cost per 1K tokens', 'Max Tokens', 'Features', 'Regions', 
                          'Deprecation Date', 'Recommended', 'Sort Order', 'Metadata', 'Provider']
      
      const records = await this.base(this.tableName)
        .select({
          filterByFormula: onlyAvailable
            ? `AND({Provider ID} = '${providerId}', {Available} = TRUE())`
            : `{Provider ID} = '${providerId}'`,
          sort: [{ field: 'Sort Order', direction: 'asc' }, { field: 'Model Name', direction: 'asc' }],
          // Don't specify fields explicitly - let Airtable return all fields (including Provider Name if it exists)
        })
        .all()

      // Map records - resolve provider names in parallel
      const models = await Promise.all(records.map(record => this.mapRecordToModel(record)))
      return models
    } catch (error) {
      console.error(`Error fetching models for ${providerId} from Airtable:`, error)
      return []
    }
  }

  /**
   * Get recommended model for a provider
   */
  async getRecommendedModel(providerId: string): Promise<string | null> {
    try {
      const records = await this.base(this.tableName)
        .select({
          filterByFormula: `AND({Provider ID} = '${providerId}', {Recommended} = TRUE(), {Available} = TRUE())`,
          maxRecords: 1,
          sort: [{ field: 'Sort Order', direction: 'asc' }],
          // Don't specify fields explicitly - let Airtable return all fields
        })
        .all()

      if (records.length > 0) {
        const model = await this.mapRecordToModel(records[0])
        return model.modelId
      }
      return null
    } catch (error) {
      console.error(`Error fetching recommended model for ${providerId}:`, error)
      return null
    }
  }

  /**
   * Update or create models from API discovery
   */
  async updateModelsFromDiscovery(
    providerId: string,
    models: Array<{ id: string; name: string; supportsGenerateContent?: boolean }>
  ): Promise<void> {
    try {
      // Get existing models for this provider
      const existingRecords = await this.base(this.tableName)
        .select({
          filterByFormula: `{Provider ID} = '${providerId}'`,
        })
        .all()

      const existingModels = new Map<string, any>()
      existingRecords.forEach(record => {
        const modelId = record.fields['Model ID'] as string
        if (modelId) {
          existingModels.set(modelId, record)
        }
      })

      // Update or create models
      const updates: any[] = []
      const creates: any[] = []

      for (const model of models) {
        const existing = existingModels.get(model.id)
        const now = new Date().toISOString()

        if (existing) {
          // Update existing model
          updates.push({
            id: existing.id,
            fields: {
              'Available': true,
              'Last Verified': now,
              'Discovery Method': 'api',
              'Status': 'active',
            },
          })
        } else {
          // Create new model
          creates.push({
            fields: {
              'Provider ID': providerId,
              'Model ID': model.id,
              'Model Name': model.name || model.id,
              'Status': 'active',
              'Available': true,
              'Last Verified': now,
              'Discovery Method': 'api',
              'Recommended': false,
              'Sort Order': creates.length + 1,
            },
          })
        }
      }

      // Mark models not in discovery as unavailable
      const discoveredIds = new Set(models.map(m => m.id))
      for (const [modelId, record] of existingModels.entries()) {
        if (!discoveredIds.has(modelId)) {
          updates.push({
            id: record.id,
            fields: {
              'Available': false,
              'Last Verified': new Date().toISOString(),
            },
          })
        }
      }

      // Batch update existing records
      if (updates.length > 0) {
        // Airtable allows up to 10 records per batch
        for (let i = 0; i < updates.length; i += 10) {
          const batch = updates.slice(i, i + 10)
          await this.base(this.tableName).update(batch)
        }
      }

      // Batch create new records
      if (creates.length > 0) {
        // Airtable allows up to 10 records per batch
        for (let i = 0; i < creates.length; i += 10) {
          const batch = creates.slice(i, i + 10)
          await this.base(this.tableName).create(batch)
        }
      }

      console.log(`Updated ${updates.length} models and created ${creates.length} new models for ${providerId}`)
    } catch (error) {
      console.error(`Error updating models for ${providerId} in Airtable:`, error)
      throw error
    }
  }

  /**
   * Verify a model is working and update availability
   */
  async verifyModel(providerId: string, modelId: string, isWorking: boolean): Promise<void> {
    try {
      const records = await this.base(this.tableName)
        .select({
          filterByFormula: `AND({Provider ID} = '${providerId}', {Model ID} = '${modelId}')`,
          maxRecords: 1,
          // Don't specify fields explicitly - let Airtable return all fields
        })
        .all()

      if (records.length > 0) {
        await this.base(this.tableName).update([
          {
            id: records[0].id,
            fields: {
              'Available': isWorking,
              'Last Verified': new Date().toISOString(),
            },
          },
        ])
      }
    } catch (error) {
      console.error(`Error verifying model ${modelId} for ${providerId}:`, error)
    }
  }

  /**
   * Resolve provider name from linked Provider record
   */
  private async resolveProviderName(providerRecordIds: string | string[]): Promise<string | undefined> {
    if (!providerRecordIds) return undefined
    
    const ids = Array.isArray(providerRecordIds) ? providerRecordIds : [providerRecordIds]
    if (ids.length === 0) return undefined

    try {
      // Fetch the linked provider record to get its name
      const providerRecords = await this.base('Integration Marketplace')
        .select({
          filterByFormula: `OR(${ids.map(id => `RECORD_ID() = "${id}"`).join(', ')})`,
          fields: ['Name'],
          maxRecords: 1,
        })
        .firstPage()

      if (providerRecords.length > 0) {
        return providerRecords[0].fields['Name'] as string
      }
    } catch (error) {
      console.warn('Error resolving provider name:', error)
    }
    return undefined
  }

  /**
   * Map Airtable record to AIModel
   */
  private async mapRecordToModel(record: any): Promise<AIModel> {
    const fields = record.fields

    // Try to get provider name from lookup field first (if it exists), otherwise resolve from linked record
    // Check for various possible field names (lookup fields can have different names)
    let providerName: string | undefined = 
      (fields['Provider Name'] as string | string[] | undefined) ||
      (fields['Provider Name (Lookup)'] as string | string[] | undefined) ||
      (fields['Provider Name (from Provider)'] as string | string[] | undefined)
    
    // Handle array case (lookup fields can return arrays)
    if (Array.isArray(providerName)) {
      providerName = providerName[0] || undefined
    }
    
    // If lookup field doesn't exist or is empty, resolve from linked record
    if (!providerName && fields['Provider']) {
      providerName = await this.resolveProviderName(fields['Provider'])
    }

    return {
      id: record.id,
      providerId: fields['Provider ID'] || '',
      modelId: fields['Model ID'] || '',
      modelName: fields['Model Name'] || fields['Model ID'] || '',
      status: (fields['Status'] || 'active').toLowerCase(),
      available: fields['Available'] === true,
      lastVerified: fields['Last Verified'] ? new Date(fields['Last Verified']) : undefined,
      discoveryMethod: (fields['Discovery Method'] || 'api').toLowerCase(),
      costPer1KTokens: fields['Cost per 1K tokens'] || undefined,
      maxTokens: fields['Max Tokens'] || undefined,
      features: fields['Features'] ? (Array.isArray(fields['Features']) ? fields['Features'] : [fields['Features']]) : [],
      regions: fields['Regions'] ? (Array.isArray(fields['Regions']) ? fields['Regions'] : [fields['Regions']]) : [],
      deprecationDate: fields['Deprecation Date'] ? new Date(fields['Deprecation Date']) : undefined,
      recommended: fields['Recommended'] === true,
      sortOrder: fields['Sort Order'] || 0,
      metadata: {
        ...(fields['Metadata'] ? (typeof fields['Metadata'] === 'string' ? JSON.parse(fields['Metadata']) : fields['Metadata']) : {}),
        providerName, // Add resolved provider name to metadata
      },
    }
  }
}

