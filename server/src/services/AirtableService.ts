import Airtable from 'airtable'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Airtable Service
 * 
 * Handles all Airtable API interactions.
 * This service can be replaced with a PostgreSQL service later
 * without changing the repository interface.
 */
export class AirtableService {
  private base: Airtable.Base
  private tableName: string
  private readonly cacheFilePath: string

  constructor() {
    // Load environment variables explicitly
    // Note: dotenv should be loaded in index.ts before this is called
    const apiKey = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || 
                   process.env.AIRTABLE_API_KEY
    
    if (!apiKey) {
      console.error('❌ ERROR: AIRTABLE_PERSONAL_ACCESS_TOKEN not found in environment variables!')
      console.error('   Make sure .env file exists in server directory with AIRTABLE_PERSONAL_ACCESS_TOKEN set')
      console.error('   Current working directory:', process.cwd())
      console.error('   Environment keys:', Object.keys(process.env).filter(k => k.includes('AIRTABLE')).join(', ') || 'none')
      // Don't throw - let it fail gracefully and use mock data instead
      console.error('   Falling back to error state - server will not start properly')
      throw new Error('Airtable API token is required. Set AIRTABLE_PERSONAL_ACCESS_TOKEN in .env file')
    }
    
    const baseId = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 
                   'appGtLbKhmNkkTLVL'
    
    // Try table ID first, then table name
    this.tableName = process.env.AIRTABLE_COMPANY_TABLE_ID || 
                     process.env.AIRTABLE_COMPANY_TABLE_NAME || 
                     'tbl82H6ezrakMSkV1' // Use table ID by default for better reliability
    
    Airtable.configure({ apiKey })
    this.base = Airtable.base(baseId)
    
    // Set cache file path
    this.cacheFilePath = path.join(__dirname, '../../.cache', 'total-count.json')
    this.loadCacheFromDisk()
  }

  /**
   * Map Airtable record to Company interface
   * 
   * Note: Field names may vary in your Airtable base.
   * Update these mappings to match your actual Airtable schema.
   */
  mapAirtableToCompany(record: Airtable.Record<any>): any {
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
    
    // Map Airtable field names to our Company interface
    // Use only 'Company Name' field (Name field has been removed)
    const companyName = getField(['Company Name', 'companyName', 'CompanyName'], '')
    return {
      id: record.id, // Airtable record ID
      isinCode: getField(['ISIN Code', 'ISIN', 'isinCode', 'ISINCode']),
      companyName: companyName,
      status: getField(['Status', 'status'], 'Active'),
      primarySector: getField(['Primary Sector', 'primarySector', 'PrimarySector']),
      primaryActivity: getField(['Primary Activity', 'primaryActivity', 'PrimaryActivity']),
      primaryIndustry: getField(['Primary Industry', 'primaryIndustry', 'PrimaryIndustry']),
      notes: getField(['Notes', 'notes', 'Note', 'note']),
      // Airtable automatically tracks created/modified info
      createdBy: this.getCreatedBy(fields),
      created: this.formatDate(this.getCreatedTime(record)),
      lastModifiedBy: this.getLastModifiedBy(fields),
      lastModified: this.formatDate(this.getModifiedTime(record)),
    }
  }

  /**
   * Extract created by information from Airtable fields
   */
  private getCreatedBy(fields: any): string {
    // Airtable may have created by as an object or string
    if (fields['Created By']) {
      if (typeof fields['Created By'] === 'object' && fields['Created By'].name) {
        return fields['Created By'].name
      }
      if (typeof fields['Created By'] === 'string') {
        return fields['Created By']
      }
    }
    return 'System'
  }

  /**
   * Extract last modified by information from Airtable fields
   */
  private getLastModifiedBy(fields: any): string {
    // Airtable may have last modified by as an object or string
    if (fields['Last Modified By']) {
      if (typeof fields['Last Modified By'] === 'object' && fields['Last Modified By'].name) {
        return fields['Last Modified By'].name
      }
      if (typeof fields['Last Modified By'] === 'string') {
        return fields['Last Modified By']
      }
    }
    return 'System'
  }

