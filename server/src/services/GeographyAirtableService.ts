import Airtable from 'airtable'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Geography Airtable Service
 * 
 * Handles all Airtable API interactions for Geography table.
 * This service can be replaced with a PostgreSQL service later
 * without changing the repository interface.
 */
export class GeographyAirtableService {
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
    // Geography table ID from schema: tblErjfASiVycrsn9
    this.tableName = process.env.AIRTABLE_GEOGRAPHY_TABLE_ID || 
                     process.env.AIRTABLE_GEOGRAPHY_TABLE_NAME || 
                     'tblErjfASiVycrsn9' // Use table ID by default for better reliability
    
    console.log(`🌍 GeographyAirtableService initialized:`)
    console.log(`   Base ID: ${baseId}`)
    console.log(`   Table: ${this.tableName}`)
    console.log(`   API Key: ${apiKey ? apiKey.substring(0, 20) + '...' : 'NOT SET'}`)
    
    Airtable.configure({ apiKey })
    this.base = Airtable.base(baseId)
    
    // Set cache file path
    this.cacheFilePath = path.join(__dirname, '../../.cache', 'geography-total-count.json')
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
        
        // Use cache if less than 1 hour old (longer TTL for disk cache)
        if (age < 60 * 60 * 1000) {
          this.totalCountCache = cacheData
          console.log(`📊 Loaded Geography total count from disk cache: ${cacheData.count} (age: ${Math.round(age / 1000 / 60)}min)`)
        }
      }
    } catch (error) {
      console.warn('⚠️  Could not load Geography count cache from disk:', error)
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
      console.warn('⚠️  Could not save Geography count cache to disk:', error)
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
      console.warn('⚠️  Could not delete Geography count cache file:', error)
    }
  }

  /**
   * Clear distinct values cache
   */
  private clearDistinctValuesCache(): void {
    this.distinctValuesCache.clear()
  }

  /**
   * Map Airtable record to Geography interface
   */
  mapAirtableToGeography(record: Airtable.Record<any>): any {
    const fields = record.fields
    
    // Helper to safely get field value
    const getField = (fieldNames: string[], defaultValue: any = '') => {
      for (const name of fieldNames) {
        if (fields[name] !== undefined && fields[name] !== null && fields[name] !== '') {
          return fields[name]
        }
      }
      return defaultValue
    }
    
    // Map Airtable field names to our Geography interface
    // Actual Airtable fields: Name, CODE, Status, Notes
    const Name = getField(['Name', 'Region Name', 'region_name', 'RegionName'], '')
    const CODE = getField(['CODE', 'Country', 'country'], '')
    const Status = getField(['Status', 'status'], 'Active')
    const Notes = getField(['Notes', 'notes', 'Note', 'note'])
    
    return {
      id: record.id,
      // Airtable field names (primary)
      Name,
      CODE,
      Status,
      Notes,
      // Legacy aliases for backward compatibility
      regionName: Name,
      country: CODE,
      status: Status,
      notes: Notes,
      createdAt: this.formatDate(this.getCreatedTime(record)),
      updatedAt: this.formatDate(this.getModifiedTime(record)),
      createdBy: this.getCreatedBy(fields),
      lastModifiedBy: this.getLastModifiedBy(fields),
    }
  }

  /**
   * Map Geography DTO to Airtable fields
   */
  mapGeographyToAirtable(dto: any): Record<string, any> {
    const fields: Record<string, any> = {}
    
    // Map to actual Airtable field names: Name, CODE, Status, Notes
    // Support both Airtable field names and legacy aliases
    const Name = dto.Name !== undefined ? dto.Name : dto.regionName
    const CODE = dto.CODE !== undefined ? dto.CODE : dto.country
    const Status = dto.Status !== undefined ? dto.Status : dto.status
    const Notes = dto.Notes !== undefined ? dto.Notes : dto.notes
    
    if (Name !== undefined && Name !== null && String(Name).trim() !== '') {
      fields['Name'] = String(Name).trim()
    }
    if (CODE !== undefined && CODE !== null && String(CODE).trim() !== '') {
      fields['CODE'] = String(CODE).trim()
    }
    if (Status !== undefined && Status !== null) {
      fields['Status'] = String(Status).trim()
    } else {
      fields['Status'] = 'Active' // Default
    }
    if (Notes !== undefined && Notes !== null && String(Notes).trim() !== '') {
      fields['Notes'] = String(Notes).trim()
    }
    
    // Don't include audit fields - Airtable handles these automatically
    delete fields['createdBy']
    delete fields['lastModifiedBy']
    delete fields['createdAt']
    delete fields['updatedAt']
    
    return fields
  }

  /**
   * Get all geography records from Airtable
   */
  async findAll(): Promise<any[]> {
    try {
      console.log(`📥 Fetching ALL geography records from Airtable table: ${this.tableName}`)
      
      const records = await this.base(this.tableName)
        .select({
          sort: [{ field: 'Name', direction: 'asc' }],
        })
        .all()
      
      console.log(`✅ Fetched ${records.length} total records from Airtable`)
      
      return records.map(record => this.mapAirtableToGeography(record))
    } catch (error: any) {
      console.error('Error fetching geography from Airtable:', error)
      
      if (error.error === 'NOT_AUTHORIZED' || error.statusCode === 403) {
        throw new Error(`Airtable authentication failed (403). Check your API token permissions.`)
      }
      if (error.error === 'NOT_FOUND' || error.statusCode === 404) {
        throw new Error(`Airtable table not found (404). Check table name "${this.tableName}" and base ID.`)
      }
      
      throw new Error(`Failed to fetch geography from Airtable: ${error.error || error.message || 'Unknown error'}`)
    }
  }

  /**
   * Get paginated geography records from Airtable (optimized for large datasets)
   * Fetches only the pages needed for the requested range
   * Supports filtering via Airtable filterByFormula
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
      console.log(`📥 Fetching paginated geography: offset=${offset}, limit=${limit}`)
      
      // Airtable returns max 100 records per page
      // Calculate which pages we need
      const startRecordIndex = offset
      const endRecordIndex = offset + limit
      const startPage = Math.floor(startRecordIndex / 100) + 1
      const endPage = Math.ceil(endRecordIndex / 100)
      
      let allRecords: Airtable.Record<any>[] = []
      let currentPage = 0
      
      // Determine sort field using the mapping function for consistency
      const sortField = sortBy && sortBy.trim() !== '' ? this.mapFieldNameToAirtable(sortBy) : 'Name'
      const sortDirection = sortOrder === 'desc' ? 'desc' : 'asc'
      
      if (sortBy && sortBy.trim() !== '') {
        console.log(`   Sorting by: ${sortBy} -> ${sortField} (${sortDirection})`)
      } else {
        console.log(`   Using default sort: Name (asc)`)
      }
      
      // Build Airtable filter formula if filters or search are provided
      const filterFormulas: string[] = []
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            const airtableFieldName = this.mapFieldNameToAirtable(key)
            // Escape single quotes in value for Airtable formula
            const escapedValue = String(value).replace(/'/g, "''")
            filterFormulas.push(`{${airtableFieldName}} = '${escapedValue}'`)
          }
        })
      }
      
      if (search) {
        // Search across multiple fields using OR logic
        const searchFields = ['Name', 'CODE']
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
          pageSize: 100, // Airtable's max page size
        }
        
        if (filterFormula) {
          selectOptions.filterByFormula = filterFormula
        }
        
        this.base(this.tableName)
          .select(selectOptions)
          .eachPage(
            (records, fetchNextPage) => {
              currentPage++
              
              // Skip pages before the start page
              if (currentPage < startPage) {
                fetchNextPage()
                return
              }
              
              // Add records from this page
              allRecords.push(...records)
              
              // Stop if we've fetched enough pages
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
      
      // Calculate the slice indices within the fetched records
      const startIndexInFetched = startRecordIndex % 100
      const endIndexInFetched = startIndexInFetched + limit
      const paginatedRecords = allRecords.slice(startIndexInFetched, endIndexInFetched)
      
      console.log(`✅ Fetched ${paginatedRecords.length} records from pages ${startPage}-${endPage}`)
      
      // Get total count - if filters are applied, count filtered results
      let total: number
      if (filterFormula) {
        // Count filtered records
        total = await this.getFilteredCount(filterFormula)
        console.log(`   Filtered total count: ${total}`)
      } else {
        // Use cached total count for unfiltered results
        total = await this.getTotalCount(true)
      }

      return {
        records: paginatedRecords.map(record => this.mapAirtableToGeography(record)),
        total,
      }
    } catch (error: any) {
      console.error('❌ Error fetching paginated geography from Airtable:', error)
      console.error('   Error type:', error.constructor.name)
      console.error('   Status code:', error.statusCode)
      console.error('   Error code:', error.error)
      console.error('   Error message:', error.message)
      console.error('   Table name used:', this.tableName)
      console.error('   Base ID used:', process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 'appGtLbKhmNkkTLVL')
      
      if (error.error === 'NOT_AUTHORIZED' || error.statusCode === 403) {
        throw new Error(`Airtable authentication failed (403). The table "${this.tableName}" may not exist or the API token may not have access to it. Check: 1) Table name/ID is correct, 2) Token has access to this table, 3) Table exists in base ${process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 'appGtLbKhmNkkTLVL'}`)
      }
      if (error.error === 'NOT_FOUND' || error.statusCode === 404) {
        throw new Error(`Airtable table not found (404). Table "${this.tableName}" does not exist in base. Check the table name/ID in your .env file (AIRTABLE_GEOGRAPHY_TABLE_ID or AIRTABLE_GEOGRAPHY_TABLE_NAME).`)
      }
      
      throw new Error(`Failed to fetch geography: ${error.error || error.message || 'Unknown error'}`)
    }
  }

  /**
   * Map field name to Airtable field name
   */
  private mapFieldNameToAirtable(fieldName: string): string {
    const mapping: Record<string, string> = {
      'regionName': 'Name',
      'region_name': 'Name',
      'country': 'CODE',
      'status': 'Status',
    }
    return mapping[fieldName] || fieldName
  }

  /**
   * Get a single geography record by ID
   */
  async findById(id: string): Promise<any | null> {
    try {
      const record = await this.base(this.tableName).find(id)
      return this.mapAirtableToGeography(record)
    } catch (error: any) {
      if (error.statusCode === 404 || error.error === 'NOT_FOUND') {
        return null
      }
      throw new Error(`Failed to fetch geography: ${error.error || error.message || 'Unknown error'}`)
    }
  }

  /**
   * Create a new geography record
   */
  async create(fields: Record<string, any>): Promise<any> {
    try {
      console.log(`📝 Creating geography in Airtable`)
      const airtableFields = this.mapGeographyToAirtable(fields)
      console.log(`   Mapped Airtable fields:`, JSON.stringify(airtableFields, null, 2))
      
      const record = await this.base(this.tableName).create(airtableFields)
      console.log(`✅ Successfully created geography in Airtable: ${record.id}`)
      
      // Clear count cache since we added a record
      this.clearCountCache()
      this.clearDistinctValuesCache() // Also clear filter options cache
      
      return this.mapAirtableToGeography(record)
    } catch (error: any) {
      console.error('❌ Error creating geography in Airtable:', error)
      throw new Error(`Failed to create geography: ${error.error || error.message || 'Unknown error'}`)
    }
  }

  /**
   * Update a geography record
   */
  async update(id: string, fields: Record<string, any>): Promise<any> {
    try {
      console.log(`📝 Updating geography in Airtable: ${id}`)
      const airtableFields = this.mapGeographyToAirtable(fields)
      
      const record = await this.base(this.tableName).update(id, airtableFields)
      console.log(`✅ Successfully updated geography: ${id}`)
      
      return this.mapAirtableToGeography(record)
    } catch (error: any) {
      console.error(`❌ Error updating geography ${id}:`, error)
      if (error.statusCode === 404 || error.error === 'NOT_FOUND') {
        return null
      }
      throw new Error(`Failed to update geography: ${error.error || error.message || 'Unknown error'}`)
    }
  }

  /**
   * Delete a geography record
   */
  async delete(id: string): Promise<boolean> {
    try {
      await this.base(this.tableName).destroy(id)
      // Clear count cache since we deleted a record
      this.clearCountCache()
      this.clearDistinctValuesCache() // Also clear filter options cache
      return true
    } catch (error: any) {
      if (error.statusCode === 404 || error.error === 'NOT_FOUND') {
        return false
      }
      throw new Error(`Failed to delete geography: ${error.error || error.message || 'Unknown error'}`)
    }
  }

  /**
   * Get total count with lazy calculation and estimation
   * Returns cached value immediately, calculates in background if needed
   */
  async getTotalCount(lazy: boolean = true): Promise<number> {
    try {
      // Return cached count if still valid
      if (this.totalCountCache && Date.now() - this.totalCountCache.timestamp < this.COUNT_CACHE_TTL) {
        console.log(`📊 Using cached total count for Geography: ${this.totalCountCache.count}`)
        return this.totalCountCache.count
      }

      // If lazy mode and no cache, return estimate and calculate in background
      if (lazy && !this.totalCountCache) {
        console.log(`📊 No cache available for Geography, returning estimate and calculating in background...`)
        
        // Return a reasonable estimate
        const estimate = 1000 // Conservative estimate for Geography table
        
        // Start background calculation (don't await)
        this.calculateTotalCountInBackground()
        
        return estimate
      }

      // If not lazy or cache exists but expired, calculate synchronously
      return await this.calculateTotalCount()
    } catch (error: any) {
      console.error('Error getting Geography total count:', error)
      // Return cached value if available, even if expired
      if (this.totalCountCache) {
        console.warn(`⚠️  Using expired cache: ${this.totalCountCache.count}`)
        return this.totalCountCache.count
      }
      console.warn('⚠️  Could not get count, returning estimate')
      return 1000 // Return estimate as fallback
    }
  }

  /**
   * Calculate total count in background (non-blocking)
   */
  private calculateTotalCountInBackground(): void {
    // Prevent multiple simultaneous calculations
    if (this.countCalculationPromise) {
      return
    }

    this.countCalculationPromise = this.calculateTotalCount()
      .then((count) => {
        console.log(`✅ Background count calculation complete for Geography: ${count}`)
        this.countCalculationPromise = null
        return count
      })
      .catch((error) => {
        console.error('❌ Background count calculation failed for Geography:', error)
        this.countCalculationPromise = null
        throw error
      })
  }

  /**
   * Calculate total count (actual implementation)
   */
  private async calculateTotalCount(): Promise<number> {
    console.log(`📊 Calculating total count for Geography...`)
    let count = 0
    
    // Use a timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Count calculation timeout')), 20000) // 20 second timeout
    })

    const countPromise = new Promise<number>((resolve, reject) => {
      this.base(this.tableName)
        .select({
          fields: ['Name'], // Only fetch Name field to minimize data transfer
          pageSize: 100, // Max page size for efficiency
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
              resolve(count)
            }
          }
        )
    })

    try {
      // Race between count calculation and timeout
      count = await Promise.race([countPromise, timeoutPromise])
      
      // Cache the result
      this.totalCountCache = {
        count,
        timestamp: Date.now()
      }
      
      // Save to disk for persistence across restarts
      this.saveCacheToDisk()
      
      console.log(`📊 Total count for Geography: ${count} (cached)`)
      return count
    } catch (error: any) {
      if (error.message === 'Count calculation timeout') {
        console.warn('⚠️  Count calculation timed out for Geography, using estimate')
        // Return estimate if calculation times out
        return 1000
      }
      throw error
    }
  }

  /**
   * Get count of records matching a filter formula
   * Used for pagination when filters are applied
   */
  private async getFilteredCount(filterFormula: string): Promise<number> {
    try {
      let count = 0
      await new Promise<void>((resolve, reject) => {
        this.base(this.tableName)
          .select({
            filterByFormula: filterFormula,
            fields: ['Name'], // Only fetch minimal data for counting
            pageSize: 100,
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
      console.error('Error getting filtered count for Geography:', error)
      // Fallback: return a reasonable estimate
      return 0
    }
  }

  /**
   * Get unique/distinct values for a field (for filter dropdowns)
   * Optimized with smart stopping conditions and caching
   */
  async getDistinctValues(fieldName: string, limit: number = 1000): Promise<string[]> {
    try {
      // Check cache first
      const cacheKey = `${fieldName}_${limit}`
      const cached = this.distinctValuesCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.DISTINCT_VALUES_CACHE_TTL) {
        console.log(`📊 Using cached distinct values for Geography ${fieldName}: ${cached.values.length} values`)
        return cached.values
      }
      
      console.log(`📊 Fetching distinct values for Geography field: ${fieldName}`)
      
      // Map our field names to Airtable field names
      const airtableFieldName = this.mapFieldNameToAirtable(fieldName)
      console.log(`   Mapped to Airtable field: ${airtableFieldName}`)
      console.log(`   Using table: ${this.tableName}`)
      
      const uniqueValues = new Set<string>()
      let fetchedCount = 0
      let pageCount = 0
      let consecutivePagesWithNoNewValues = 0
      const maxConsecutivePagesWithoutNewValues = 3 // Stop after 3 pages with no new values
      const maxPagesToScan = 50 // Don't scan more than 50 pages (5000 records)
      const minRecordsToScan = 500 // Scan at least 500 records to get a good sample
      
      // Fetch records with only the field we need (minimal data transfer)
      await new Promise<void>((resolve, reject) => {
        this.base(this.tableName)
          .select({
            fields: [airtableFieldName],
            pageSize: 100,
            maxRecords: Math.min(limit * 5, maxPagesToScan * 100), // Reasonable upper limit
          })
          .eachPage(
            (records, fetchNextPage) => {
              pageCount++
              const valuesBeforePage = uniqueValues.size
              
              records.forEach(record => {
                const value = record.fields[airtableFieldName]
                
                // Handle different value types
                if (value === null || value === undefined) {
                  return
                }
                
                // Handle string values
                if (typeof value === 'string' && value.trim()) {
                  uniqueValues.add(value.trim())
                  fetchedCount++
                } 
                // Handle array values (for multi-select fields)
                else if (Array.isArray(value)) {
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
              
              // Track if we found new values
              if (newValuesThisPage === 0) {
                consecutivePagesWithNoNewValues++
              } else {
                consecutivePagesWithNoNewValues = 0 // Reset counter
              }
              
              // Smart stopping conditions:
              // 1. Found enough unique values
              // 2. Scanned enough records AND haven't found new values in several pages
              // 3. Reached max pages
              const shouldStop = 
                uniqueValues.size >= limit ||
                (fetchedCount >= minRecordsToScan && consecutivePagesWithNoNewValues >= maxConsecutivePagesWithoutNewValues) ||
                pageCount >= maxPagesToScan
              
              if (shouldStop) {
                const reason = 
                  uniqueValues.size >= limit ? 'found enough unique values' :
                  consecutivePagesWithNoNewValues >= maxConsecutivePagesWithoutNewValues ? 'no new values in recent pages' :
                  'reached max pages limit'
                console.log(`   ✅ Stopping after page ${pageCount}: ${uniqueValues.size} unique values (${reason})`)
                resolve()
                return
              }
              
              // Continue to next page
              fetchNextPage()
            },
            (err) => {
              if (err) {
                console.error(`   ❌ Error in eachPage for Geography ${fieldName}:`, err)
                console.error(`   Error details:`, err.message || err)
                reject(err)
              } else {
                console.log(`   ✅ Completed scanning ${pageCount} pages for Geography ${fieldName}`)
                resolve()
              }
            }
          )
      })
      
      // Sort and limit results
      let values = Array.from(uniqueValues).sort()
      
      // For fields with many options, prioritize common values
      if (values.length > 50) {
        // Common status values should appear first
        if (fieldName === 'status') {
          const priority = ['Active', 'Inactive']
          values = [
            ...priority.filter(v => values.includes(v)),
            ...values.filter(v => !priority.includes(v))
          ]
        }
      }
      
      // Limit to reasonable number for UI performance
      const maxOptions = 500
      if (values.length > maxOptions) {
        console.log(`   ⚠️  Limiting ${values.length} options to ${maxOptions} for better performance`)
        values = values.slice(0, maxOptions)
      }
      
      console.log(`✅ Found ${values.length} distinct values for Geography ${fieldName}:`, values.slice(0, 10).join(', '), values.length > 10 ? '...' : '')
      
      // Cache the results
      this.distinctValuesCache.set(cacheKey, {
        values,
        timestamp: Date.now(),
      })
      
      return values
    } catch (error: any) {
      console.error(`❌ Error getting distinct values for Geography ${fieldName}:`, error)
      console.error(`   Error message:`, error.message)
      return []
    }
  }

  // Helper methods for date and user extraction
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
let geographyAirtableServiceInstance: GeographyAirtableService | null = null

export const getGeographyAirtableService = (): GeographyAirtableService => {
  if (!geographyAirtableServiceInstance) {
    geographyAirtableServiceInstance = new GeographyAirtableService()
  }
  return geographyAirtableServiceInstance
}

