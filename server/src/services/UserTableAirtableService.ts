import Airtable from 'airtable'
import * as fs from 'fs'
import * as path from 'path'
import { RelationshipResolver } from './RelationshipResolver'

/**
 * user table Airtable Service
 * 
 * Handles all Airtable API interactions for user table table.
 * This service can be replaced with a PostgreSQL service later
 * without changing the repository interface.
 */
export class UserTableAirtableService {
  private base: Airtable.Base
  private tableName: string
  private readonly cacheFilePath: string
  private totalCountCache: { count: number; timestamp: number } | null = null
  private readonly COUNT_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private distinctValuesCache: Map<string, { values: string[]; timestamp: number }> = new Map()
  private readonly DISTINCT_VALUES_CACHE_TTL = 10 * 60 * 1000 // 10 minutes
  private countCalculationPromise: Promise<number> | null = null
  private relationshipResolver: RelationshipResolver | null = null
  private companyTableId: string // Store Companies table ID for direct access (supports table ID or name)
  private userRolesTableId: string | null = null // Store User Roles table ID if available (supports table ID or name)
  private modulesTableId: string | null = null // Store Modules table ID if available (maps to "Application List" table, supports table ID or name)
  private authorizationErrorsLogged: Set<string> = new Set() // Track which tables have logged auth errors