  /**
   * Get created time from Airtable record
   */
  private getCreatedTime(record: Airtable.Record<any>): Date | string {
    // Try multiple ways to get created time
    if ((record as any)._rawJson?.createdTime) {
      return (record as any)._rawJson.createdTime
    }
    if ((record as any).createdTime) {
      return (record as any).createdTime
    }
    return new Date()
  }

  /**
   * Get modified time from Airtable record
   */
  private getModifiedTime(record: Airtable.Record<any>): Date | string {
    // Try multiple ways to get modified time
    if ((record as any)._rawJson?.modifiedTime) {
      return (record as any)._rawJson.modifiedTime
    }
    if ((record as any).modifiedTime) {
      return (record as any).modifiedTime
    }
    return new Date()
  }

  /**
   * Map Company DTO to Airtable fields
   */
  private mapCompanyToAirtable(dto: any): Record<string, any> {
    const fields: Record<string, any> = {}
    
    // Map our Company interface to Airtable field names
    // Only include fields that are explicitly provided and not undefined
    // Airtable doesn't like undefined values, so we filter them out
    
    // Required fields - always include if present
    if (dto.isinCode !== undefined && dto.isinCode !== null && String(dto.isinCode).trim() !== '') {
      fields['ISIN Code'] = String(dto.isinCode).trim()
    }
    if (dto.companyName !== undefined && dto.companyName !== null && String(dto.companyName).trim() !== '') {
      fields['Company Name'] = String(dto.companyName).trim()
    }
    
    // Note: 'Name' field is being removed from Companies table - only use 'Company Name'
    
    if (dto.status !== undefined && dto.status !== null) {
      fields['Status'] = String(dto.status).trim()
    } else {
      // Default to Active if not provided
      fields['Status'] = 'Active'
    }
    
    // Optional fields - only include if not empty
    if (dto.primarySector !== undefined && dto.primarySector !== null && String(dto.primarySector).trim() !== '') {
      fields['Primary Sector'] = String(dto.primarySector).trim()
    }
    if (dto.primaryActivity !== undefined && dto.primaryActivity !== null && String(dto.primaryActivity).trim() !== '') {
      fields['Primary Activity'] = String(dto.primaryActivity).trim()
    }
    if (dto.primaryIndustry !== undefined && dto.primaryIndustry !== null && String(dto.primaryIndustry).trim() !== '') {
      fields['Primary Industry'] = String(dto.primaryIndustry).trim()
    }
    if (dto.notes !== undefined && dto.notes !== null && String(dto.notes).trim() !== '') {
      fields['Notes'] = String(dto.notes).trim()
    }
    
    // Don't include lastModifiedBy or createdBy - Airtable handles these automatically
    delete fields['lastModifiedBy']
    delete fields['createdBy']
    
    console.log(`   Mapped fields for Airtable (${Object.keys(fields).length} fields):`, Object.keys(fields).join(', '))
    console.log(`   Field values:`, Object.entries(fields).map(([k, v]) => `${k}="${v}"`).join(', '))
    
    return fields
  }

