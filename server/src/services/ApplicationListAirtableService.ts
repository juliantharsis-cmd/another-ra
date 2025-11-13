import Airtable from 'airtable'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Application List Airtable Service
 * 
 * Handles all Airtable API interactions for Application List table.
 * This service can be replaced with a PostgreSQL service later
 * without changing the repository interface.
 */
export class ApplicationListAirtableService {
  private base: Airtable.Base
  private tableName: string
  private readonly cacheFilePath: string
  private totalCountCache: { count: number; timestamp: number } | null = null
  private readonly COUNT_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private distinctValuesCache: Map<string, { values: string[]; timestamp: number }> = new Map()
  private readonly DISTINCT_VALUES_CACHE_TTL = 10 * 60 * 1000 // 10 minutes
  private countCalculationPromise: Promise<number> | null = null

  constructor() {
    const apiKey = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || 
                   process.env.AIRTABLE_API_KEY
    
    if (!apiKey) {
      throw new Error('Airtable API token is required. Set AIRTABLE_PERSONAL_ACCESS_TOKEN in .env file')
    }
    
    const baseId = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 
                   'appGtLbKhmNkkTLVL'
    
    // Use table ID if provided, otherwise use table name
    this.tableName = process.env.AIRTABLE_APPLICATION_LIST_TABLE_ID || 
                     process.env.AIRTABLE_APPLICATION_LIST_TABLE_NAME || 
                     'Application List' // Default table name in Airtable
    
    console.log(`🌿 ApplicationListAirtableService initialized:`)
    console.log(`   Base ID: ${baseId}`)
    console.log(`   Table: ${this.tableName}`)
    console.log(`   API Key: ${apiKey ? apiKey.substring(0, 20) + '...' : 'NOT SET'}`)
    
    Airtable.configure({ apiKey })
    this.base = Airtable.base(baseId)
    
    // Set cache file path
    this.cacheFilePath = path.join(__dirname, '../../.cache', 'ghg-type-total-count.json')
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
          console.log(`📊 Loaded Application List total count from disk cache: ${cacheData.count}`)
        }
      }
    } catch (error) {
      console.warn('⚠️  Could not load Application List count cache from disk:', error)
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
      console.warn('⚠️  Could not save Application List count cache to disk:', error)
    }
  }

  /**
   * Clear total count cache
   */
  private clearCountCache(): void {
    this.totalCountCache = null
    try {
      if (fs.existsSync(this.cacheFilePath)) {
        fs.unlinkSync(this.cacheFilePath)
      }
    } catch (error) {
      console.warn('⚠️  Could not delete Application List count cache file:', error)
    }
  }

  /**
   * Clear distinct values cache
   */
  private clearDistinctValuesCache(): void {
    this.distinctValuesCache.clear()
  }

  /**
   * Map Airtable record to ApplicationList interface
   */
  mapAirtableToApplicationList(record: Airtable.Record<any>): any {
    const fields = record.fields
    
    const getField = (fieldNames: string[], defaultValue: any = '') => {
      for (const name of fieldNames) {
        if (fields[name] !== undefined && fields[name] !== null && fields[name] !== '') {
          return fields[name]
        }
      }
      return defaultValue
    }
    
    // Map Airtable field names to our ApplicationList interface
    // Synchronize: Name, Description, Alt URL, Attachment, Status, Order
    const Name = getField(['Name', 'name'], '')
    const Description = getField(['Description', 'description'], '')
    const AltURL = getField(['Alt URL', 'altUrl', 'alt_url'], '')
    const Attachment = getField(['Attachment', 'attachment', 'Attachments', 'attachments'], [])
    const Status = getField(['Status', 'status'], 'Active')
    const Order = getField(['Order', 'order', 'Sequence', 'sequence'], 0)
    
    return {
      id: record.id,
      Name,
      Description,
      'Alt URL': AltURL,
      Attachment: Array.isArray(Attachment) ? Attachment : (Attachment ? [Attachment] : []),
      Status,
      Order: typeof Order === 'number' ? Order : (parseInt(String(Order)) || 0),
      createdAt: this.formatDate(this.getCreatedTime(record)),
      updatedAt: this.formatDate(this.getModifiedTime(record)),
      createdBy: this.getCreatedBy(fields),
      lastModifiedBy: this.getLastModifiedBy(fields),
    }
  }

  /**
   * Map ApplicationList DTO to Airtable fields
   * Synchronize: Name, Description, Alt URL, Attachment, Status, Order
   */
  mapApplicationListToAirtable(dto: any): Record<string, any> {
    const fields: Record<string, any> = {}
    
    // Map to actual Airtable field names
    if (dto.Name !== undefined && dto.Name !== null && String(dto.Name).trim() !== '') {
      fields['Name'] = String(dto.Name).trim()
    }
    if (dto.Description !== undefined && dto.Description !== null && String(dto.Description).trim() !== '') {
      fields['Description'] = String(dto.Description).trim()
    }
    if (dto['Alt URL'] !== undefined && dto['Alt URL'] !== null && String(dto['Alt URL']).trim() !== '') {
      fields['Alt URL'] = String(dto['Alt URL']).trim()
    }
    if (dto.Attachment !== undefined && dto.Attachment !== null) {
      // Airtable attachment field expects array of attachment objects
      fields['Attachment'] = Array.isArray(dto.Attachment) ? dto.Attachment : (dto.Attachment ? [dto.Attachment] : [])
    }
    if (dto.Status !== undefined && dto.Status !== null) {
      fields['Status'] = String(dto.Status).trim()
    } else {
      fields['Status'] = 'Active' // Default
    }
    if (dto.Order !== undefined && dto.Order !== null) {
      fields['Order'] = typeof dto.Order === 'number' ? dto.Order : (parseInt(String(dto.Order)) || 0)
    }
    
    return fields
  }

  /**
   * Map field name to Airtable field name
   */
  private mapFieldNameToAirtable(fieldName: string): string {
    const mapping: Record<string, string> = {
      'Name': 'Name',
      'name': 'Name',
      'Description': 'Description',
      'description': 'Description',
      'Alt URL': 'Alt URL',
      'altUrl': 'Alt URL',
      'alt_url': 'Alt URL',
      'Attachment': 'Attachment',
      'attachment': 'Attachment',
      'Status': 'Status',
      'status': 'Status',
      'Order': 'Order',
      'order': 'Order',
    }
    return mapping[fieldName] || fieldName
  }

  /**
   * Get all Application List records from Airtable
   */
  async findAll(): Promise<any[]> {
    try {
      console.log(`📥 Fetching ALL Application List records from Airtable table: ${this.tableName}`)
      
      const records = await this.base(this.tableName)
        .select({
          sort: [{ field: 'Name', direction: 'asc' }],
        })
        .all()
      
      console.log(`✅ Fetched ${records.length} total records from Airtable`)
      
      return records.map(record => this.mapAirtableToApplicationList(record))
    } catch (error: any) {
      console.error('Error fetching Application List from Airtable:', error)
      
      if (error.error === 'NOT_AUTHORIZED' || error.statusCode === 403) {
        throw new Error(`Airtable authentication failed (403). Check your API token permissions.`)
      }
      if (error.error === 'NOT_FOUND' || error.statusCode === 404) {
        throw new Error(`Airtable table not found (404). Check table name "${this.tableName}" and base ID.`)
      }
      
      throw new Error(`Failed to fetch Application List from Airtable: ${error.error || error.message || 'Unknown error'}`)
    }
  }

  /**
   * Get paginated Application List records from Airtable
   */
  async findPaginated(
    offset: number = 0, 
    limit: number = 50, 
    sortBy?: string, 
    sortOrder: 'asc' | 'desc' = 'asc',
    filters?: Record<string, any>,
    search?: string
  ): Promise<{ records: any[], total: number }> {
    try {
      console.log(`📥 Fetching paginated Application List: offset=${offset}, limit=${limit}`)
      
      const startRecordIndex = offset
      const endRecordIndex = offset + limit
      const startPage = Math.floor(startRecordIndex / 100) + 1
      const endPage = Math.ceil(endRecordIndex / 100)
      
      let allRecords: Airtable.Record<any>[] = []
      let currentPage = 0
      
      const sortField = sortBy && sortBy.trim() !== '' ? this.mapFieldNameToAirtable(sortBy) : 'Name'
      const sortDirection = sortOrder === 'desc' ? 'desc' : 'asc'
      
      if (sortBy && sortBy.trim() !== '') {
        console.log(`   Sorting by: ${sortBy} -> ${sortField} (${sortDirection})`)
      } else {
        console.log(`   Using default sort: Name (asc)`)
      }
      
      // Build Airtable filter formula
      const filterFormulas: string[] = []
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            const airtableFieldName = this.mapFieldNameToAirtable(key)
            const escapedValue = String(value).replace(/'/g, "''")
            filterFormulas.push(`{${airtableFieldName}} = '${escapedValue}'`)
          }
        })
      }
      
      if (search) {
        // Search across multiple fields - only the synchronized fields
        const searchFields = ['Name', 'Description']
        const escapedSearch = search.replace(/'/g, "''")
        const searchFormulas = searchFields.map(field => 
          `FIND(LOWER('${escapedSearch}'), LOWER({${field}})) > 0`
        )
        filterFormulas.push(`OR(${searchFormulas.join(', ')})`)
      }
      
      const filterFormula = filterFormulas.length > 0 ? `AND(${filterFormulas.join(', ')})` : undefined
      
      if (filterFormula) {
        console.log(`   Applying filter formula: ${filterFormula}`)
      }
      
      // Fetch only the pages we need
      await new Promise<void>((resolve, reject) => {
        const selectOptions: any = {
          sort: [{ field: sortField, direction: sortDirection }],
          pageSize: 100,
        }
        
        if (filterFormula) {
          selectOptions.filterByFormula = filterFormula
        }
        
        this.base(this.tableName)
          .select(selectOptions)
          .eachPage(
            (records, fetchNextPage) => {
              currentPage++
              
              if (currentPage < startPage) {
                fetchNextPage()
                return
              }
              
              allRecords.push(...records)
              
              if (currentPage >= endPage) {
                resolve()
                return
              }
              
              fetchNextPage()
            },
            (err) => {
              if (err) {
                reject(err)
              } else {
                resolve()
              }
            }
          )
      })
      
      const startIndexInFetched = startRecordIndex % 100
      const endIndexInFetched = startIndexInFetched + limit
      const paginatedRecords = allRecords.slice(startIndexInFetched, endIndexInFetched)
      
      console.log(`✅ Fetched ${paginatedRecords.length} records from pages ${startPage}-${endPage}`)
      
      // Get total count
      let total: number
      if (filterFormula) {
        total = await this.getFilteredCount(filterFormula)
        console.log(`   Filtered total count: ${total}`)
      } else {
        total = await this.getTotalCount(true)
      }

      return {
        records: paginatedRecords.map(record => this.mapAirtableToApplicationList(record)),
        total,
      }
    } catch (error: any) {
      console.error('❌ Error fetching paginated Application List from Airtable:', error)
      
      if (error.error === 'NOT_AUTHORIZED' || error.statusCode === 403) {
        throw new Error(`Airtable authentication failed (403). The table "${this.tableName}" may not exist or the API token may not have access to it.`)
      }
      if (error.error === 'NOT_FOUND' || error.statusCode === 404) {
        throw new Error(`Airtable table not found (404). Table "${this.tableName}" does not exist in base.`)
      }
      
      throw new Error(`Failed to fetch Application List: ${error.error || error.message || 'Unknown error'}`)
    }
  }

  /**
   * Get a single Application List record by ID
   */
  async findById(id: string): Promise<any | null> {
    try {
      const record = await this.base(this.tableName).find(id)
      return this.mapAirtableToApplicationList(record)
    } catch (error: any) {
      if (error.statusCode === 404 || error.error === 'NOT_FOUND') {
        return null
      }
      throw new Error(`Failed to fetch Application List: ${error.error || error.message || 'Unknown error'}`)
    }
  }

  /**
   * Create a new Application List record
   */
  async create(fields: Record<string, any>): Promise<any> {
    try {
      console.log(`📝 Creating Application List in Airtable`)
      const airtableFields = this.mapApplicationListToAirtable(fields)
      console.log(`   Mapped Airtable fields:`, JSON.stringify(airtableFields, null, 2))
      
      const record = await this.base(this.tableName).create(airtableFields)
      console.log(`✅ Successfully created Application List in Airtable: ${record.id}`)
      
      this.clearCountCache()
      this.clearDistinctValuesCache()
      
      return this.mapAirtableToApplicationList(record)
    } catch (error: any) {
      console.error('❌ Error creating Application List in Airtable:', error)
      throw new Error(`Failed to create Application List: ${error.error || error.message || 'Unknown error'}`)
    }
  }

  /**
   * Update a Application List record
   */
  async update(id: string, fields: Record<string, any>): Promise<any> {
    try {
      console.log(`📝 Updating Application List in Airtable: ${id}`)
      const airtableFields = this.mapApplicationListToAirtable(fields)
      
      const record = await this.base(this.tableName).update(id, airtableFields)
      console.log(`✅ Successfully updated Application List: ${id}`)
      
      return this.mapAirtableToApplicationList(record)
    } catch (error: any) {
      console.error(`❌ Error updating Application List ${id}:`, error)
      if (error.statusCode === 404 || error.error === 'NOT_FOUND') {
        return null
      }
      throw new Error(`Failed to update Application List: ${error.error || error.message || 'Unknown error'}`)
    }
  }

  /**
   * Delete a Application List record
   */
  async delete(id: string): Promise<boolean> {
    try {
      await this.base(this.tableName).destroy(id)
      this.clearCountCache()
      this.clearDistinctValuesCache()
      return true
    } catch (error: any) {
      if (error.statusCode === 404 || error.error === 'NOT_FOUND') {
        return false
      }
      throw new Error(`Failed to delete Application List: ${error.error || error.message || 'Unknown error'}`)
    }
  }

  /**
   * Get total count with lazy calculation
   */
  async getTotalCount(lazy: boolean = true): Promise<number> {
    try {
      if (this.totalCountCache && Date.now() - this.totalCountCache.timestamp < this.COUNT_CACHE_TTL) {
        console.log(`📊 Using cached total count for Application List: ${this.totalCountCache.count}`)
        return this.totalCountCache.count
      }

      if (lazy && !this.totalCountCache) {
        console.log(`📊 No cache available for Application List, returning estimate and calculating in background...`)
        const estimate = 100
        this.calculateTotalCountInBackground()
        return estimate
      }

      return await this.calculateTotalCount()
    } catch (error: any) {
      console.error('Error getting Application List total count:', error)
      if (this.totalCountCache) {
        console.warn(`⚠️  Using expired cache: ${this.totalCountCache.count}`)
        return this.totalCountCache.count
      }
      return 0
    }
  }

  /**
   * Calculate total count in background
   */
  private calculateTotalCountInBackground(): void {
    if (this.countCalculationPromise) {
      return // Already calculating
    }

    this.countCalculationPromise = this.calculateTotalCount()
      .then(count => {
        this.totalCountCache = { count, timestamp: Date.now() }
        this.saveCacheToDisk()
        this.countCalculationPromise = null
      })
      .catch(error => {
        console.error('Error calculating Application List total count in background:', error)
        this.countCalculationPromise = null
      })
  }

  /**
   * Calculate total count synchronously
   */
  private async calculateTotalCount(): Promise<number> {
    try {
      let count = 0
      await new Promise<void>((resolve, reject) => {
        this.base(this.tableName)
          .select()
          .eachPage(
            (records, fetchNextPage) => {
              count += records.length
              fetchNextPage()
            },
            (err) => {
              if (err) {
                reject(err)
              } else {
                resolve()
              }
            }
          )
      })
      return count
    } catch (error: any) {
      console.error('Error calculating Application List total count:', error)
      return 0
    }
  }

  /**
   * Get filtered count
   */
  private async getFilteredCount(filterFormula: string): Promise<number> {
    try {
      let count = 0
      await new Promise<void>((resolve, reject) => {
        this.base(this.tableName)
          .select({
            filterByFormula: filterFormula,
          })
          .eachPage(
            (records, fetchNextPage) => {
              count += records.length
              fetchNextPage()
            },
            (err) => {
              if (err) {
                reject(err)
              } else {
                resolve()
              }
            }
          )
      })
      return count
    } catch (error: any) {
      console.error('Error getting filtered count for Application List:', error)
      return 0
    }
  }

  /**
   * Get unique/distinct values for a field
   */
  async getDistinctValues(fieldName: string, limit: number = 1000): Promise<string[]> {
    try {
      const cacheKey = `${fieldName}_${limit}`
      const cached = this.distinctValuesCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.DISTINCT_VALUES_CACHE_TTL) {
        console.log(`📊 Using cached distinct values for Application List ${fieldName}: ${cached.values.length} values`)
        return cached.values
      }
      
      console.log(`📊 Fetching distinct values for Application List field: ${fieldName}`)
      
      const airtableFieldName = this.mapFieldNameToAirtable(fieldName)
      console.log(`   Mapped to Airtable field: ${airtableFieldName}`)
      
      const uniqueValues = new Set<string>()
      let fetchedCount = 0
      let pageCount = 0
      let consecutivePagesWithNoNewValues = 0
      const maxConsecutivePagesWithoutNewValues = 3
      const maxPagesToScan = 50
      const minRecordsToScan = 500
      
      await new Promise<void>((resolve, reject) => {
        this.base(this.tableName)
          .select({
            fields: [airtableFieldName],
            pageSize: 100,
            maxRecords: Math.min(limit * 5, maxPagesToScan * 100),
          })
          .eachPage(
            (records, fetchNextPage) => {
              pageCount++
              const valuesBeforePage = uniqueValues.size
              
              records.forEach(record => {
                const value = record.fields[airtableFieldName]
                
                if (value === null || value === undefined) {
                  return
                }
                
                if (typeof value === 'string' && value.trim()) {
                  uniqueValues.add(value.trim())
                  fetchedCount++
                } else if (Array.isArray(value)) {
                  value.forEach(v => {
                    if (v && typeof v === 'string' && v.trim()) {
                      uniqueValues.add(v.trim())
                      fetchedCount++
                    }
                  })
                }
              })
              
              const valuesAfterPage = uniqueValues.size
              const newValuesThisPage = valuesAfterPage - valuesBeforePage
              
              if (newValuesThisPage === 0) {
                consecutivePagesWithNoNewValues++
              } else {
                consecutivePagesWithNoNewValues = 0
              }
              
              const shouldStop = 
                uniqueValues.size >= limit ||
                (fetchedCount >= minRecordsToScan && consecutivePagesWithNoNewValues >= maxConsecutivePagesWithoutNewValues) ||
                pageCount >= maxPagesToScan
              
              if (shouldStop) {
                resolve()
                return
              }
              
              fetchNextPage()
            },
            (err) => {
              if (err) {
                reject(err)
              } else {
                resolve()
              }
            }
          )
      })
      
      let values = Array.from(uniqueValues).sort()
      
      if (fieldName === 'Status' || fieldName === 'status') {
        const priority = ['Active', 'Inactive']
        values = [
          ...priority.filter(v => values.includes(v)),
          ...values.filter(v => !priority.includes(v))
        ]
      }
      
      const maxOptions = 500
      if (values.length > maxOptions) {
        console.log(`   ⚠️  Limiting ${values.length} options to ${maxOptions} for better performance`)
        values = values.slice(0, maxOptions)
      }
      
      console.log(`✅ Found ${values.length} distinct values for Application List ${fieldName}`)
      
      this.distinctValuesCache.set(cacheKey, {
        values,
        timestamp: Date.now(),
      })
      
      return values
    } catch (error: any) {
      console.error(`❌ Error getting distinct values for Application List ${fieldName}:`, error)
      return []
    }
  }

  // Helper methods
  private getCreatedTime(record: Airtable.Record<any>): Date {
    return new Date(record._rawJson.createdTime || Date.now())
  }

  private getModifiedTime(record: Airtable.Record<any>): Date {
    return new Date(record._rawJson.lastModifiedTime || Date.now())
  }

  private formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  private getCreatedBy(fields: any): string {
    if (fields['Created By']) {
      return typeof fields['Created By'] === 'string' 
        ? fields['Created By'] 
        : fields['Created By']?.name || 'System'
    }
    return 'System'
  }

  private getLastModifiedBy(fields: any): string {
    if (fields['Last Modified By']) {
      return typeof fields['Last Modified By'] === 'string' 
        ? fields['Last Modified By'] 
        : fields['Last Modified By']?.name || 'System'
    }
    return 'System'
  }
}

// Lazy singleton instance
let applicationListAirtableServiceInstance: ApplicationListAirtableService | null = null

export const getApplicationListAirtableService = (): ApplicationListAirtableService => {
  if (!applicationListAirtableServiceInstance) {
    applicationListAirtableServiceInstance = new ApplicationListAirtableService()
  }
  return applicationListAirtableServiceInstance
}