  constructor() {
    const apiKey = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || 
                   process.env.AIRTABLE_API_KEY
    
    if (!apiKey) {
      throw new Error('Airtable API token is required. Set AIRTABLE_PERSONAL_ACCESS_TOKEN in .env file')
    }
    
    const baseId = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 
                   'appGtLbKhmNkkTLVL'
    
    // Use table ID if provided, otherwise use table name
    this.tableName = process.env.AIRTABLE_USER_TABLE_TABLE_ID || 
                     process.env.AIRTABLE_USER_TABLE_TABLE_NAME || 
                     'user table' // Default table name in Airtable
    
    console.log(`🌿 UserTableAirtableService initialized:`)
    console.log(`   Base ID: ${baseId}`)
    console.log(`   Table: ${this.tableName}`)
    console.log(`   API Key: ${apiKey ? apiKey.substring(0, 20) + '...' : 'NOT SET'}`)
    
    Airtable.configure({ apiKey })
    this.base = Airtable.base(baseId)
    
    // Initialize relationship resolver
    this.relationshipResolver = new RelationshipResolver(baseId, apiKey)
    
    // Get Companies table ID (use same logic as AirtableService)
    this.companyTableId = process.env.AIRTABLE_COMPANY_TABLE_ID || 
                          process.env.AIRTABLE_COMPANY_TABLE_NAME || 
                          'tbl82H6ezrakMSkV1' // Use table ID by default for better reliability
    
    // Get other table IDs if available (fallback to table names)
    // Support table IDs for future flexibility (table IDs start with 'tbl')
    this.userRolesTableId = process.env.AIRTABLE_USER_ROLES_TABLE_ID || 
                            process.env.AIRTABLE_USER_ROLES_TABLE_NAME || 
                            'User Roles'
    // Modules table is actually "Application List" in Airtable
    this.modulesTableId = process.env.AIRTABLE_MODULES_TABLE_ID || 
                          process.env.AIRTABLE_MODULES_TABLE_NAME || 
                          'Application List' // Use "Application List" as the actual table name
    // Organization Scope table doesn't exist - removed from resolution
    
    
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
          console.log(`📊 Loaded user table total count from disk cache: ${cacheData.count}`)
        }
      }
    } catch (error) {
      console.warn('⚠️  Could not load user table count cache from disk:', error)
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
      console.warn('⚠️  Could not save user table count cache to disk:', error)
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
      console.warn('⚠️  Could not delete user table count cache file:', error)
    }
  }

  /**
   * Clear distinct values cache
   */
  private clearDistinctValuesCache(): void {
    this.distinctValuesCache.clear()
  }

  /**
   * Map Airtable record to UserTable interface
   * Dynamically captures ALL fields from Airtable
   */
  mapAirtableToUserTable(record: Airtable.Record<any>): any {
    const fields = record.fields
    
    // Start with all fields from Airtable (dynamic mapping)
    const result: any = {
      id: record.id,
    }
    
    // Map all fields dynamically - preserve original Airtable field names
    // Exclude system fields that we handle separately
    const systemFields = [
      'Created Time', 'Created time', 'created_time', 'createdTime',
      'Last Modified Time', 'Last modified time', 'last_modified_time', 'lastModifiedTime',
      'Created By', 'Created by', 'created_by', 'createdBy',
      'Last Modified By', 'Last modified by', 'last_modified_by', 'lastModifiedBy'
    ]
    
    // Known attachment field names (case-insensitive matching)
    const attachmentFieldNames = [
      'Attachment', 'attachment', 'Attachments', 'attachments',
      'Profile Picture', 'profile picture', 'ProfilePicture', 'profilePicture',
      'Photo', 'photo', 'Picture', 'picture',
      'Image', 'image', 'Images', 'images',
      'Avatar', 'avatar', 'Profile Photo', 'profile photo'
    ]
    
    Object.keys(fields).forEach(fieldName => {
      if (!systemFields.some(sf => fieldName.toLowerCase() === sf.toLowerCase())) {
        const value = fields[fieldName]
        const isAttachmentField = attachmentFieldNames.some(attName => 
          fieldName.toLowerCase() === attName.toLowerCase()
        )
        
        // Handle "Profile Name" field - must be text only
        if (fieldName === 'Profile Name' || fieldName === 'profile name' || fieldName === 'profileName') {
          if (Array.isArray(value) || (value && typeof value === 'object' && (value.filename || value.url || value.name))) {
            // Invalid data - treat as empty
            result['Profile Name'] = ''
          } else if (typeof value === 'string' && (value.endsWith('.png') || value.endsWith('.jpg') || value.endsWith('.jpeg') || value.endsWith('.gif') || value.endsWith('.pdf'))) {
            // Looks like filename - treat as empty
            result['Profile Name'] = ''
          } else {
            result['Profile Name'] = value != null ? String(value) : ''
          }
        }
        // Handle attachment fields
        else if (isAttachmentField || (Array.isArray(value) && value.length > 0 && value[0] && typeof value[0] === 'object' && (value[0].url || value[0].id || value[0].filename))) {
          const attachmentFieldName = (fieldName === 'Attachment' || fieldName === 'attachment' || fieldName === 'Attachments' || fieldName === 'attachments') 
            ? 'Attachment' 
            : fieldName
          
          if (Array.isArray(value) && value.length > 0) {
            result[attachmentFieldName] = value.map((att: any) => {
              if (att && typeof att === 'object') {
                return {
                  id: att.id,
                  url: att.url,
                  filename: att.filename || att.name || 'attachment',
                  size: att.size,
                  type: att.type,
                  thumbnails: att.thumbnails
                }
              }
              return att
            })
          } else {
            result[attachmentFieldName] = value || []
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
   * Resolve linked record names for User Table relationships
   * Resolves: Company, User Roles, Modules (Application List)
   * Note: Organization Scope removed - table doesn't exist
   */
  private async resolveLinkedRecordNames(userTableRecords: any[]): Promise<void> {
    if (!this.relationshipResolver || userTableRecords.length === 0) {
      return
    }

    try {
      // Collect all unique IDs for each relationship type
      const companyIds = new Set<string>()
      const userRoleIds = new Set<string>()
      const moduleIds = new Set<string>()

      userTableRecords.forEach(record => {
        // Collect Company IDs
        if (record.Company) {
          const ids = Array.isArray(record.Company) ? record.Company : [record.Company]
          ids.forEach((id: string) => id && companyIds.add(id))
        }
        // Collect User Roles IDs
        if (record['User Roles']) {
          const ids = Array.isArray(record['User Roles']) ? record['User Roles'] : [record['User Roles']]
          ids.forEach((id: string) => id && userRoleIds.add(id))
        }
        // Collect Modules IDs (maps to "Application List" table)
        if (record.Modules) {
          const ids = Array.isArray(record.Modules) ? record.Modules : [record.Modules]
          ids.forEach((id: string) => id && moduleIds.add(id))
        }
      })

      // Resolve all relationships in parallel
      const [companyNames, userRoleNames, moduleNames] = await Promise.all([
        companyIds.size > 0 ? this.resolveCompanyNamesDirectly(Array.from(companyIds)) : Promise.resolve([]),
        userRoleIds.size > 0 ? this.resolveLinkedRecordsDirectly(Array.from(userRoleIds), this.userRolesTableId || 'User Roles', 'Name') : Promise.resolve([]),
        moduleIds.size > 0 ? this.resolveLinkedRecordsDirectly(Array.from(moduleIds), this.modulesTableId || 'Application List', 'Name') : Promise.resolve([]),
      ])
      
      if (companyIds.size > 0 && companyNames.length === 0) {
        console.warn('⚠️  No company names resolved! Check Companies table access and field names.')
      }

      // Create lookup maps
      const companyMap = new Map(companyNames.map(r => [r.id, r.name]))
      const userRoleMap = new Map(userRoleNames.map(r => [r.id, r.name]))
      const moduleMap = new Map(moduleNames.map(r => [r.id, r.name]))
      // Organization Scope removed

      // Update records with resolved names
      userTableRecords.forEach(record => {
        // Resolve Company names
        if (record.Company) {
          if (Array.isArray(record.Company)) {
            const resolvedNames = record.Company.map((id: string) => {
              // Validate that id is actually an ID (starts with 'rec')
              if (typeof id !== 'string' || !id.startsWith('rec')) {
                return '' // Skip invalid IDs
              }
              const name = companyMap.get(id)
              // Only use name if found and it's not an ID, otherwise return empty string
              if (name && !name.startsWith('rec')) {
                return name
              }
              return ''
            }).filter(Boolean) // Filter out empty strings
            record.CompanyName = resolvedNames.length > 0 ? resolvedNames : undefined
          } else {
            // Validate that record.Company is actually an ID
            if (typeof record.Company === 'string' && record.Company.startsWith('rec')) {
              const name = companyMap.get(record.Company)
              // Only set if name found and it's not an ID
              if (name && !name.startsWith('rec')) {
                record.CompanyName = name
              } else {
                record.CompanyName = undefined // Don't set to ID
              }
            } else {
              record.CompanyName = undefined
            }
          }
        } else {
          // Ensure CompanyName is undefined if no Company
          record.CompanyName = undefined
        }
        // Resolve User Roles names
        if (record['User Roles']) {
          if (Array.isArray(record['User Roles'])) {
            const resolvedNames = record['User Roles'].map((id: string) => {
              // Validate that id is actually an ID (starts with 'rec')
              if (typeof id !== 'string' || !id.startsWith('rec')) {
                return '' // Skip invalid IDs
              }
              const name = userRoleMap.get(id)
              // Only use name if found and it's not an ID, otherwise return empty string
              if (name && !name.startsWith('rec')) {
                return name
              }
              return ''
            }).filter(Boolean) // Filter out empty strings
            record['User Roles Name'] = resolvedNames.length > 0 ? resolvedNames : undefined
          } else {
            // Validate that record['User Roles'] is actually an ID
            if (typeof record['User Roles'] === 'string' && record['User Roles'].startsWith('rec')) {
              const name = userRoleMap.get(record['User Roles'])
              // Only set if name found and it's not an ID
              if (name && !name.startsWith('rec')) {
                record['User Roles Name'] = name
              } else {
                record['User Roles Name'] = undefined // Don't set to ID
              }
            } else {
              record['User Roles Name'] = undefined
            }
          }
        } else {
          record['User Roles Name'] = undefined
        }
        // Organization Scope removed - table doesn't exist
        // Resolve Modules names (maps to "Application List" table)
        if (record.Modules) {
          if (Array.isArray(record.Modules)) {
            const resolvedNames = record.Modules.map((id: string) => {
              // Validate that id is actually an ID (starts with 'rec')
              if (typeof id !== 'string' || !id.startsWith('rec')) {
                return '' // Skip invalid IDs
              }
              const name = moduleMap.get(id)
              // Only use name if found and it's not an ID, otherwise return empty string
              if (name && !name.startsWith('rec')) {
                return name
              }
              return ''
            }).filter(Boolean) // Filter out empty strings
            record.ModulesName = resolvedNames.length > 0 ? resolvedNames : undefined
          } else {
            // Validate that record.Modules is actually an ID
            if (typeof record.Modules === 'string' && record.Modules.startsWith('rec')) {
              const name = moduleMap.get(record.Modules)
              // Only set if name found and it's not an ID
              if (name && !name.startsWith('rec')) {
                record.ModulesName = name
              } else {
                record.ModulesName = undefined // Don't set to ID
              }
            } else {
              record.ModulesName = undefined
            }
          }
        } else {
          record.ModulesName = undefined
        }
      })
    } catch (error) {
      console.error('Error resolving linked record names for User Table:', error)
      // Don't throw - continue without resolved names
    }
  }

  /**
   * Resolve company names directly using the Companies table ID
   * This bypasses permission issues with table name access
   */
  private async resolveCompanyNamesDirectly(companyIds: string[]): Promise<Array<{ id: string; name: string }>> {
    return this.resolveLinkedRecordsDirectly(companyIds, this.companyTableId, 'Company Name')
  }

  /**
   * Generic method to resolve linked record names directly using table ID or name
   * This bypasses permission issues with RelationshipResolver
   */
  private async resolveLinkedRecordsDirectly(
    recordIds: string[],
    tableIdOrName: string,
    displayField: string
  ): Promise<Array<{ id: string; name: string }>> {
    if (recordIds.length === 0) {
      return []
    }

    const tableType = tableIdOrName === this.companyTableId ? 'Companies' :
                     tableIdOrName === this.userRolesTableId ? 'User Roles' :
                     tableIdOrName === this.modulesTableId ? 'Modules (Application List)' :
                     tableIdOrName

    try {
      // Fetch records by ID
      const records = await this.base(tableIdOrName)
        .select({
          filterByFormula: `OR(${recordIds.map(id => `RECORD_ID() = "${id}"`).join(', ')})`,
          fields: [displayField],
          maxRecords: 100,
        })
        .all()

      const resolved = records.map(record => {
        const fieldValue = record.fields[displayField] as string
        const name = fieldValue && fieldValue.trim() !== '' ? fieldValue : record.id
        return {
          id: record.id,
          name,
        }
      })

      return resolved
    } catch (error: any) {
      // Handle authorization errors more gracefully
      const isAuthError = error?.error === 'NOT_AUTHORIZED' || error?.statusCode === 403
      const isNotFoundError = error?.error === 'NOT_FOUND' || error?.statusCode === 404
      
      if (isAuthError) {
        // Log warning only once per table type to reduce noise
        const errorKey = `${tableType}:auth`
        if (!this.authorizationErrorsLogged.has(errorKey)) {
          console.warn(
            `⚠️  No permission to read from "${tableType}" table (using identifier: "${tableIdOrName}"). ` +
            `Linked records will display as IDs. ` +
            `\n   Possible fixes:` +
            `\n   1. Verify the table name/ID is correct in Airtable` +
            `\n   2. Grant read access to "${tableType}" table in Airtable (check API token scopes)` +
            `\n   3. Set AIRTABLE_${tableType.toUpperCase().replace(/\s+/g, '_')}_TABLE_ID in .env if you have the table ID` +
            `\n   4. Check if the table is in the same base (${process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 'appGtLbKhmNkkTLVL'})` +
            `\n   5. If table was recently created, wait a few moments and try again`
          )
          this.authorizationErrorsLogged.add(errorKey)
        }
        
        // Return empty array instead of IDs - this prevents showing record IDs in the UI
        // The frontend will handle empty names gracefully
        return []
      } else if (isNotFoundError) {
        // Table not found - log helpful message
        const errorKey = `${tableType}:notfound`
        if (!this.authorizationErrorsLogged.has(errorKey)) {
          console.error(
            `❌ Table "${tableIdOrName}" not found for ${tableType}. ` +
            `\n   Check:` +
            `\n   1. Table name spelling and case (Airtable is case-sensitive)` +
            `\n   2. Table exists in base ${process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 'appGtLbKhmNkkTLVL'}` +
            `\n   3. Set correct AIRTABLE_${tableType.toUpperCase().replace(/\s+/g, '_')}_TABLE_ID or TABLE_NAME in .env` +
            `\n   4. Common variations to try: "${tableIdOrName.toLowerCase()}", "${tableIdOrName.toUpperCase()}", "${tableIdOrName.replace(/\s+/g, '')}"`
          )
          this.authorizationErrorsLogged.add(errorKey)
        }
        return []
      } else {
        // For other errors, log and return empty array
        console.error(`❌ Error resolving ${tableType} names directly:`, error)
        return []
      }
    }
  }

  /**
   * Map UserTable DTO to Airtable fields
   * Maps all fields dynamically, excluding system/metadata fields
   */
  mapUserTableToAirtable(dto: any): Record<string, any> {
    const fields: Record<string, any> = {}
    
    // System fields to exclude
    const excludeFields = [
      'id', 'createdAt', 'updatedAt', 'createdBy', 'lastModifiedBy',
      'Created Time', 'Last Modified Time', 'Created By', 'Last Modified By',
      // Exclude resolved name fields (these are display-only, not stored in Airtable)
      'CompanyName', 'UserRoleNames', 'ModuleNames'
      // Organization Scope removed
    ]
    
    // Known attachment field names (case-insensitive)
    const attachmentFieldNames = [
      'Profile Picture', 'profile picture', 'ProfilePicture', 'profilePicture',
      'Photo', 'photo', 'Picture', 'picture',
      'Attachment', 'attachment', 'Attachments', 'attachments',
      'Image', 'image', 'Images', 'images',
      'Avatar', 'avatar', 'Profile Photo', 'profile photo'
    ]
    
    // Known linked record fields that should be converted to arrays of record IDs
    const linkedRecordFields = ['Company', 'User Roles', 'Modules']
    // Organization Scope removed - table doesn't exist
    
    // Map all fields from DTO to Airtable (preserve original field names)
    Object.keys(dto).forEach(key => {
      // Skip system fields
      if (excludeFields.includes(key)) {
        return
      }
      
      const value = dto[key]
      const isLinkedRecordField = linkedRecordFields.includes(key)
      const isAttachmentField = attachmentFieldNames.some(attName => 
        key.toLowerCase() === attName.toLowerCase()
      )
      
      // Skip undefined/null values (but allow empty strings for text fields like "Profile Name")
      if (value === undefined || value === null) {
        return
      }
      
      // For non-attachment, non-linked-record text fields, allow empty strings
      // Only skip empty strings for fields that shouldn't be empty
      if (!isAttachmentField && 
          !isLinkedRecordField && 
          typeof value === 'string' && 
          value.trim() === '' && 
          key !== 'Profile Name' && 
          key !== 'profile name' && 
          key !== 'profileName' &&
          key !== 'Activity Scope' &&
          key !== 'activity scope' &&
          key !== 'Notes' &&
          key !== 'notes') {
        return
      }
      
      // Handle attachment fields - preserve attachment objects as-is
      if (isAttachmentField) {
        // Airtable expects attachment fields as arrays of attachment objects
        if (Array.isArray(value)) {
          fields[key] = value
        } else if (value) {
          fields[key] = [value]
        } else {
          fields[key] = []
        }
      }
      // Handle linked records - extract record IDs from "name|id" format
      else if (isLinkedRecordField) {
        if (Array.isArray(value)) {
          if (value.length === 0) {
            // Empty array means clear the linked record field in Airtable
            fields[key] = []
          } else {
            // Extract IDs from array of "name|id" strings or plain IDs
            const extractedIds = value
              .map((item: any) => {
                if (typeof item === 'string' && item.includes('|')) {
                  // Extract ID from "name|id" format
                  const parts = item.split('|')
                  return parts.length > 1 ? parts[parts.length - 1] : item
                }
                // Already an ID or invalid format - return as is
                return String(item).trim()
              })
              .filter((id: string) => id && id.length > 0 && id.startsWith('rec'))
            
            // Only set if we have valid IDs
            if (extractedIds.length > 0) {
              fields[key] = extractedIds
            } else {
              // If no valid IDs found, clear the field
              fields[key] = []
            }
          }
        } else if (typeof value === 'string' && value.includes('|')) {
          // Single value in "name|id" format
          const parts = value.split('|')
          const recordId = parts.length > 1 ? parts[parts.length - 1].trim() : value.trim()
          if (recordId && recordId.startsWith('rec')) {
            fields[key] = [recordId]
          } else {
            // Invalid ID format - clear the field
            fields[key] = []
          }
        } else if (typeof value === 'string' && value.trim().startsWith('rec')) {
          // Single value is already a record ID
          fields[key] = [value.trim()]
        } else if (value === '' || value === null) {
          // Empty string or null means clear the linked record field
          fields[key] = []
        } else if (value) {
          // Try to use as-is (might be a valid ID)
          const stringValue = String(value).trim()
          if (stringValue.startsWith('rec')) {
            fields[key] = [stringValue]
          } else {
            // Invalid format - clear the field
            fields[key] = []
          }
        } else {
          // Undefined or falsy - clear the field
          fields[key] = []
        }
      } else if (Array.isArray(value)) {
        // Non-linked record array - keep as is
        fields[key] = value
      } else {
        // Convert to string for text fields, preserve numbers/booleans
        if (typeof value === 'number' || typeof value === 'boolean') {
          fields[key] = value
        } else {
          fields[key] = String(value).trim()
        }
      }
    })
    
    
    return fields
  }

  /**
   * Map field name to Airtable field name
   */
  private mapFieldNameToAirtable(fieldName: string): string {
    const mapping: Record<string, string> = {
      'Name': 'Name',
      'Short code': 'Short code',
      'short_code': 'Short code',
      'code': 'Short code',
      'Description': 'Description',
      'description': 'Description',
      'Formula': 'Formula',
      'formula': 'Formula',
      'Category': 'Category',
      'category': 'Category',
      'Status': 'Status',
      'status': 'Status',
      'Notes': 'Notes',
      'notes': 'Notes',
    }
    return mapping[fieldName] || fieldName
  }

  /**
   * Get all user table records from Airtable
   */
  async findAll(): Promise<any[]> {
    try {
      console.log(`📥 Fetching ALL user table records from Airtable table: ${this.tableName}`)
      
      const records = await this.base(this.tableName)
        .select({})
        .all()
      
      console.log(`✅ Fetched ${records.length} total records from Airtable`)
      
      const mapped = records.map(record => this.mapAirtableToUserTable(record))
      // Resolve linked record names
      await this.resolveLinkedRecordNames(mapped)
      return mapped
    } catch (error: any) {
      console.error('Error fetching user table from Airtable:', error)
      
      if (error.error === 'NOT_AUTHORIZED' || error.statusCode === 403) {
        throw new Error(`Airtable authentication failed (403). Check your API token permissions.`)
      }
      if (error.error === 'NOT_FOUND' || error.statusCode === 404) {
        throw new Error(`Airtable table not found (404). Check table name "${this.tableName}" and base ID.`)
      }
      
      throw new Error(`Failed to fetch user table from Airtable: ${error.error || error.message || 'Unknown error'}`)
    }
  }

  /**
   * Get paginated user table records from Airtable
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
      const startRecordIndex = offset
      const endRecordIndex = offset + limit
      
      // If we have linked record filters, we need to fetch more records to filter in memory
      // Calculate how many pages we need to fetch
      const hasLinkedRecordFilters = filters && Object.keys(filters).some(key => 
        (key === 'Company' || key === 'User Roles' || key === 'Modules') && filters[key]
      )
      
      // For linked record filters, fetch more records to ensure we have enough after filtering
      const fetchMultiplier = hasLinkedRecordFilters ? 5 : 1 // Fetch 5x more if filtering in memory
      const recordsToFetch = Math.max(limit * fetchMultiplier, 500) // At least 500 records
      const pagesToFetch = Math.ceil(recordsToFetch / 100)
      
      const startPage = 1
      const endPage = pagesToFetch
      
      let allRecords: Airtable.Record<any>[] = []
      let currentPage = 0
      
      // Only use sort if sortBy is provided - don't assume any field exists
      const sortField = sortBy && sortBy.trim() !== '' ? this.mapFieldNameToAirtable(sortBy) : null
      const sortDirection = sortOrder === 'desc' ? 'desc' : 'asc'
      
      // Separate linked record filters from regular filters
      // Linked records will be filtered in memory (more reliable than ARRAYJOIN formula)
      const linkedRecordFilters: Record<string, string[]> = {}
      const regularFilters: Record<string, any> = {}
      
      if (filters) {
        console.log(`🔍 Processing filters:`, JSON.stringify(filters, null, 2))
        // First, validate linked record filter values against available options
        // This prevents fetching records for companies/user roles/modules that have no users
        for (const [key, value] of Object.entries(filters)) {
          if (value && (key === 'Company' || key === 'User Roles' || key === 'Modules')) {
            const values = Array.isArray(value) ? value : [value]
            const validValues = values.filter(v => v && String(v).trim() !== '')
            
            if (validValues.length > 0) {
              // Validate that these filter values are actually used in the user table
              // Use cached values if available for faster validation
              const cacheKey = `linked_${key}_10000`
              let availableFilterValues: string[] = []
              
              // Check cache first
              const cached = this.distinctValuesCache.get(cacheKey)
              if (cached && Date.now() - cached.timestamp < this.DISTINCT_VALUES_CACHE_TTL) {
                availableFilterValues = cached.values as string[]
                console.log(`   Using cached filter values for validation (${availableFilterValues.length} values)`)
              } else {
                // Fetch if not cached (will be cached for future requests)
                availableFilterValues = await this.getLinkedRecordFilterValues(
                  key as 'Company' | 'User Roles' | 'Modules',
                  10000 // Get all available values for validation
                )
              }
              
              // Extract just the IDs from "Name|ID" format
              const availableIds = new Set(
                availableFilterValues.map(v => v.includes('|') ? v.split('|')[1] : v)
              )
              
              // Filter to only include values that are actually available
              const validatedValues = validValues.filter(v => availableIds.has(String(v)))
              
              if (validatedValues.length === 0) {
                // None of the selected values are in the user table - return empty immediately
                console.log(`⚠️  Filter ${key} = ${validValues.join(', ')} has no matching records in user table. Returning empty results.`)
                return {
                  records: [],
                  total: 0,
                }
              }
              
              if (validatedValues.length < validValues.length) {
                console.log(`⚠️  Some filter values for ${key} are not in user table. Using only validated values: ${validatedValues.join(', ')}`)
              }
              
              linkedRecordFilters[key] = validatedValues
              console.log(`🔍 Linked record filter (in-memory): ${key} = ${validatedValues.join(', ')}`)
            }
          } else if (value) {
            // Regular field filter (e.g., Status) - use Airtable formula
            regularFilters[key] = value
          }
        }
      }
      
      // Build Airtable filter formula for regular filters only
      const filterFormulas: string[] = []
      
      if (Object.keys(regularFilters).length > 0) {
        Object.entries(regularFilters).forEach(([key, value]) => {
          const airtableFieldName = this.mapFieldNameToAirtable(key)
          
          // Support both single value and array of values (multi-select)
          const values = Array.isArray(value) ? value : [value]
          const validValues = values.filter(v => v && String(v).trim() !== '')
          
          if (validValues.length > 0) {
            if (validValues.length === 1) {
              // Single value: simple equality
              const escapedValue = String(validValues[0]).replace(/'/g, "''")
              const formula = `{${airtableFieldName}} = '${escapedValue}'`
              filterFormulas.push(formula)
              console.log(`🔍 Filter: ${key} = ${validValues[0]} -> ${formula}`)
            } else {
              // Multiple values: use OR() with multiple equality checks
              const equalityChecks = validValues.map(v => {
                const escapedValue = String(v).replace(/'/g, "''")
                return `{${airtableFieldName}} = '${escapedValue}'`
              })
              const formula = `OR(${equalityChecks.join(', ')})`
              filterFormulas.push(formula)
              console.log(`🔍 Filter: ${key} = ${validValues.join(', ')} -> ${formula}`)
            }
          }
        })
      }
      
      if (search && search.trim() !== '') {
        // Search across common user fields that exist in the "user table"
        const searchFields = [
          'Email', 'First Name', 'Last Name', 'User Name', 'UID', 
          'Profile Name', 'Activity Scope', 'Notes'
        ]
        const escapedSearch = search.replace(/'/g, "''")
        const searchFormulas = searchFields.map(field => 
          `FIND(LOWER('${escapedSearch}'), LOWER({${field}})) > 0`
        )
        if (searchFormulas.length > 0) {
          filterFormulas.push(`OR(${searchFormulas.join(', ')})`)
        }
      }
      
      const filterFormula = filterFormulas.length > 0 ? `AND(${filterFormulas.join(', ')})` : undefined
      
      // Fetch only the pages we need
      await new Promise<void>((resolve, reject) => {
        const selectOptions: any = {
          pageSize: 100,
        }
        
        // Only add sort if we have a valid sort field
        if (sortField) {
          selectOptions.sort = [{ field: sortField, direction: sortDirection }]
        }
        
        if (filterFormula) {
          selectOptions.filterByFormula = filterFormula
          console.log(`📋 Applying filter formula: ${filterFormula}`)
        }
        
        // Add timeout to prevent infinite loading (30 seconds)
        const timeout = setTimeout(() => {
          reject(new Error('Filter query timed out after 30 seconds. The filter may be too complex or the field may not exist in Airtable.'))
        }, 30000)
        
        this.base(this.tableName)
          .select(selectOptions)
          .eachPage(
            (records, fetchNextPage) => {
              currentPage++
              
              // Always collect records (we'll filter in memory if needed)
              allRecords.push(...records)
              
              if (currentPage >= endPage) {
                clearTimeout(timeout)
                resolve()
                return
              }
              
              fetchNextPage()
            },
            (err) => {
              clearTimeout(timeout)
              if (err) {
                console.error(`❌ Error fetching filtered records:`, err)
                // Provide more helpful error messages
                if (err.error === 'INVALID_VALUE_FOR_COLUMN') {
                  reject(new Error(`Invalid filter: The field may not exist or may have a different name in Airtable. Formula: ${filterFormula}`))
                } else if (err.error === 'INVALID_FORMULA') {
                  reject(new Error(`Invalid filter formula: ${filterFormula}`))
                } else {
                  reject(err)
                }
              } else {
                resolve()
              }
            }
          )
      })
      
      // Apply in-memory filtering for linked records
      let filteredRecords = allRecords
      
      if (Object.keys(linkedRecordFilters).length > 0) {
        console.log(`🔍 Applying in-memory filters for linked records:`, JSON.stringify(linkedRecordFilters, null, 2))
        console.log(`   Starting with ${allRecords.length} records`)
        filteredRecords = allRecords.filter(record => {
          // Map record first to get the field values
          const mapped = this.mapAirtableToUserTable(record)
          
          // Check each linked record filter
          for (const [fieldKey, filterValues] of Object.entries(linkedRecordFilters)) {
            const fieldValue = mapped[fieldKey]
            
            if (!fieldValue) {
              return false // Field is empty, doesn't match
            }
            
            // Get record IDs from the field (could be array or single value)
            const recordIds = Array.isArray(fieldValue) ? fieldValue : [fieldValue]
            
            // Check if any of the filter values match any of the record IDs
            const matches = filterValues.some(filterId => 
              recordIds.some(recordId => String(recordId) === String(filterId))
            )
            
            if (!matches) {
              return false // This record doesn't match this filter
            }
          }
          
          return true // Record matches all linked record filters
        })
        
        console.log(`   Filtered from ${allRecords.length} to ${filteredRecords.length} records using in-memory filters`)
      }
      
      const startIndexInFetched = 0 // Start from beginning of filtered records
      const endIndexInFetched = startIndexInFetched + limit
      const paginatedRecords = filteredRecords.slice(startIndexInFetched, endIndexInFetched)
      
      console.log(`✅ Fetched ${paginatedRecords.length} records (from ${filteredRecords.length} filtered, ${allRecords.length} total)`)
      
      // Get total count
      let total: number
      if (filterFormula || Object.keys(linkedRecordFilters).length > 0) {
        // If we have linked record filters, use the filtered count
        if (Object.keys(linkedRecordFilters).length > 0) {
          total = filteredRecords.length
          // If we fetched all records, this is accurate. Otherwise, it's an estimate
          if (filteredRecords.length < allRecords.length) {
            console.log(`   ⚠️  Using estimated count (${total}) - may need to fetch more records for accurate count`)
          }
        } else {
          // Only regular filters - use Airtable count
          total = await this.getFilteredCount(filterFormula!)
          console.log(`   Filtered total count: ${total}`)
        }
      } else {
        total = await this.getTotalCount(true)
      }

      const mapped = paginatedRecords.map(record => this.mapAirtableToUserTable(record))
      // Resolve linked record names
      await this.resolveLinkedRecordNames(mapped)
      
      return {
        records: mapped,
        total,
      }
    } catch (error: any) {
      console.error('❌ Error fetching paginated user table from Airtable:', error)
      
      if (error.error === 'NOT_AUTHORIZED' || error.statusCode === 403) {
        throw new Error(`Airtable authentication failed (403). The table "${this.tableName}" may not exist or the API token may not have access to it.`)
      }
      if (error.error === 'NOT_FOUND' || error.statusCode === 404) {
        throw new Error(`Airtable table not found (404). Table "${this.tableName}" does not exist in base.`)
      }
      
      throw new Error(`Failed to fetch user table: ${error.error || error.message || 'Unknown error'}`)
    }
  }

  /**
   * Get a single user table record by ID
   */
  async findById(id: string): Promise<any | null> {
    try {
      const record = await this.base(this.tableName).find(id)
      const mapped = this.mapAirtableToUserTable(record)
      // Resolve linked record names
      await this.resolveLinkedRecordNames([mapped])
      return mapped
    } catch (error: any) {
      if (error.statusCode === 404 || error.error === 'NOT_FOUND') {
        return null
      }
      throw new Error(`Failed to fetch user table: ${error.error || error.message || 'Unknown error'}`)
    }
  }

  /**
   * Create a new user table record
   */
  async create(fields: Record<string, any>): Promise<any> {
    try {
      const airtableFields = this.mapUserTableToAirtable(fields)
      const record = await this.base(this.tableName).create(airtableFields)
      
      this.clearCountCache()
      this.clearDistinctValuesCache()
      
      const mapped = this.mapAirtableToUserTable(record)
      // Resolve linked record names
      await this.resolveLinkedRecordNames([mapped])
      return mapped
    } catch (error: any) {
      console.error('❌ Error creating user table in Airtable:', error)
      throw new Error(`Failed to create user table: ${error.error || error.message || 'Unknown error'}`)
    }
  }

  /**
   * Update a user table record
   */
  async update(id: string, fields: Record<string, any>): Promise<any> {
    try {
      const airtableFields = this.mapUserTableToAirtable(fields)
      const record = await this.base(this.tableName).update(id, airtableFields)
      
      const mapped = this.mapAirtableToUserTable(record)
      // Resolve linked record names
      await this.resolveLinkedRecordNames([mapped])
      return mapped
    } catch (error: any) {
      console.error(`❌ Error updating user table ${id}:`, error)
      if (error.statusCode === 404 || error.error === 'NOT_FOUND') {
        return null
      }
      throw new Error(`Failed to update user table: ${error.error || error.message || 'Unknown error'}`)
    }
  }

  /**
   * Delete a user table record
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
      throw new Error(`Failed to delete user table: ${error.error || error.message || 'Unknown error'}`)
    }
  }

  /**
   * Get total count with lazy calculation
   */
  async getTotalCount(lazy: boolean = true): Promise<number> {
    try {
      if (this.totalCountCache && Date.now() - this.totalCountCache.timestamp < this.COUNT_CACHE_TTL) {
        console.log(`📊 Using cached total count for user table: ${this.totalCountCache.count}`)
        return this.totalCountCache.count
      }

      if (lazy && !this.totalCountCache) {
        console.log(`📊 No cache available for user table, returning estimate and calculating in background...`)
        const estimate = 100
        this.calculateTotalCountInBackground()
        return estimate
      }

      return await this.calculateTotalCount()
    } catch (error: any) {
      console.error('Error getting user table total count:', error)
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
        return count // Return count to maintain Promise<number> type
      })
      .catch(error => {
        console.error('Error calculating user table total count in background:', error)
        this.countCalculationPromise = null
        throw error // Re-throw to maintain Promise<number> type
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
      console.error('Error calculating user table total count:', error)
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
      console.error('Error getting filtered count for user table:', error)
      return 0
    }
  }

  /**
   * Get unique linked record filter values from user table
   * Returns only companies/user roles/modules that are actually used in the user table
   * Format: "Name|ID" for easy filtering
   */
  async getLinkedRecordFilterValues(fieldName: 'Company' | 'User Roles' | 'Modules', limit: number = 1000): Promise<string[]> {
    try {
      const cacheKey = `linked_${fieldName}_${limit}`
      const cached = this.distinctValuesCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.DISTINCT_VALUES_CACHE_TTL) {
        console.log(`📊 Using cached linked record filter values for ${fieldName}: ${cached.values.length} values`)
        return cached.values as string[]
      }
      
      console.log(`📊 Fetching linked record filter values for ${fieldName} from user table`)
      
      const airtableFieldName = this.mapFieldNameToAirtable(fieldName)
      const uniqueRecordIds = new Set<string>()
      let pageCount = 0
      const maxPagesToScan = 100 // Scan up to 10,000 records
      
      // Step 1: Collect unique record IDs from user table
      await new Promise<void>((resolve, reject) => {
        this.base(this.tableName)
          .select({
            fields: [airtableFieldName],
            pageSize: 100,
            maxRecords: maxPagesToScan * 100,
          })
          .eachPage(
            (records, fetchNextPage) => {
              pageCount++
              
              records.forEach(record => {
                const value = record.fields[airtableFieldName]
                if (value === null || value === undefined) {
                  return
                }
                
                // Linked records are arrays of record IDs
                if (Array.isArray(value)) {
                  value.forEach((id: string) => {
                    if (id && typeof id === 'string' && id.startsWith('rec')) {
                      uniqueRecordIds.add(id)
                    }
                  })
                } else if (typeof value === 'string' && value.startsWith('rec')) {
                  uniqueRecordIds.add(value)
                }
              })
              
              if (pageCount >= maxPagesToScan || uniqueRecordIds.size >= limit) {
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
      
      console.log(`   Found ${uniqueRecordIds.size} unique ${fieldName} record IDs in user table`)
      
      if (uniqueRecordIds.size === 0) {
        return []
      }
      
      // Step 2: Resolve record IDs to names
      let resolvedRecords: Array<{ id: string; name: string }> = []
      
      if (fieldName === 'Company') {
        resolvedRecords = await this.resolveCompanyNamesDirectly(Array.from(uniqueRecordIds))
      } else if (fieldName === 'User Roles') {
        resolvedRecords = await this.resolveLinkedRecordsDirectly(
          Array.from(uniqueRecordIds),
          this.userRolesTableId || 'User Roles',
          'Name'
        )
      } else if (fieldName === 'Modules') {
        resolvedRecords = await this.resolveLinkedRecordsDirectly(
          Array.from(uniqueRecordIds),
          this.modulesTableId || 'Application List',
          'Name'
        )
      }
      
      // Step 3: Format as "Name|ID" for filter options
      const filterValues = resolvedRecords
        .filter(r => r.name && !r.name.startsWith('rec')) // Only include successfully resolved names
        .map(r => `${r.name}|${r.id}`)
        .sort() // Sort alphabetically by name
      
      // Limit results
      const limitedValues = filterValues.slice(0, limit)
      
      console.log(`✅ Found ${limitedValues.length} filterable ${fieldName} values from user table`)
      
      // Cache the results
      this.distinctValuesCache.set(cacheKey, {
        values: limitedValues,
        timestamp: Date.now(),
      })
      
      return limitedValues
    } catch (error: any) {
      console.error(`❌ Error getting linked record filter values for ${fieldName}:`, error)
      return []
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
        console.log(`📊 Using cached distinct values for user table ${fieldName}: ${cached.values.length} values`)
        return cached.values
      }
      
      console.log(`📊 Fetching distinct values for user table field: ${fieldName}`)
      
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
      
      console.log(`✅ Found ${values.length} distinct values for user table ${fieldName}`)
      
      this.distinctValuesCache.set(cacheKey, {
        values,
        timestamp: Date.now(),
      })
      
      return values
    } catch (error: any) {
      console.error(`❌ Error getting distinct values for user table ${fieldName}:`, error)
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
let userTableAirtableServiceInstance: UserTableAirtableService | null = null

export const getUserTableAirtableService = (): UserTableAirtableService => {
  if (!userTableAirtableServiceInstance) {
    userTableAirtableServiceInstance = new UserTableAirtableService()
  }
  return userTableAirtableServiceInstance
}

