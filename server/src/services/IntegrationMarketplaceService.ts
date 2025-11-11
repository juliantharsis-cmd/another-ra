/**
 * Integration Marketplace Service
 * 
 * Service for managing AI provider configurations from Airtable
 */

import Airtable from 'airtable'

export interface IntegrationMarketplaceProvider {
  id: string
  name: string
  providerId: string
  description: string
  icon: string
  category: 'llm' | 'vision' | 'speech' | 'custom'
  authType: 'api_key' | 'pat' | 'oauth' | 'custom'
  baseUrl?: string
  documentationUrl?: string
  supportedModels?: string[]
  defaultModel?: string
  features: string[]
  enabled: boolean
  sortOrder?: number
  Attachment?: any[] // Attachment field (singular key for frontend, maps to "Attachments" in Airtable)
}

export class IntegrationMarketplaceService {
  private base: Airtable.Base
  private tableName: string = 'Integration Marketplace'

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
   * Get all enabled providers (for marketplace UI)
   */
  async getProviders(): Promise<IntegrationMarketplaceProvider[]> {
    try {
      const records = await this.base(this.tableName)
        .select({
          filterByFormula: '{Enabled} = TRUE()',
          sort: [
            { field: 'Sort Order', direction: 'asc' },
            { field: 'Name', direction: 'asc' },
          ],
        })
        .all()

      return records.map(record => this.mapRecordToProvider(record))
    } catch (error) {
      console.error('Error fetching enabled providers:', error)
      throw new Error(`Failed to fetch providers: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get all providers including disabled (for admin management)
   */
  async getAllProviders(): Promise<IntegrationMarketplaceProvider[]> {
    try {
      const records = await this.base(this.tableName)
        .select({
          sort: [
            { field: 'Sort Order', direction: 'asc' },
            { field: 'Name', direction: 'asc' },
          ],
        })
        .all()

      return records.map(record => this.mapRecordToProvider(record))
    } catch (error) {
      console.error('Error fetching all providers:', error)
      throw new Error(`Failed to fetch all providers: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get provider by record ID
   */
  async getProviderById(id: string): Promise<IntegrationMarketplaceProvider | null> {
    try {
      const record = await this.base(this.tableName).find(id)
      return this.mapRecordToProvider(record)
    } catch (error) {
      console.error(`Error fetching provider ${id}:`, error)
      return null
    }
  }

  /**
   * Create new provider
   */
  async createProvider(data: Omit<IntegrationMarketplaceProvider, 'id'>): Promise<IntegrationMarketplaceProvider> {
    try {
      const fields: any = {
        'Name': data.name,
        'Provider ID': data.providerId,
        'Description': data.description,
        'Icon': data.icon || 'custom',
        'Category': data.category,
        'Auth Type': data.authType,
        'Enabled': data.enabled !== false, // Default to true
      }

      if (data.baseUrl) fields['Base URL'] = data.baseUrl
      if (data.documentationUrl) fields['Documentation URL'] = data.documentationUrl
      
      // Handle supportedModels - can be array or comma-separated string
      if (data.supportedModels) {
        if (Array.isArray(data.supportedModels) && data.supportedModels.length > 0) {
          fields['Supported Models'] = data.supportedModels.join(', ')
        } else if (typeof data.supportedModels === 'string' && data.supportedModels.trim()) {
          fields['Supported Models'] = data.supportedModels
        }
      }
      
      if (data.defaultModel) fields['Default Model'] = data.defaultModel
      
      // Handle features - can be array or comma-separated string
      if (data.features) {
        if (Array.isArray(data.features) && data.features.length > 0) {
          fields['Features'] = data.features.join(', ')
        } else if (typeof data.features === 'string' && data.features.trim()) {
          fields['Features'] = data.features
        }
      }
      
      if (data.sortOrder !== undefined) fields['Sort Order'] = data.sortOrder
      
      // Handle attachments - map "Attachment" (frontend) to "Attachments" (Airtable)
      if (data.Attachment) {
        const attachmentValue = data.Attachment
        
        // Handle attachment field - filter out temporary uploads and format for Airtable
        if (Array.isArray(attachmentValue)) {
          // Filter out temporary file objects and data URLs
          const validAttachments = attachmentValue.filter((att: any) => {
            if (!att || typeof att !== 'object') return false
            if (att._isNewUpload || att._isTemporary || att._uploadFailed) return false
            if (att.url && att.url.startsWith('data:')) return false
            if (att.id && att.url && (att.url.startsWith('http://') || att.url.startsWith('https://'))) {
              return true
            }
            return false
          })
          
          fields['Attachments'] = validAttachments.length > 0 ? validAttachments : []
        } else if (attachmentValue && typeof attachmentValue === 'object') {
          // Single attachment object
          if (!attachmentValue._isNewUpload && 
              !attachmentValue._isTemporary && 
              !attachmentValue._uploadFailed &&
              attachmentValue.id && 
              attachmentValue.url && 
              (attachmentValue.url.startsWith('http://') || attachmentValue.url.startsWith('https://'))) {
            fields['Attachments'] = [attachmentValue]
          } else {
            fields['Attachments'] = []
          }
        }
      }

      const record = await this.base(this.tableName).create(fields)
      return this.mapRecordToProvider(record)
    } catch (error) {
      console.error('Error creating provider:', error)
      throw new Error(`Failed to create provider: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Update existing provider
   */
  async updateProvider(id: string, updates: Partial<IntegrationMarketplaceProvider>): Promise<IntegrationMarketplaceProvider> {
    try {
      const fields: any = {}

      if (updates.name !== undefined) fields['Name'] = updates.name
      if (updates.providerId !== undefined) fields['Provider ID'] = updates.providerId
      if (updates.description !== undefined) fields['Description'] = updates.description
      if (updates.icon !== undefined) fields['Icon'] = updates.icon
      if (updates.category !== undefined) fields['Category'] = updates.category
      if (updates.authType !== undefined) fields['Auth Type'] = updates.authType
      if (updates.baseUrl !== undefined) fields['Base URL'] = updates.baseUrl || null
      if (updates.documentationUrl !== undefined) fields['Documentation URL'] = updates.documentationUrl || null
      
      // Handle supportedModels - can be array or comma-separated string
      if (updates.supportedModels !== undefined) {
        if (Array.isArray(updates.supportedModels)) {
          fields['Supported Models'] = updates.supportedModels.length > 0
            ? updates.supportedModels.join(', ')
            : null
        } else if (typeof updates.supportedModels === 'string') {
          fields['Supported Models'] = updates.supportedModels.trim() || null
        } else {
          fields['Supported Models'] = null
        }
      }
      
      if (updates.defaultModel !== undefined) fields['Default Model'] = updates.defaultModel || null
      
      // Handle features - can be array or comma-separated string
      if (updates.features !== undefined) {
        if (Array.isArray(updates.features)) {
          fields['Features'] = updates.features.length > 0
            ? updates.features.join(', ')
            : null
        } else if (typeof updates.features === 'string') {
          fields['Features'] = updates.features.trim() || null
        } else {
          fields['Features'] = null
        }
      }
      
      if (updates.enabled !== undefined) fields['Enabled'] = updates.enabled
      if (updates.sortOrder !== undefined) fields['Sort Order'] = updates.sortOrder || null
      
      // Handle attachments - map "Attachment" (frontend) to "Attachments" (Airtable)
      if (updates.Attachment !== undefined) {
        const attachmentValue = updates.Attachment
        
        // Handle attachment field - filter out temporary uploads and format for Airtable
        if (Array.isArray(attachmentValue)) {
          // Filter out temporary file objects and data URLs (Airtable requires real HTTP URLs)
          const validAttachments = attachmentValue.filter((att: any) => {
            if (!att || typeof att !== 'object') return false
            
            // Skip temporary uploads
            if (att._isNewUpload || att._isTemporary || att._uploadFailed) return false
            
            // Skip data URLs - Airtable requires real HTTP/HTTPS URLs
            if (att.url && att.url.startsWith('data:')) return false
            
            // Keep only valid Airtable attachment objects (those with id and real URL)
            if (att.id && att.url && (att.url.startsWith('http://') || att.url.startsWith('https://'))) {
              return true
            }
            
            return false
          })
          
          // Format attachments for Airtable (array of attachment objects)
          fields['Attachments'] = validAttachments.length > 0 ? validAttachments : []
        } else if (attachmentValue && typeof attachmentValue === 'object') {
          // Single attachment object - check if it's valid
          if (!attachmentValue._isNewUpload && 
              !attachmentValue._isTemporary && 
              !attachmentValue._uploadFailed &&
              attachmentValue.id && 
              attachmentValue.url && 
              (attachmentValue.url.startsWith('http://') || attachmentValue.url.startsWith('https://'))) {
            fields['Attachments'] = [attachmentValue]
          } else {
            fields['Attachments'] = []
          }
        } else {
          fields['Attachments'] = []
        }
      }

      const record = await this.base(this.tableName).update(id, fields)
      return this.mapRecordToProvider(record)
    } catch (error) {
      console.error(`Error updating provider ${id}:`, error)
      throw new Error(`Failed to update provider: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete provider
   */
  async deleteProvider(id: string): Promise<boolean> {
    try {
      await this.base(this.tableName).destroy(id)
      return true
    } catch (error) {
      console.error(`Error deleting provider ${id}:`, error)
      throw new Error(`Failed to delete provider: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Map Airtable record to IntegrationMarketplaceProvider
   */
  private mapRecordToProvider(record: any): IntegrationMarketplaceProvider {
    const fields = record.fields

    // Parse comma-separated strings into arrays
    const parseCommaSeparated = (value: string | undefined): string[] => {
      if (!value) return []
      return value.split(',').map(s => s.trim()).filter(s => s.length > 0)
    }

    // Handle attachments - map "Attachments" (Airtable) to "Attachment" (frontend)
    let attachmentValue: any[] = []
    if (fields['Attachments']) {
      if (Array.isArray(fields['Attachments'])) {
        attachmentValue = fields['Attachments'].map((att: any) => {
          if (att && typeof att === 'object') {
            return {
              id: att.id,
              url: att.url,
              filename: att.filename || att.name || 'attachment',
              size: att.size,
              type: att.type,
              thumbnails: att.thumbnails,
              width: att.width,
              height: att.height
            }
          }
          return att
        })
      } else if (fields['Attachments'] && typeof fields['Attachments'] === 'object') {
        attachmentValue = [fields['Attachments']]
      }
    }

    return {
      id: record.id,
      name: fields['Name'] || '',
      providerId: fields['Provider ID'] || '',
      description: fields['Description'] || '',
      icon: fields['Icon'] || 'custom',
      category: (fields['Category'] as any) || 'custom',
      authType: (fields['Auth Type'] as any) || 'api_key',
      baseUrl: fields['Base URL'] || undefined,
      documentationUrl: fields['Documentation URL'] || undefined,
      supportedModels: fields['Supported Models']
        ? parseCommaSeparated(fields['Supported Models'])
        : undefined,
      defaultModel: fields['Default Model'] || undefined,
      features: parseCommaSeparated(fields['Features']),
      enabled: fields['Enabled'] !== false, // Default to true if not set
      sortOrder: fields['Sort Order'] || undefined,
      Attachment: attachmentValue.length > 0 ? attachmentValue : undefined,
    }
  }
}

