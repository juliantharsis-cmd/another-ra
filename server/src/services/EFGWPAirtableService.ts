import Airtable from 'airtable'
import * as fs from 'fs'
import * as path from 'path'
import { RelationshipResolver } from './RelationshipResolver'

/**
 * EF GWP Airtable Service
 * 
 * Handles all Airtable API interactions for EF GWP (Emission Factor Global Warming Potential) table.
 * This service can be replaced with a PostgreSQL service later
 * without changing the repository interface.
 */
export class EFGWPAirtableService {
  private base: Airtable.Base
  private tableName: string
  private readonly cacheFilePath: string
  private totalCountCache: { count: number; timestamp: number } | null = null
  private readonly COUNT_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private distinctValuesCache: Map<string, { values: string[]; timestamp: number }> = new Map()
  private readonly DISTINCT_VALUES_CACHE_TTL = 10 * 60 * 1000 // 10 minutes
  private relationshipResolver: RelationshipResolver | null = null

  constructor() {
    const apiKey = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || 
                   process.env.AIRTABLE_API_KEY
    
    if (!apiKey) {
      throw new Error('Airtable API token is required. Set AIRTABLE_PERSONAL_ACCESS_TOKEN in .env file')
    }
    
    const baseId = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 
                   'appGtLbKhmNkkTLVL'
    
    // Use table ID if provided, otherwise use table name
    // EF GWP table - use table name as default to match Airtable
    this.tableName = process.env.AIRTABLE_EMISSION_FACTOR_TABLE_ID || 
                     process.env.AIRTABLE_EMISSION_FACTOR_TABLE_NAME || 
                     'EF GWP' // Default table name in Airtable
    
    console.log(`🌱 EFGWPAirtableService initialized:`)
    console.log(`   Base ID: ${baseId}`)
    console.log(`   Table: ${this.tableName}`)
    console.log(`   API Key: ${apiKey ? apiKey.substring(0, 20) + '...' : 'NOT SET'}`)
    
    Airtable.configure({ apiKey })
    this.base = Airtable.base(baseId)
    
    // Initialize relationship resolver
    this.relationshipResolver = new RelationshipResolver(baseId, apiKey)
    
    // Set cache file path
    this.cacheFilePath = path.join(__dirname, '../../.cache', 'ef-gwp-total-count.json')
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
          console.log(`📊 Loaded EF GWP total count from disk cache: ${cacheData.count}`)
        }
      }
    } catch (error) {
      console.warn('⚠️  Could not load EF GWP count cache from disk:', error)
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
      console.warn('⚠️  Could not save EF GWP count cache to disk:', error)
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
      console.warn('⚠️  Could not delete EF GWP count cache file:', error)
    }
  }

  /**
   * Clear distinct values cache
   */
  private clearDistinctValuesCache(): void {
    this.distinctValuesCache.clear()
  }

  /**
   * Map Airtable record to EFGWP interface
   */
  mapAirtableToEFGWP(record: Airtable.Record<any>): any {
    const fields = record.fields
    
    const getField = (fieldNames: string[], defaultValue: any = '') => {
      for (const name of fieldNames) {
        if (fields[name] !== undefined && fields[name] !== null && fields[name] !== '') {
          return fields[name]
        }
      }
      return defaultValue
    }
    
    // Map Airtable field names to our EFGWP interface
    // EF GWP table fields: Name (formula), ARS Version, Status, Green House Gas (linked), GWP factor, Protocol (linked), Notes, EF CO2e, EF/Detailed G (linked)
    // Try multiple field name variations to handle different naming conventions
    const factor_name = getField(['Name', 'name', 'factor_name', 'Factor Name', 'FactorName'], '')
    const ars_version = getField(['ARS Version', 'ARSVersion', 'ars_version', 'arsVersion', 'ARS'], '')
    const status = getField(['Status', 'status', 'STATUS'], 'Active')
    const gwp_value = getField(['GWP factor', 'GWP Factor', 'gwp_factor', 'gwp_value', 'GWP Value', 'GWPValue', 'GWP'], 0)
    const ef_co2e = getField(['EF CO2e', 'EFCO2e', 'ef_co2e', 'efCO2e', 'CO2e'], '')
    const notes = getField(['Notes', 'notes', 'Note', 'NOTES'])
    // Legacy fields (for backward compatibility)
    const unit = getField(['unit', 'Unit', 'UNIT'], '') // Not in Airtable schema
    const source = getField(['source', 'Source', 'SOURCE'], '') // Legacy - use protocol instead
    
    // Extract linked records for "Green House Gas" (GHG Type relationship)
    const greenHouseGasField = getField(['Green House Gas', 'GreenHouseGas', 'greenHouseGas', 'green_house_gas', 'GHG Type', 'ghgType', 'ghg_type'], null)
    let greenHouseGas: string | string[] | undefined
    let greenHouseGasName: string | string[] | undefined
    
    if (greenHouseGasField) {
      if (Array.isArray(greenHouseGasField)) {
        // Multiple linked records
        greenHouseGas = greenHouseGasField.map((item: any) => 
          typeof item === 'string' ? item : item.id || item
        )
        // Extract names if available (Airtable linked records may include name in the object)
        greenHouseGasName = greenHouseGasField.map((item: any) => 
          typeof item === 'string' ? item : (item.fields?.Name || item.name || item.id || '')
        )
      } else {
        // Single linked record
        greenHouseGas = typeof greenHouseGasField === 'string' 
          ? greenHouseGasField 
          : greenHouseGasField.id || greenHouseGasField
        greenHouseGasName = typeof greenHouseGasField === 'string'
          ? undefined
          : (greenHouseGasField.fields?.Name || greenHouseGasField.name || undefined)
      }
    }
    
    // Extract linked records for "Protocol"
    const protocolField = getField(['Protocol', 'protocol'], null)
    let protocol: string | string[] | undefined
    let protocolName: string | string[] | undefined
    
    if (protocolField) {
      if (Array.isArray(protocolField)) {
        protocol = protocolField.map((item: any) => 
          typeof item === 'string' ? item : item.id || item
        )
        protocolName = protocolField.map((item: any) => 
          typeof item === 'string' ? item : (item.fields?.Name || item.name || item.id || '')
        )
      } else {
        protocol = typeof protocolField === 'string' 
          ? protocolField 
          : protocolField.id || protocolField
        protocolName = typeof protocolField === 'string'
          ? undefined
          : (protocolField.fields?.Name || protocolField.name || undefined)
      }
    }
    
    // Extract linked records for "EF/Detailed G"
    const efDetailedGField = getField(['EF/Detailed G', 'EFDetailedG', 'efDetailedG', 'ef_detailed_g', 'EF Detailed G'], null)
    let efDetailedG: string | string[] | undefined
    let efDetailedGName: string | string[] | undefined
    
    if (efDetailedGField) {
      if (Array.isArray(efDetailedGField)) {
        efDetailedG = efDetailedGField.map((item: any) => 
          typeof item === 'string' ? item : item.id || item
        )
        efDetailedGName = efDetailedGField.map((item: any) => 
          typeof item === 'string' ? item : (item.fields?.Name || item.name || item.id || '')
        )
      } else {
        efDetailedG = typeof efDetailedGField === 'string' 
          ? efDetailedGField 
          : efDetailedGField.id || efDetailedGField
        efDetailedGName = typeof efDetailedGField === 'string'
          ? undefined
          : (efDetailedGField.fields?.Name || efDetailedGField.name || undefined)
      }
    }
    
    return {
      id: record.id,
      factor_name,
      ars_version,
      status,
      gwp_value: typeof gwp_value === 'number' ? gwp_value : parseFloat(String(gwp_value)) || 0,
      ef_co2e,
      notes,
      greenHouseGas,
      greenHouseGasName,
      protocol,
      protocolName,
      efDetailedG,
      efDetailedGName,
      // Legacy fields
      unit,
      source: source || (protocolName ? (Array.isArray(protocolName) ? protocolName.join(', ') : protocolName) : ''),
      created_at: this.formatDate(this.getCreatedTime(record)),
      updated_at: this.formatDate(this.getModifiedTime(record)),
      createdBy: this.getCreatedBy(fields),
      lastModifiedBy: this.getLastModifiedBy(fields),
    }
  }

  /**
   * Map EFGWP DTO to Airtable fields
   */
  mapEFGWPToAirtable(dto: any): Record<string, any> {
    const fields: Record<string, any> = {}
    
    // Map to actual EF GWP Airtable field names
    // EF GWP table fields: Name (formula), ARS Version, Status, Green House Gas, GWP factor, Protocol, Notes, EF CO2e, EF/Detailed G
    // Use exact Airtable field names from the schema
    if (dto.factor_name !== undefined && dto.factor_name !== null && String(dto.factor_name).trim() !== '') {
      fields['Name'] = String(dto.factor_name).trim() // EF GWP uses 'Name' field (formula, may be read-only)
    }
    if (dto.ars_version !== undefined && dto.ars_version !== null && String(dto.ars_version).trim() !== '') {
      fields['ARS Version'] = String(dto.ars_version).trim()
    }
    if (dto.status !== undefined && dto.status !== null) {
      fields['Status'] = String(dto.status).trim()
    } else {
      fields['Status'] = 'Active' // Default
    }
    if (dto.gwp_value !== undefined && dto.gwp_value !== null) {
      fields['GWP factor'] = typeof dto.gwp_value === 'number' ? dto.gwp_value : parseFloat(String(dto.gwp_value))
    }
    if (dto.ef_co2e !== undefined && dto.ef_co2e !== null && String(dto.ef_co2e).trim() !== '') {
      fields['EF CO2e'] = String(dto.ef_co2e).trim()
    }
    if (dto.notes !== undefined && dto.notes !== null && String(dto.notes).trim() !== '') {
      fields['Notes'] = String(dto.notes).trim()
    }
    
    // Map relationship fields - Airtable expects arrays of record IDs
    if (dto.greenHouseGas !== undefined && dto.greenHouseGas !== null) {
      if (Array.isArray(dto.greenHouseGas)) {
        fields['Green House Gas'] = dto.greenHouseGas.filter(id => id) // Filter out empty values
      } else {
        fields['Green House Gas'] = [dto.greenHouseGas]
      }
    }
    
    if (dto.protocol !== undefined && dto.protocol !== null) {
      if (Array.isArray(dto.protocol)) {
        fields['Protocol'] = dto.protocol.filter(id => id)
      } else {
        fields['Protocol'] = [dto.protocol]
      }
    }
    
    if (dto.efDetailedG !== undefined && dto.efDetailedG !== null) {
      if (Array.isArray(dto.efDetailedG)) {
        fields['EF/Detailed G'] = dto.efDetailedG.filter(id => id)
      } else {
        fields['EF/Detailed G'] = [dto.efDetailedG]
      }
    }
    
    return fields
  }

  /**
   * Get all EF GWP records from Airtable
   */
  async findAll(): Promise<any[]> {
    try {
      const records = await this.base(this.tableName)
        .select({
          sort: [{ field: 'Name', direction: 'asc' }], // EF GWP table uses 'Name' field
        })
        .all()
      
      const mapped = records.map(record => this.mapAirtableToEFGWP(record))
      // Resolve GHG Type names from IDs
      await this.resolveGHGTypeNames(mapped)
      return mapped
    } catch (error: any) {
      console.error('Error fetching EF GWP records from Airtable:', error)
      throw new Error(`Failed to fetch EF GWP records: ${error.error || error.message || 'Unknown error'}`)
    }
  }

  /**
   * Get paginated EF GWP records from Airtable
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
      const sortField = sortBy && sortBy.trim() !== '' ? this.mapFieldNameToAirtable(sortBy) : 'Name' // Default to 'Name' field
      const sortDirection = sortOrder === 'desc' ? 'desc' : 'asc'
      
      // Build Airtable filter formula
      const filterFormulas: string[] = []
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            // Handle linked record filters (e.g., greenHouseGas)
            if (key === 'greenHouseGas') {
              // Filter by linked record ID in "Green House Gas" field
              // Airtable linked records are stored as arrays of record IDs
              const escapedValue = String(value).replace(/'/g, "''")
              filterFormulas.push(`FIND('${escapedValue}', ARRAYJOIN({Green House Gas}, ',')) > 0`)
            } else {
              const airtableFieldName = this.mapFieldNameToAirtable(key)
              const escapedValue = String(value).replace(/'/g, "''")
              filterFormulas.push(`{${airtableFieldName}} = '${escapedValue}'`)
            }
          }
        })
      }
      
      if (search) {
        // Search in EF GWP table fields: Name, Notes
        const searchFields = ['Name', 'Notes'] // Use actual Airtable field names
        const escapedSearch = search.replace(/'/g, "''")
        const searchFormulas = searchFields.map(field => 
          `FIND(LOWER('${escapedSearch}'), LOWER({${field}})) > 0`
        )
        filterFormulas.push(`OR(${searchFormulas.join(', ')})`)
      }
      
      const filterFormula = filterFormulas.length > 0 ? `AND(${filterFormulas.join(', ')})` : undefined
      
      let allRecords: Airtable.Record<any>[] = []
      let currentPage = 0
      const startPage = Math.floor(offset / 100) + 1
      const endPage = Math.ceil((offset + limit) / 100)
      
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
              if (err) reject(err)
              else resolve()
            }
          )
      })
      
      const startIndexInFetched = offset % 100
      const paginatedRecords = allRecords.slice(startIndexInFetched, startIndexInFetched + limit)
      
      // Get total count
      let total: number
      if (filterFormula) {
        total = await this.getFilteredCount(filterFormula)
      } else {
        total = await this.getTotalCount(true)
      }

      const mappedRecords = paginatedRecords.map(record => this.mapAirtableToEFGWP(record))
      
      // Resolve GHG Type names from IDs
      await this.resolveGHGTypeNames(mappedRecords)
      
      return {
        records: mappedRecords,
        total,
      }
    } catch (error: any) {
      console.error('Error fetching paginated EF GWP records:', error)
      throw new Error(`Failed to fetch EF GWP records: ${error.error || error.message || 'Unknown error'}`)
    }
  }

  /**
   * Map field name to Airtable field name
   * Maps our internal field names to actual EF GWP Airtable field names
   */
  private mapFieldNameToAirtable(fieldName: string): string {
    const mapping: Record<string, string> = {
      'factor_name': 'Name', // EF GWP table uses 'Name' field
      'gwp_value': 'GWP factor', // EF GWP table uses 'GWP factor' field
      'unit': 'unit', // May not exist in EF GWP, but try it
      'status': 'Status', // EF GWP table uses 'Status' field
      // Also handle camelCase variations
      'factorName': 'Name',
      'gwpValue': 'GWP factor',
    }
    // Return mapped name or try the original field name
    return mapping[fieldName] || fieldName
  }

  /**
   * Get a single EF GWP record by ID
   */
  async findById(id: string): Promise<any | null> {
    try {
      const record = await this.base(this.tableName).find(id)
      const mapped = this.mapAirtableToEFGWP(record)
      // Resolve GHG Type names from IDs
      await this.resolveGHGTypeNames([mapped])
      return mapped
    } catch (error: any) {
      if (error.statusCode === 404 || error.error === 'NOT_FOUND') {
        return null
      }
      throw new Error(`Failed to fetch EF GWP record: ${error.error || error.message || 'Unknown error'}`)
    }
  }

  /**
   * Create a new EF GWP record
   */
  async create(fields: Record<string, any>): Promise<any> {
    try {
      const airtableFields = this.mapEFGWPToAirtable(fields)
      const record = await this.base(this.tableName).create(airtableFields)
      this.clearCountCache()
      this.clearDistinctValuesCache()
      return this.mapAirtableToEFGWP(record)
    } catch (error: any) {
      console.error('Error creating EF GWP record:', error)
      throw new Error(`Failed to create EF GWP record: ${error.error || error.message || 'Unknown error'}`)
    }
  }

  /**
   * Update an EF GWP record
   */
  async update(id: string, fields: Record<string, any>): Promise<any> {
    try {
      const airtableFields = this.mapEFGWPToAirtable(fields)
      const record = await this.base(this.tableName).update(id, airtableFields)
      const mapped = this.mapAirtableToEFGWP(record)
      // Resolve GHG Type names from IDs (same as findById)
      await this.resolveGHGTypeNames([mapped])
      return mapped
    } catch (error: any) {
      if (error.statusCode === 404 || error.error === 'NOT_FOUND') {
        return null
      }
      throw new Error(`Failed to update EF GWP record: ${error.error || error.message || 'Unknown error'}`)
    }
  }

  /**
   * Delete an EF GWP record
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
      throw new Error(`Failed to delete EF GWP record: ${error.error || error.message || 'Unknown error'}`)
    }
  }

  /**
   * Get total count
   */
  async getTotalCount(lazy: boolean = true): Promise<number> {
    try {
      if (this.totalCountCache && Date.now() - this.totalCountCache.timestamp < this.COUNT_CACHE_TTL) {
        return this.totalCountCache.count
      }

      let count = 0
      await new Promise<void>((resolve, reject) => {
        this.base(this.tableName)
          .select({
            fields: ['Name'], // EF GWP table uses 'Name' field
            pageSize: 100,
          })
          .eachPage(
            (records, fetchNextPage) => {
              count += records.length
              fetchNextPage()
            },
            (err) => {
              if (err) reject(err)
              else resolve()
            }
          )
      })
      
      this.totalCountCache = { count, timestamp: Date.now() }
      this.saveCacheToDisk()
      return count
    } catch (error: any) {
      console.error('Error getting total count:', error)
      return this.totalCountCache?.count || 0
    }
  }

  /**
   * Get count of records matching a filter formula
   */
  private async getFilteredCount(filterFormula: string): Promise<number> {
    try {
      let count = 0
      await new Promise<void>((resolve, reject) => {
        this.base(this.tableName)
          .select({
            filterByFormula: filterFormula,
            fields: ['Name'], // EF GWP table uses 'Name' field
            pageSize: 100,
          })
          .eachPage(
            (records, fetchNextPage) => {
              count += records.length
              fetchNextPage()
            },
            (err) => {
              if (err) reject(err)
              else resolve()
            }
          )
      })
      return count
    } catch (error: any) {
      console.error('Error getting filtered count:', error)
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
        return cached.values
      }
      
      const airtableFieldName = this.mapFieldNameToAirtable(fieldName)
      const uniqueValues = new Set<string>()
      
      await new Promise<void>((resolve, reject) => {
        this.base(this.tableName)
          .select({
            fields: [airtableFieldName],
            pageSize: 100,
            maxRecords: Math.min(limit * 5, 5000),
          })
          .eachPage(
            (records, fetchNextPage) => {
              records.forEach(record => {
                const value = record.fields[airtableFieldName]
                if (value && typeof value === 'string' && value.trim()) {
                  uniqueValues.add(value.trim())
                } else if (Array.isArray(value)) {
                  value.forEach(v => {
                    if (v && typeof v === 'string' && v.trim()) {
                      uniqueValues.add(v.trim())
                    }
                  })
                }
              })
              
              if (uniqueValues.size >= limit) {
                resolve()
                return
              }
              fetchNextPage()
            },
            (err) => {
              if (err) reject(err)
              else resolve()
            }
          )
      })
      
      let values = Array.from(uniqueValues).sort()
      if (fieldName === 'status') {
        const priority = ['Active', 'Inactive']
        values = [
          ...priority.filter(v => values.includes(v)),
          ...values.filter(v => !priority.includes(v))
        ]
      }
      
      const maxOptions = 500
      if (values.length > maxOptions) {
        values = values.slice(0, maxOptions)
      }
      
      this.distinctValuesCache.set(cacheKey, {
        values,
        timestamp: Date.now(),
      })
      
      return values
    } catch (error: any) {
      console.error(`Error getting distinct values for ${fieldName}:`, error)
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

  /**
   * Resolve linked record names from IDs
   * Fetches related records to get names for linked record IDs (GHG Type, Protocol, EF/Detailed G)
   */
  private async resolveGHGTypeNames(efGwpRecords: any[]): Promise<void> {
    try {
      // Collect all unique GHG Type IDs
      const ghgTypeIds = new Set<string>()
      efGwpRecords.forEach(record => {
        if (record.greenHouseGas) {
          if (Array.isArray(record.greenHouseGas)) {
            record.greenHouseGas.forEach((id: string) => {
              if (id && typeof id === 'string') ghgTypeIds.add(id)
            })
          } else if (typeof record.greenHouseGas === 'string') {
            ghgTypeIds.add(record.greenHouseGas)
          }
        }
      })

      if (ghgTypeIds.size === 0) {
        return // No GHG Types to resolve
      }

      // Use RelationshipResolver if available (better caching and performance)
      if (this.relationshipResolver) {
        const idsArray = Array.from(ghgTypeIds)
        const resolved = await this.relationshipResolver.resolveLinkedRecords(
          idsArray,
          'GHG Type',
          'Name'
        )
        
        // Create a map for quick lookup
        const nameMap = new Map<string, string>()
        resolved.forEach(r => {
          nameMap.set(r.id, r.name)
        })
        
        // Update records with resolved names
        efGwpRecords.forEach(record => {
          if (record.greenHouseGas) {
            if (Array.isArray(record.greenHouseGas)) {
              record.greenHouseGasName = record.greenHouseGas
                .map((id: string) => nameMap.get(id) || id)
                .filter(Boolean)
            } else if (typeof record.greenHouseGas === 'string') {
              record.greenHouseGasName = nameMap.get(record.greenHouseGas) || record.greenHouseGas
            }
          }
        })
        return
      }
      
      // Fallback to original method if RelationshipResolver is not available

      console.log(`🔍 Resolving ${ghgTypeIds.size} GHG Type name(s) from IDs`)

      // Fetch GHG Type records to get names
      const ghgTypeMap = new Map<string, string>()
      // Try different possible table names
      const possibleTableNames = ['GHG Type', 'GHG TYPE', 'GHGType']
      
      let resolved = false
      for (const ghgTypeTableName of possibleTableNames) {
        try {
          // Fetch all GHG Types in batches
          const idsArray = Array.from(ghgTypeIds)
          for (let i = 0; i < idsArray.length; i += 50) {
            const batch = idsArray.slice(i, i + 50)
            const formula = `OR(${batch.map(id => `RECORD_ID() = '${id.replace(/'/g, "''")}'`).join(', ')})`
            
            const records = await this.base(ghgTypeTableName)
              .select({
                filterByFormula: formula,
                fields: ['Name', 'Short code'],
              })
              .all()

            records.forEach(record => {
              const name = record.fields['Name'] || record.fields['Short code'] || record.id
              ghgTypeMap.set(record.id, name)
            })
          }
          
          console.log(`✅ Successfully resolved ${ghgTypeMap.size} GHG Type name(s) from table "${ghgTypeTableName}"`)
          resolved = true
          break
        } catch (err: any) {
          console.log(`⚠️ Failed to fetch from table "${ghgTypeTableName}":`, err.message)
          // Try next table name
          continue
        }
      }

      if (!resolved) {
        console.error('❌ Failed to resolve GHG Type names from any table name')
        return
      }

      // Map names to EF GWP records
      let resolvedCount = 0
      efGwpRecords.forEach(record => {
        if (record.greenHouseGas) {
          if (Array.isArray(record.greenHouseGas)) {
            record.greenHouseGasName = record.greenHouseGas
              .map((id: string) => {
                const name = ghgTypeMap.get(id)
                if (name) resolvedCount++
                return name || id
              })
              .filter(Boolean)
          } else if (typeof record.greenHouseGas === 'string') {
            const name = ghgTypeMap.get(record.greenHouseGas)
            if (name) {
              record.greenHouseGasName = name
              resolvedCount++
            } else {
              record.greenHouseGasName = record.greenHouseGas
            }
          }
        }
      })
      
      console.log(`✅ Mapped GHG Type names to ${resolvedCount} EF GWP record(s)`)
      
      // Resolve Protocol names
      await this.resolveProtocolNames(efGwpRecords)
      
      // Resolve EF/Detailed G names
      await this.resolveEFDetailedGNames(efGwpRecords)
    } catch (error) {
      console.error('❌ Error resolving GHG Type names:', error)
      // Don't throw - continue without names
    }
  }

  /**
   * Resolve Protocol names from IDs
   */
  private async resolveProtocolNames(efGwpRecords: any[]): Promise<void> {
    try {
      const protocolIds = new Set<string>()
      efGwpRecords.forEach(record => {
        if (record.protocol) {
          if (Array.isArray(record.protocol)) {
            record.protocol.forEach((id: string) => {
              if (id && typeof id === 'string') protocolIds.add(id)
            })
          } else if (typeof record.protocol === 'string') {
            protocolIds.add(record.protocol)
          }
        }
      })

      if (protocolIds.size === 0) return

      const protocolMap = new Map<string, string>()
      const protocolTableName = 'Protocol'
      
      try {
        const idsArray = Array.from(protocolIds)
        for (let i = 0; i < idsArray.length; i += 50) {
          const batch = idsArray.slice(i, i + 50)
          const formula = `OR(${batch.map(id => `RECORD_ID() = '${id.replace(/'/g, "''")}'`).join(', ')})`
          
          const records = await this.base(protocolTableName)
            .select({
              filterByFormula: formula,
              fields: ['Name'],
            })
            .all()

          records.forEach(record => {
            const name = record.fields['Name'] || record.id
            protocolMap.set(record.id, name)
          })
        }
      } catch (err) {
        console.error('Error fetching Protocol names:', err)
      }

      efGwpRecords.forEach(record => {
        if (record.protocol) {
          if (Array.isArray(record.protocol)) {
            record.protocolName = record.protocol
              .map((id: string) => protocolMap.get(id) || id)
              .filter(Boolean)
          } else if (typeof record.protocol === 'string') {
            record.protocolName = protocolMap.get(record.protocol) || record.protocol
          }
        }
      })
    } catch (error) {
      console.error('Error resolving Protocol names:', error)
    }
  }

  /**
   * Resolve EF/Detailed G names from IDs
   */
  private async resolveEFDetailedGNames(efGwpRecords: any[]): Promise<void> {
    try {
      const efDetailedGIds = new Set<string>()
      efGwpRecords.forEach(record => {
        if (record.efDetailedG) {
          if (Array.isArray(record.efDetailedG)) {
            record.efDetailedG.forEach((id: string) => {
              if (id && typeof id === 'string') efDetailedGIds.add(id)
            })
          } else if (typeof record.efDetailedG === 'string') {
            efDetailedGIds.add(record.efDetailedG)
          }
        }
      })

      if (efDetailedGIds.size === 0) return

      const efDetailedGMap = new Map<string, string>()
      const efDetailedGTableName = 'EF/Detailed G'
      
      try {
        const idsArray = Array.from(efDetailedGIds)
        for (let i = 0; i < idsArray.length; i += 50) {
          const batch = idsArray.slice(i, i + 50)
          const formula = `OR(${batch.map(id => `RECORD_ID() = '${id.replace(/'/g, "''")}'`).join(', ')})`
          
          const records = await this.base(efDetailedGTableName)
            .select({
              filterByFormula: formula,
              fields: ['Name'],
            })
            .all()

          records.forEach(record => {
            const name = record.fields['Name'] || record.id
            efDetailedGMap.set(record.id, name)
          })
        }
      } catch (err) {
        console.error('Error fetching EF/Detailed G names:', err)
      }

      efGwpRecords.forEach(record => {
        if (record.efDetailedG) {
          if (Array.isArray(record.efDetailedG)) {
            record.efDetailedGName = record.efDetailedG
              .map((id: string) => efDetailedGMap.get(id) || id)
              .filter(Boolean)
          } else if (typeof record.efDetailedG === 'string') {
            record.efDetailedGName = efDetailedGMap.get(record.efDetailedG) || record.efDetailedG
          }
        }
      })
    } catch (error) {
      console.error('Error resolving EF/Detailed G names:', error)
    }
  }
}

// Lazy singleton instance
let efGwpAirtableServiceInstance: EFGWPAirtableService | null = null

export const getEFGWPAirtableService = (): EFGWPAirtableService => {
  if (!efGwpAirtableServiceInstance) {
    efGwpAirtableServiceInstance = new EFGWPAirtableService()
  }
  return efGwpAirtableServiceInstance
}

// Export alias for backward compatibility (deprecated)
export const getEmissionFactorAirtableService = getEFGWPAirtableService
export const EmissionFactorAirtableService = EFGWPAirtableService

