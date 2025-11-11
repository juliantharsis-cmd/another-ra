import Airtable from 'airtable'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Industry Classification & Emission Factors Airtable Service
 * 
 * Handles all Airtable API interactions for Industry Classification & Emission Factors table.
 * This service can be replaced with a PostgreSQL service later
 * without changing the repository interface.
 */
export class IndustryClassificationAirtableService {
  private base: Airtable.Base
  private tableName: string
  private readonly cacheFilePath: string
  private totalCountCache: { count: number; timestamp: number } | null = null
  private readonly COUNT_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private distinctValuesCache: Map<string, { values: string[]; timestamp: number }> = new Map()
  private readonly DISTINCT_VALUES_CACHE_TTL = 10 * 60 * 1000 // 10 minutes

  constructor() {
    const apiKey = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || 
                   process.env.AIRTABLE_API_KEY
    
    if (!apiKey) {
      throw new Error('Airtable API token is required. Set AIRTABLE_PERSONAL_ACCESS_TOKEN in .env file')
    }
    
    const baseId = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 
                   'appGtLbKhmNkkTLVL'
    
    // Use table ID if provided, otherwise use table name
    this.tableName = process.env.AIRTABLE_INDUSTRY_CLASSIFICATION_TABLE_ID || 
                     process.env.AIRTABLE_INDUSTRY_CLASSIFICATION_TABLE_NAME || 
                     'Industry Classification & Emission Factors'
    
    console.log(`🏭 IndustryClassificationAirtableService initialized:`)
    console.log(`   Base ID: ${baseId}`)
    console.log(`   Table: ${this.tableName}`)
    console.log(`   API Key: ${apiKey ? apiKey.substring(0, 20) + '...' : 'NOT SET'}`)
    
    Airtable.configure({ apiKey })
    this.base = Airtable.base(baseId)
    
    // Set cache file path
    this.cacheFilePath = path.join(__dirname, '../../.cache', 'industry-classification-total-count.json')
    this.loadCacheFromDisk()
  }