  /**
   * Format date to match our Company interface format
   */
  private formatDate(date: Date | string): string {
    if (!date) return new Date().toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    
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

  /**
   * Get all companies from Airtable
   * WARNING: This fetches ALL records - use findPaginated for large datasets
   */
  async findAll(): Promise<any[]> {
    try {
      console.log(`📥 Fetching ALL companies from Airtable table: ${this.tableName}`)
      
      const records = await this.base(this.tableName)
        .select({
          sort: [{ field: 'Company Name', direction: 'asc' }],
        })
        .all()
      
      console.log(`✅ Fetched ${records.length} total records from Airtable`)
      
      const companies = records.map(record => {
        try {
          return this.mapAirtableToCompany(record)
        } catch (mapError) {
          console.error('Error mapping record:', record.id, mapError)
          return null
        }
      }).filter(company => company !== null)
      
      console.log(`✅ Successfully mapped ${companies.length} companies`)
      return companies
    } catch (error: any) {
      console.error('Error fetching companies from Airtable:', error)
      console.error('Error type:', error.constructor.name)
      console.error('Error details:', JSON.stringify(error, null, 2))
      
      if (error.error === 'NOT_AUTHORIZED' || error.statusCode === 403) {
        throw new Error(`Airtable authentication failed (403). Check your API token permissions and base access. Error: ${error.message || 'Not authorized'}`)
      }
      if (error.error === 'NOT_FOUND' || error.statusCode === 404) {
        throw new Error(`Airtable table not found (404). Check table name "${this.tableName}" and base ID. Error: ${error.message || 'Not found'}`)
      }
      
      throw new Error(`Failed to fetch companies from Airtable: ${error.error || error.message || 'Unknown error'} (Status: ${error.statusCode || 'N/A'})`)
    }
  }

  /**
   * Get paginated companies from Airtable (optimized for large datasets)
   * Fetches only the pages needed for the requested range
   * Supports filtering via Airtable filterByFormula
   * 
   * Note: Sorting is handled by Airtable's native API, which applies sorting
   * before pagination. Airtable uses standard string sorting, which may not
   * be natural/alphanumerical (e.g., "A1, A10, A2" instead of "A1, A2, A10").
   * For true natural sorting, consider using PostgreSQL adapter or applying
   * client-side natural sort after fetching (for smaller datasets).
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
      console.log(`📥 Fetching paginated companies: offset=${offset}, limit=${limit}`)
      
      // Airtable returns max 100 records per page
      // Calculate which pages we need
      const startRecordIndex = offset
      const endRecordIndex = offset + limit
      const startPage = Math.floor(startRecordIndex / 100) + 1
      const endPage = Math.ceil(endRecordIndex / 100)
      
      let allRecords: Airtable.Record<any>[] = []
      let currentPage = 0
      
      // Determine sort field using the mapping function for consistency
      // If no sortBy is provided, default to sorting by Company Name ascending
      const sortField = sortBy && sortBy.trim() !== '' ? this.mapFieldNameToAirtable(sortBy) : 'Company Name'
      const sortDirection = sortOrder === 'desc' ? 'desc' : 'asc'
      
      if (sortBy && sortBy.trim() !== '') {
        console.log(`   Sorting by: ${sortBy} -> ${sortField} (${sortDirection})`)
      } else {
        console.log(`   Using default sort: Company Name (asc)`)
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
        const searchFields = ['Company Name', 'ISIN Code', 'Primary Sector', 'Primary Activity', 'Primary Industry']
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
          pageSize: 100, // Airtable's max page size
        }
        
        // Only apply Airtable sort if we're NOT searching (search results will be sorted by relevance)
        if (!search || !search.trim()) {
          selectOptions.sort = [{ field: sortField, direction: sortDirection }]
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
      
      // If search is provided, sort ALL fetched records by relevance BEFORE pagination
      // This ensures the most relevant results appear first
      if (search && search.trim()) {
        const searchLower = search.toLowerCase().trim()
        allRecords = allRecords.sort((a, b) => {
          const aName = (a.fields['Company Name'] || '').toString().toLowerCase()
          const bName = (b.fields['Company Name'] || '').toString().toLowerCase()
          
          // Exact match gets highest priority (0 = highest, 1 = lower)
          const aExact = aName === searchLower ? 0 : 1
          const bExact = bName === searchLower ? 0 : 1
          if (aExact !== bExact) return aExact - bExact
          
          // Starts with gets second priority
          const aStarts = aName.startsWith(searchLower) ? 0 : 1
          const bStarts = bName.startsWith(searchLower) ? 0 : 1
          if (aStarts !== bStarts) return aStarts - bStarts
          
          // Then sort alphabetically for same priority level
          return aName.localeCompare(bName)
        })
      }
      
      // Calculate the slice indices within the fetched records (after sorting)
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
        records: paginatedRecords,
        total,
      }
    } catch (error: any) {
      console.error('Error fetching paginated companies from Airtable:', error)
      throw error
    }
  }

  // Cache for total count to avoid repeated expensive queries
  private totalCountCache: { count: number; timestamp: number } | null = null
  private readonly COUNT_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private countCalculationPromise: Promise<number> | null = null // Track ongoing calculation
  
  // Cache for distinct field values
  private distinctValuesCache: Map<string, { values: string[]; timestamp: number }> = new Map()
  private readonly DISTINCT_VALUES_CACHE_TTL = 10 * 60 * 1000 // 10 minutes

  /**
   * Load cache from disk on startup
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
          console.log(`📊 Loaded total count from disk cache: ${cacheData.count} (age: ${Math.round(age / 1000 / 60)}min)`)
        }
      }
    } catch (error) {
      console.warn('⚠️  Could not load count cache from disk:', error)
    }
  }

  /**
   * Save cache to disk
   */
  private saveCacheToDisk(): void {
    try {
      if (this.totalCountCache) {
        const cacheDir = path.dirname(this.cacheFilePath)
        if (!fs.existsSync(cacheDir)) {
          fs.mkdirSync(cacheDir, { recursive: true })
        }
        fs.writeFileSync(this.cacheFilePath, JSON.stringify(this.totalCountCache), 'utf8')
      }
    } catch (error) {
      console.warn('⚠️  Could not save count cache to disk:', error)
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
        console.log(`📊 Using cached total count: ${this.totalCountCache.count}`)
        return this.totalCountCache.count
      }

      // If lazy mode and no cache, return estimate and calculate in background
      if (lazy && !this.totalCountCache) {
        console.log(`📊 No cache available, returning estimate and calculating in background...`)
        
        // Return a reasonable estimate (can be improved with sampling)
        const estimate = 15000 // Conservative estimate based on known dataset size
        
        // Start background calculation (don't await)
        this.calculateTotalCountInBackground()
        
        return estimate
      }

      // If not lazy or cache exists but expired, calculate synchronously
      return await this.calculateTotalCount()
    } catch (error: any) {
      console.error('Error getting total count:', error)
      // Return cached value if available, even if expired
      if (this.totalCountCache) {
        console.warn(`⚠️  Using expired cache: ${this.totalCountCache.count}`)
        return this.totalCountCache.count
      }
      console.warn('⚠️  Could not get count, returning estimate')
      return 15000 // Return estimate as fallback
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
        console.log(`✅ Background count calculation complete: ${count}`)
        this.countCalculationPromise = null
        return count
      })
      .catch((error) => {
        console.error('❌ Background count calculation failed:', error)
        this.countCalculationPromise = null
        throw error
      })
  }

  /**
   * Calculate total count (actual implementation)
   */
  private async calculateTotalCount(): Promise<number> {
    console.log(`📊 Calculating total count...`)
    let count = 0
    
    // Use a timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Count calculation timeout')), 20000) // 20 second timeout
    })

    const countPromise = new Promise<number>((resolve, reject) => {
      this.base(this.tableName)
        .select({
          fields: ['Company Name'], // Only fetch Company Name field to minimize data transfer
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
      
      console.log(`📊 Total count: ${count} companies (cached)`)
      return count
    } catch (error: any) {
      if (error.message === 'Count calculation timeout') {
        console.warn('⚠️  Count calculation timed out, using estimate')
        // Return estimate if calculation times out
        return 15000
      }
      throw error
    }
  }

  /**
   * Clear the total count cache (call after create/delete operations)
   */
  clearCountCache(): void {
    this.totalCountCache = null
    // Also clear disk cache
    try {
      if (fs.existsSync(this.cacheFilePath)) {
        fs.unlinkSync(this.cacheFilePath)
      }
    } catch (error) {
      console.warn('Could not delete disk cache:', error)
    }
  }

  /**
   * Clear the distinct values cache (call after data modifications)
   */
  clearDistinctValuesCache(): void {
    this.distinctValuesCache.clear()
    console.log('🗑️  Distinct values cache cleared')
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
            fields: ['Company Name'], // Only fetch minimal data for counting
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
      console.error('Error getting filtered count:', error)
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
        console.log(`📊 Using cached distinct values for ${fieldName}: ${cached.values.length} values`)
        return cached.values
      }
      
      console.log(`📊 Fetching distinct values for field: ${fieldName}`)
      
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
                console.error(`   ❌ Error in eachPage for ${fieldName}:`, err)
                console.error(`   Error details:`, err.message || err)
                reject(err)
              } else {
                console.log(`   ✅ Completed scanning ${pageCount} pages for ${fieldName}`)
                resolve()
              }
            }
          )
      })
      
      // Sort and limit results
      let values = Array.from(uniqueValues).sort()
      
      // For fields with many options, prioritize common values
      // This helps users find frequently used options faster
      if (values.length > 50) {
        // Common status values should appear first
        if (fieldName === 'status') {
          const priority = ['Active', 'Closed']
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
      
      console.log(`✅ Found ${values.length} distinct values for ${fieldName}:`, values.slice(0, 10).join(', '), values.length > 10 ? '...' : '')
      
      // Cache the results
      this.distinctValuesCache.set(cacheKey, {
        values,
        timestamp: Date.now(),
      })
      
      return values
    } catch (error: any) {
      console.error(`❌ Error getting distinct values for ${fieldName}:`, error)
      console.error(`   Error message:`, error.message)
      console.error(`   Error stack:`, error.stack)
      return []
    }
  }

  /**
   * Map our field names to Airtable field names
   * This must match the exact field names in your Airtable table
   */
  private mapFieldNameToAirtable(fieldName: string): string {
    const fieldMap: Record<string, string> = {
      'companyName': 'Company Name',
      'isinCode': 'ISIN Code',
      'status': 'Status',
      'primaryIndustry': 'Primary Industry',
      'primaryActivity': 'Primary Activity',
      'primarySector': 'Primary Sector',
    }
    const mapped = fieldMap[fieldName] || fieldName
    // Only log if mapping was found (to reduce noise)
    if (fieldMap[fieldName]) {
      console.log(`   Field mapping: ${fieldName} -> ${mapped}`)
    }
    return mapped
  }

  /**
   * Get a single company by ID
   */
  async findById(id: string): Promise<any | null> {
    try {
      const record = await this.base(this.tableName).find(id)
      return this.mapAirtableToCompany(record)
    } catch (error: any) {
      if (error.statusCode === 404 || error.error === 'NOT_FOUND') {
        return null
      }
      if (error.error === 'NOT_AUTHORIZED' || error.statusCode === 403) {
        throw new Error(`Airtable authentication failed (403). Check your API token permissions.`)
      }
      console.error('Error fetching company from Airtable:', error)
      throw new Error(`Failed to fetch company: ${error.error || error.message || 'Unknown error'} (Status: ${error.statusCode || 'N/A'})`)
    }
  }

  /**
   * Create a new company in Airtable
   */
  async create(fields: Record<string, any>): Promise<any> {
    try {
      console.log(`📝 Creating company in Airtable`)
      console.log(`   Input fields:`, JSON.stringify(fields, null, 2))
      
      const airtableFields = this.mapCompanyToAirtable(fields)
      console.log(`   Mapped Airtable fields:`, JSON.stringify(airtableFields, null, 2))
      
      if (Object.keys(airtableFields).length === 0) {
        throw new Error('No valid fields to create company. Check field mapping.')
      }
      
      const record = await this.base(this.tableName).create(airtableFields)
      console.log(`✅ Successfully created company in Airtable: ${record.id}`)
      
      // Clear count cache since we added a record
      this.clearCountCache()
      this.clearDistinctValuesCache() // Also clear filter options cache
      
      const mappedCompany = this.mapAirtableToCompany(record)
      console.log(`✅ Mapped company:`, { id: mappedCompany.id, companyName: mappedCompany.companyName })
      return mappedCompany
    } catch (error: any) {
      console.error('❌ Error creating company in Airtable:', error)
      console.error('   Error type:', error.constructor.name)
      console.error('   Status code:', error.statusCode)
      console.error('   Error message:', error.message)
      console.error('   Error details:', JSON.stringify(error, null, 2))
      
      if (error.error === 'NOT_AUTHORIZED' || error.statusCode === 403) {
        throw new Error(`Airtable authentication failed (403). Check your API token has write permissions.`)
      }
      if (error.error === 'INVALID_VALUE_FOR_COLUMN' || error.statusCode === 422) {
        throw new Error(`Invalid field value: ${error.message || 'Check field names and values match Airtable schema'}`)
      }
      throw new Error(`Failed to create company: ${error.error || error.message || 'Unknown error'} (Status: ${error.statusCode || 'N/A'})`)
    }
  }

  /**
   * Update a company in Airtable
   */
  async update(id: string, fields: Record<string, any>): Promise<any> {
    try {
      console.log(`📝 Updating company in Airtable: ${id}`)
      console.log(`   Fields to update:`, Object.keys(fields).join(', '))
      
      const airtableFields = this.mapCompanyToAirtable(fields)
      console.log(`   Mapped Airtable fields:`, Object.keys(airtableFields).join(', '))
      
      const record = await this.base(this.tableName).update(id, airtableFields)
      console.log(`✅ Successfully updated company: ${id}`)
      return this.mapAirtableToCompany(record)
    } catch (error: any) {
      console.error(`❌ Error updating company ${id}:`, error)
      console.error(`   Error type:`, error.constructor.name)
      console.error(`   Status code:`, error.statusCode)
      console.error(`   Error message:`, error.message)
      
      if (error.statusCode === 404 || error.error === 'NOT_FOUND') {
        console.error(`   Company not found in Airtable`)
        return null
      }
      if (error.error === 'NOT_AUTHORIZED' || error.statusCode === 403) {
        throw new Error(`Airtable authentication failed (403). Check your API token has write permissions.`)
      }
      throw new Error(`Failed to update company: ${error.error || error.message || 'Unknown error'} (Status: ${error.statusCode || 'N/A'})`)
    }
  }

  /**
   * Delete a company from Airtable
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
      if (error.error === 'NOT_AUTHORIZED' || error.statusCode === 403) {
        throw new Error(`Airtable authentication failed (403). Check your API token has delete permissions.`)
      }
      console.error('Error deleting company from Airtable:', error)
      throw new Error(`Failed to delete company: ${error.error || error.message || 'Unknown error'} (Status: ${error.statusCode || 'N/A'})`)
    }
  }

  /**
   * Check if a company exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      console.log(`🔍 Checking if company exists: ${id}`)
      const record = await this.base(this.tableName).find(id)
      const exists = !!record
      console.log(`   Company exists: ${exists}`)
      return exists
    } catch (error: any) {
      if (error.statusCode === 404 || error.error === 'NOT_FOUND') {
        console.log(`   Company not found (404)`)
        return false
      }
      console.error('Error checking if company exists:', error)
      console.error('   Error details:', error.message || error)
      // Don't throw - return false if there's an error checking
      return false
    }
  }
}

// Singleton instance
export const airtableService = new AirtableService()

