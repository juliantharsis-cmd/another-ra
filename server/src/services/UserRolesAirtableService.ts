import Airtable from 'airtable'
import * as fs from 'fs'
import * as path from 'path'

/**
 * User Roles Airtable Service
 * 
 * Handles all Airtable API interactions for User Roles table.
 * This service can be replaced with a PostgreSQL service later
 * without changing the repository interface.
 */
export class UserRolesAirtableService {
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
    this.tableName = process.env.AIRTABLE_USER_ROLES_TABLE_ID || 
                     process.env.AIRTABLE_USER_ROLES_TABLE_NAME || 
                     'User Roles'
    
    console.log(`🌿 UserRolesAirtableService initialized:`)
    console.log(`   Base ID: ${baseId}`)
    console.log(`   Table: ${this.tableName}`)
    console.log(`   API Key: ${apiKey ? apiKey.substring(0, 20) + '...' : 'NOT SET'}`)
    
    Airtable.configure({ apiKey })
    this.base = Airtable.base(baseId)
    
    // Set cache file path
    this.cacheFilePath = path.join(__dirname, '../../.cache', 'user-roles-total-count.json')
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
          console.log(`📊 Loaded User Roles total count from disk cache: ${cacheData.count}`)
        }
      }
    } catch (error) {
      console.warn('⚠️  Could not load User Roles count cache from disk:', error)
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
      console.warn('⚠️  Could not save User Roles count cache to disk:', error)
    }
  }

  /**
   * Map Airtable record to UserRole interface
   */
  mapAirtableToUserRole(record: Airtable.Record<any>): any {
    const fields = record.fields
    
    const result: any = {
      id: record.id,
    }
    
    // Map all fields dynamically
    Object.keys(fields).forEach(fieldName => {
      const value = fields[fieldName]
      
      // Handle linked records - extract IDs
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0].id && !value[0].url && !value[0].filename) {
        result[fieldName] = value.map((item: any) => item.id || item)
      } else {
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
   * Get all User Roles records
   */
  async findAll(): Promise<any[]> {
    try {
      const records = await this.base(this.tableName)
        .select({
          sort: [{ field: 'Name', direction: 'asc' }],
        })
        .all()
      
      return records.map(record => this.mapAirtableToUserRole(record))
    } catch (error: any) {
      console.error('Error in UserRolesAirtableService.findAll:', error)
      throw error
    }
  }

  /**
   * Get paginated User Roles records with filtering and search
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
      const selectOptions: Airtable.SelectOptions<any> = {
        pageSize: Math.min(limit, 100), // Airtable max page size is 100
      }

      // Add sorting
      if (sortBy) {
        selectOptions.sort = [{ field: sortBy, direction: sortOrder }]
      } else {
        selectOptions.sort = [{ field: 'Name', direction: 'asc' }]
      }

      // Add search filter
      if (search && search.trim()) {
        const searchFormula = `SEARCH("${search.trim()}", {Name})`
        selectOptions.filterByFormula = searchFormula
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
          
          if (selectOptions.filterByFormula) {
            selectOptions.filterByFormula = `AND(${selectOptions.filterByFormula}, ${combinedFormula})`
          } else {
            selectOptions.filterByFormula = combinedFormula
          }
        }
      }

      console.log(`📥 Fetching paginated User Roles: offset=${offset}, limit=${limit}`)
      if (filters) {
        console.log(`🔍 Filters:`, filters)
      }
      if (search) {
        console.log(`🔍 Search:`, search)
      }

      // Calculate total count (with caching)
      const total = await this.getTotalCount(selectOptions.filterByFormula)

      // Fetch records
      let allRecords: Airtable.Record<any>[] = []
      let currentOffset = offset
      let fetched = 0

      while (fetched < limit) {
        const pageSize = Math.min(limit - fetched, 100)
        const selectParams: Airtable.SelectOptions<any> = {
          pageSize,
          maxRecords: pageSize,
        }
        
        if (selectOptions.sort) {
          selectParams.sort = selectOptions.sort
        }
        
        if (selectOptions.filterByFormula) {
          selectParams.filterByFormula = selectOptions.filterByFormula
        }
        
        const page = await this.base(this.tableName)
          .select(selectParams)
          .all()

        if (page.length === 0) break

        allRecords = allRecords.concat(page)
        fetched += page.length

        if (page.length < pageSize) break
        currentOffset += pageSize
      }

      const mappedRecords = allRecords.map(record => this.mapAirtableToUserRole(record))

      console.log(`✅ Fetched ${mappedRecords.length} User Roles records (from ${fetched} fetched, ${total} total)`)

      return {
        records: mappedRecords,
        total,
      }
    } catch (error: any) {
      console.error('Error in UserRolesAirtableService.findPaginated:', error)
      throw error
    }
  }

  /**
   * Get a single User Role by ID
   */
  async findById(id: string): Promise<any | null> {
    try {
      const record = await this.base(this.tableName).find(id)
      return this.mapAirtableToUserRole(record)
    } catch (error: any) {
      if (error.error === 'NOT_FOUND') {
        return null
      }
      console.error('Error in UserRolesAirtableService.findById:', error)
      throw error
    }
  }

  /**
   * Create a new User Role
   */
  async create(data: any): Promise<any> {
    try {
      const fields: any = {}
      
      // Map data to Airtable fields
      Object.keys(data).forEach(key => {
        if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'createdBy' && key !== 'lastModifiedBy') {
          fields[key] = data[key]
        }
      })

      const record = await this.base(this.tableName).create([{ fields }])
      this.clearCountCache()
      return this.mapAirtableToUserRole(record[0])
    } catch (error: any) {
      console.error('Error in UserRolesAirtableService.create:', error)
      throw error
    }
  }

  /**
   * Update an existing User Role
   */
  async update(id: string, data: any): Promise<any> {
    try {
      const fields: any = {}
      
      // Map data to Airtable fields
      Object.keys(data).forEach(key => {
        if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'createdBy' && key !== 'lastModifiedBy') {
          fields[key] = data[key]
        }
      })

      const record = await this.base(this.tableName).update([{ id, fields }])
      this.clearCountCache()
      return this.mapAirtableToUserRole(record[0])
    } catch (error: any) {
      console.error('Error in UserRolesAirtableService.update:', error)
      throw error
    }
  }

  /**
   * Delete a User Role
   */
  async delete(id: string): Promise<void> {
    try {
      await this.base(this.tableName).destroy([id])
      this.clearCountCache()
    } catch (error: any) {
      console.error('Error in UserRolesAirtableService.delete:', error)
      throw error
    }
  }

  /**
   * Get distinct values for a field (for filters)
   */
  async getDistinctValues(field: string, limit: number = 100): Promise<string[]> {
    try {
      // Check cache first
      const cacheKey = `${field}_${limit}`
      const cached = this.distinctValuesCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.DISTINCT_VALUES_CACHE_TTL) {
        console.log(`📊 Using cached distinct values for User Roles ${field}: ${cached.values.length} values`)
        return cached.values
      }

      const records = await this.base(this.tableName)
        .select({
          fields: [field],
          maxRecords: limit * 2, // Fetch more to account for duplicates
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

      const distinctValues = Array.from(values).slice(0, limit).sort()
      
      // Cache the result
      this.distinctValuesCache.set(cacheKey, {
        values: distinctValues,
        timestamp: Date.now(),
      })

      return distinctValues
    } catch (error: any) {
      console.error(`Error in UserRolesAirtableService.getDistinctValues for field ${field}:`, error)
      return []
    }
  }

  /**
   * Get total count of records (with caching)
   */
  private async getTotalCount(filterFormula?: string): Promise<number> {
    try {
      // Check cache if no filter
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
      console.error('Error in UserRolesAirtableService.getTotalCount:', error)
      return 0
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
      console.warn('⚠️  Could not delete User Roles count cache file:', error)
    }
  }

  /**
   * Helper methods for metadata
   */
  private getCreatedTime(record: Airtable.Record<any>): Date | null {
    return record._rawJson.createdTime ? new Date(record._rawJson.createdTime) : null
  }

  private getModifiedTime(record: Airtable.Record<any>): Date | null {
    return record._rawJson.createdTime ? new Date(record._rawJson.createdTime) : null
  }

  private getCreatedBy(fields: any): string | null {
    return fields['Created By'] || fields['Created by'] || fields['created_by'] || null
  }

  private getLastModifiedBy(fields: any): string | null {
    return fields['Last Modified By'] || fields['Last modified by'] || fields['last_modified_by'] || null
  }

  private formatDate(date: Date | null): string | null {
    if (!date) return null
    return date.toISOString()
  }
}

// Singleton instance
let userRolesAirtableServiceInstance: UserRolesAirtableService | null = null

export function getUserRolesAirtableService(): UserRolesAirtableService {
  if (!userRolesAirtableServiceInstance) {
    userRolesAirtableServiceInstance = new UserRolesAirtableService()
  }
  return userRolesAirtableServiceInstance
}