  /**
   * Load total count cache from disk
   */
  private loadCacheFromDisk(): void {
    try {
      const cacheDir = path.dirname(this.cacheFilePath)
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true })
      }
      
      if (fs.existsSync(this.cacheFilePath)) {
        const cacheData = JSON.parse(fs.readFileSync(this.cacheFilePath, 'utf8'))
        const age = Date.now() - cacheData.timestamp
        
        if (age < 60 * 60 * 1000) {
          this.totalCountCache = cacheData
          console.log(`📊 Loaded Industry Classification total count from disk cache: ${cacheData.count}`)
        }
      }
    } catch (error) {
      console.warn('⚠️  Could not load Industry Classification count cache from disk:', error)
    }
  }

  /**
   * Save total count cache to disk
   */
  private saveCacheToDisk(): void {
    try {
      const cacheDir = path.dirname(this.cacheFilePath)
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true })
      }
      if (this.totalCountCache) {
        fs.writeFileSync(this.cacheFilePath, JSON.stringify(this.totalCountCache), 'utf-8')
      }
    } catch (error) {
      console.warn('⚠️  Could not save Industry Classification count cache to disk:', error)
    }
  }

  /**
   * Map Airtable record to IndustryClassification interface
   */
  mapAirtableToIndustryClassification(record: Airtable.Record<any>): any {
    const fields = record.fields
    
    const result: any = {
      id: record.id,
    }
    
    // System fields to skip
    const systemFields = ['Created', 'Created By', 'Last Modified', 'Last Modified By', 'Last Modified Time']
    
    // Attachment field names (case-insensitive)
    const attachmentFieldNames = [
      'Attachment', 'attachment', 'Attachments', 'attachments'
    ]
    
    // Map all fields dynamically
    Object.keys(fields).forEach(fieldName => {
      if (systemFields.some(sf => fieldName.toLowerCase().includes(sf.toLowerCase()))) {
        return // Skip system fields
      }
      
      const value = fields[fieldName]
      const isAttachmentField = attachmentFieldNames.some(afn => 
        fieldName.toLowerCase() === afn.toLowerCase()
      )
      
      // Handle attachment fields - map "Attachments" (plural) to "Attachment" (singular)
      if (isAttachmentField || (Array.isArray(value) && value.length > 0 && value[0] && typeof value[0] === 'object' && (value[0].url || value[0].id || value[0].filename))) {
        // Always use "Attachment" as the key (singular) regardless of Airtable field name
        if (Array.isArray(value) && value.length > 0) {
          result['Attachment'] = value.map((att: any) => {
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
        } else {
          result['Attachment'] = value || []
        }
      }
      // Handle linked records - extract IDs
      else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0].id && !value[0].url && !value[0].filename) {
        result[fieldName] = value.map((item: any) => item.id || item)
      }
      // Handle all other fields
      else {
        result[fieldName] = value
      }
    })
    
    // Add metadata fields
    result.createdAt = this.formatDate(this.getCreatedTime(record))
    result.updatedAt = this.formatDate(this.getModifiedTime(record))
    result.createdBy = this.getCreatedBy(fields)
    result.lastModifiedBy = this.getLastModifiedBy(fields)
    
    return result
  }

  /**
   * Get all Industry Classification records
   */
  async findAll(): Promise<any[]> {
    try {
      const records = await this.base(this.tableName)
        .select({
          sort: [{ field: 'Name', direction: 'asc' }],
        })
        .all()
      
      return records.map(record => this.mapAirtableToIndustryClassification(record))
    } catch (error: any) {
      console.error('Error in IndustryClassificationAirtableService.findAll:', error)
      throw error
    }
  }

  /**
   * Get paginated Industry Classification records with filtering and search
   */
  async findPaginated(
    offset: number = 0,
    limit: number = 50,
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'asc',
    filters?: Record<string, any>,
    search?: string
  ): Promise<{ records: any[]; total: number }> {
    try {
      const selectParams: Airtable.SelectOptions<any> = {
        pageSize: Math.min(limit, 100), // Airtable max page size is 100
      }

      // Add sorting
      if (sortBy) {
        selectParams.sort = [{ field: sortBy, direction: sortOrder }]
      } else {
        selectParams.sort = [{ field: 'Name', direction: 'asc' }]
      }

      // Add search filter
      if (search && search.trim()) {
        const searchFormula = `SEARCH("${search.trim()}", {Name})`
        selectParams.filterByFormula = searchFormula
      }

      // Add other filters
      if (filters && Object.keys(filters).length > 0) {
        const filterFormulas: string[] = []
        
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
              // Multi-select filter: OR logic
              const orConditions = value.map((v: any) => `{${key}} = "${v}"`).join(', ')
              filterFormulas.push(`OR(${orConditions})`)
            } else {
              filterFormulas.push(`{${key}} = "${value}"`)
            }
          }
        })

        if (filterFormulas.length > 0) {
          const combinedFormula = filterFormulas.length > 1 
            ? `AND(${filterFormulas.join(', ')})` 
            : filterFormulas[0]
          
          if (selectParams.filterByFormula) {
            selectParams.filterByFormula = `AND(${selectParams.filterByFormula}, ${combinedFormula})`
          } else {
            selectParams.filterByFormula = combinedFormula
          }
        }
      }

      console.log(`📥 Fetching paginated Industry Classification: offset=${offset}, limit=${limit}`)
      if (filters) {
        console.log(`🔍 Filters:`, filters)
      }
      if (search) {
        console.log(`🔍 Search:`, search)
      }

      // Calculate total count (with caching)
      const total = await this.getTotalCount(selectParams.filterByFormula)

      // Fetch records
      let allRecords: Airtable.Record<any>[] = []
      let currentOffset = offset
      let fetched = 0

      while (fetched < limit) {
        const pageSize = Math.min(limit - fetched, 100)
        const pageSelectParams: Airtable.SelectOptions<any> = {
          pageSize,
          maxRecords: pageSize,
        }
        
        if (selectParams.sort) {
          pageSelectParams.sort = selectParams.sort
        }
        
        if (selectParams.filterByFormula) {
          pageSelectParams.filterByFormula = selectParams.filterByFormula
        }
        
        const page = await this.base(this.tableName)
          .select(pageSelectParams)
          .all()

        if (page.length === 0) break

        allRecords = allRecords.concat(page)
        fetched += page.length

        if (page.length < pageSize) break
        currentOffset += pageSize
      }

      const mappedRecords = allRecords.map(record => this.mapAirtableToIndustryClassification(record))

      console.log(`✅ Fetched ${mappedRecords.length} Industry Classification records (from ${fetched} fetched, ${total} total)`)

      return {
        records: mappedRecords,
        total,
      }
    } catch (error: any) {
      console.error('Error in IndustryClassificationAirtableService.findPaginated:', error)
      throw error
    }
  }

  /**
   * Get a single Industry Classification by ID
   */
  async findById(id: string): Promise<any | null> {
    try {
      const record = await this.base(this.tableName).find(id)
      return this.mapAirtableToIndustryClassification(record)
    } catch (error: any) {
      if (error.error === 'NOT_FOUND') {
        return null
      }
      console.error('Error in IndustryClassificationAirtableService.findById:', error)
      throw error
    }
  }

  /**
   * Create a new Industry Classification
   */
  async create(data: any): Promise<any> {
    try {
      const fields: any = {}
      
      // Map data to Airtable fields
      Object.keys(data).forEach(key => {
        if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'createdBy' && key !== 'lastModifiedBy') {
          // Map "Attachment" (frontend) to "Attachments" (Airtable)
          if (key === 'Attachment') {
            const attachmentValue = data[key]
            
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
                // Invalid or temporary - clear the field
                fields['Attachments'] = []
              }
            } else {
              fields['Attachments'] = []
            }
          } else {
            fields[key] = data[key]
          }
        }
      })

      const record = await this.base(this.tableName).create([{ fields }])
      this.clearCountCache()
      return this.mapAirtableToIndustryClassification(record[0])
    } catch (error: any) {
      console.error('Error in IndustryClassificationAirtableService.create:', error)
      throw error
    }
  }

  /**
   * Update an existing Industry Classification
   */
  async update(id: string, data: any): Promise<any> {
    try {
      const fields: any = {}
      
      // Map data to Airtable fields
      Object.keys(data).forEach(key => {
        if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'createdBy' && key !== 'lastModifiedBy') {
          // Map "Attachment" (frontend) to "Attachments" (Airtable)
          if (key === 'Attachment') {
            const attachmentValue = data[key]
            
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
                // Invalid or temporary - clear the field
                fields['Attachments'] = []
              }
            } else {
              // Empty or invalid - clear the field
              fields['Attachments'] = []
            }
          } else {
            fields[key] = data[key]
          }
        }
      })

      const record = await this.base(this.tableName).update([{ id, fields }])
      this.clearCountCache()
      return this.mapAirtableToIndustryClassification(record[0])
    } catch (error: any) {
      console.error('Error in IndustryClassificationAirtableService.update:', error)
      throw error
    }
  }

  /**
   * Delete an Industry Classification
   */
  async delete(id: string): Promise<void> {
    try {
      await this.base(this.tableName).destroy([id])
      this.clearCountCache()
    } catch (error: any) {
      console.error('Error in IndustryClassificationAirtableService.delete:', error)
      throw error
    }
  }

  /**
   * Get distinct values for a field (for filters and select options)
   * For select fields, tries to get options from field schema first, then falls back to distinct values
   */
  async getDistinctValues(field: string, limit: number = 100): Promise<string[]> {
    try {
      // For Status field, use shorter cache TTL (1 minute) to allow quick updates
      const isStatusField = field.toLowerCase() === 'status'
      const cacheTTL = isStatusField ? 60 * 1000 : this.DISTINCT_VALUES_CACHE_TTL // 1 minute for Status, 10 minutes for others
      
      // Check cache first
      const cacheKey = `${field}_${limit}`
      const cached = this.distinctValuesCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < cacheTTL) {
        console.log(`📊 Using cached distinct values for Industry Classification ${field}: ${cached.values.length} values`)
        return cached.values
      }

      // Try to get select field options from Airtable Metadata API first (for select fields)
      if (isStatusField) {
        try {
          const selectOptions = await this.getSelectFieldOptions(field)
          if (selectOptions && selectOptions.length > 0) {
            console.log(`📊 Found ${selectOptions.length} Status options from Airtable field schema`)
            
            // Cache the result
            this.distinctValuesCache.set(cacheKey, {
              values: selectOptions,
              timestamp: Date.now(),
            })
            
            return selectOptions
          }
        } catch (error) {
          console.warn(`⚠️ Could not fetch Status options from field schema, falling back to distinct values:`, error)
        }
      }

      // Fallback: Get distinct values from records
      // For Status field, fetch all records to ensure we get all possible values
      const maxRecords = isStatusField ? undefined : limit * 2
      
      const records = await this.base(this.tableName)
        .select({
          fields: [field],
          ...(maxRecords ? { maxRecords } : {}), // No limit for Status field
        })
        .all()

      const values = new Set<string>()
      records.forEach(record => {
        const value = record.fields[field]
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach((v: any) => {
              if (v && typeof v === 'string') {
                values.add(v)
              }
            })
          } else if (typeof value === 'string') {
            values.add(value)
          }
        }
      })

      const distinctValues = Array.from(values).sort().slice(0, limit)
      
      // Cache the result
      this.distinctValuesCache.set(cacheKey, {
        values: distinctValues,
        timestamp: Date.now(),
      })

      console.log(`📊 Found ${distinctValues.length} distinct values for Industry Classification ${field}`)
      return distinctValues
    } catch (error: any) {
      console.error(`Error in IndustryClassificationAirtableService.getDistinctValues for field ${field}:`, error)
      return []
    }
  }

  /**
   * Get select field options from Airtable Metadata API
   */
  private async getSelectFieldOptions(fieldName: string): Promise<string[]> {
    try {
      const apiKey = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY
      const baseId = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 'appGtLbKhmNkkTLVL'
      const tableId = process.env.AIRTABLE_INDUSTRY_CLASSIFICATION_TABLE_ID || this.tableName

      // Use Airtable Metadata API to get field schema
      const metadataUrl = `https://api.airtable.com/v0/meta/bases/${baseId}/tables`
      const response = await fetch(metadataUrl, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Metadata API returned ${response.status}`)
      }

      const data = await response.json() as any
      const table = data.tables?.find((t: any) => 
        t.id === tableId || t.name === this.tableName || t.name === tableId
      )

      if (!table) {
        throw new Error(`Table not found in metadata`)
      }

      const field = table.fields?.find((f: any) => 
        f.name === fieldName || f.name.toLowerCase() === fieldName.toLowerCase()
      )

      if (!field || field.type !== 'singleSelect' && field.type !== 'multipleSelects') {
        throw new Error(`Field ${fieldName} not found or is not a select field`)
      }

      // Extract options from field schema
      const options = field.options?.choices?.map((choice: any) => choice.name) || []
      
      return options.sort()
    } catch (error: any) {
      console.warn(`⚠️ Error fetching select field options for ${fieldName}:`, error.message)
      return []
    }
  }

  /**
   * Get total count of records (with caching)
   */
  async getTotalCount(filterFormula?: string): Promise<number> {
    try {
      // If filter is applied, don't use cache
      if (!filterFormula && this.totalCountCache) {
        const age = Date.now() - this.totalCountCache.timestamp
        if (age < this.COUNT_CACHE_TTL) {
          return this.totalCountCache.count
        }
      }

      const selectParams: Airtable.SelectOptions<any> = {
        maxRecords: 1,
        pageSize: 1,
      }
      
      if (filterFormula) {
        selectParams.filterByFormula = filterFormula
      }

      // Use a small page size to just get the count
      const records = await this.base(this.tableName)
        .select(selectParams)
        .all()

      // For accurate count, we need to fetch all (Airtable limitation)
      // For now, use estimate based on first page
      let total = 0
      if (filterFormula) {
        // With filter, we need to count manually
        const countSelectParams: Airtable.SelectOptions<any> = {
          filterByFormula: filterFormula,
        }
        const allRecords = await this.base(this.tableName)
          .select(countSelectParams)
          .all()
        total = allRecords.length
      } else {
        // Without filter, use cache or estimate
        if (this.totalCountCache && Date.now() - this.totalCountCache.timestamp < this.COUNT_CACHE_TTL * 2) {
          total = this.totalCountCache.count
        } else {
          // Fetch all to get accurate count (cache it)
          const allRecords = await this.base(this.tableName)
            .select({ maxRecords: 10000 })
            .all()
          total = allRecords.length
          
          this.totalCountCache = {
            count: total,
            timestamp: Date.now(),
          }
          this.saveCacheToDisk()
        }
      }

      return total
    } catch (error: any) {
      console.error('Error in IndustryClassificationAirtableService.getTotalCount:', error)
      throw error
    }
  }

  /**
   * Clear count cache
   */
  private clearCountCache(): void {
    this.totalCountCache = null
    try {
      if (fs.existsSync(this.cacheFilePath)) {
        fs.unlinkSync(this.cacheFilePath)
      }
    } catch (error) {
      console.warn('⚠️  Could not delete Industry Classification count cache file:', error)
    }
  }

  /**
   * Helper methods for metadata fields
   */
  private getCreatedTime(record: Airtable.Record<any>): Date | null {
    return record._rawJson?.createdTime ? new Date(record._rawJson.createdTime) : null
  }

  private getModifiedTime(record: Airtable.Record<any>): Date | null {
    return record._rawJson?.fields?.['Last Modified Time'] 
      ? new Date(record._rawJson.fields['Last Modified Time'])
      : record._rawJson?.lastModifiedTime 
      ? new Date(record._rawJson.lastModifiedTime)
      : null
  }

  private getCreatedBy(fields: any): string | undefined {
    return fields['Created By']?.[0]?.name || fields['Created By']?.[0]?.id
  }

  private getLastModifiedBy(fields: any): string | undefined {
    return fields['Last Modified By']?.[0]?.name || fields['Last Modified By']?.[0]?.id
  }

  private formatDate(date: Date | null): string | undefined {
    return date ? date.toISOString() : undefined
  }
}

// Singleton instance
let industryClassificationAirtableServiceInstance: IndustryClassificationAirtableService | null = null

export function getIndustryClassificationAirtableService(): IndustryClassificationAirtableService {
  if (!industryClassificationAirtableServiceInstance) {
    industryClassificationAirtableServiceInstance = new IndustryClassificationAirtableService()
  }
  return industryClassificationAirtableServiceInstance
}

