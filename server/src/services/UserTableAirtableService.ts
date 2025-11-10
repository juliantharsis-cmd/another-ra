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
    
    // Log table identifiers for debugging
    console.log(`📋 Linked record table identifiers:`)
    console.log(`   User Roles: ${this.userRolesTableId}`)
    console.log(`   Modules (Application List): ${this.modulesTableId}`)
    console.log(`   Organization Scope: REMOVED (table doesn't exist)`)
    
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
    console.log(`\n🔍 [mapAirtableToUserTable] Starting mapping for record ${record.id}`)
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
    // Primary field name: "Attachment" (matches Airtable field name)
    const attachmentFieldNames = [
      'Attachment', 'attachment', 'Attachments', 'attachments', // Primary - matches Airtable
      'Profile Picture', 'profile picture', 'ProfilePicture', 'profilePicture',
      'Photo', 'photo', 'Picture', 'picture',
      'Image', 'image', 'Images', 'images',
      'Avatar', 'avatar', 'Profile Photo', 'profile photo'
    ]
    
    // Copy all non-system fields from Airtable
    // First, log all fields to help debug attachment field mapping
    console.log(`📋 All Airtable fields for record ${record.id}:`, Object.keys(fields))
    
    Object.keys(fields).forEach(fieldName => {
      if (!systemFields.some(sf => fieldName.toLowerCase() === sf.toLowerCase())) {
        const value = fields[fieldName]
        
        // Check if this is an attachment field
        const isAttachmentField = attachmentFieldNames.some(attName => 
          fieldName.toLowerCase() === attName.toLowerCase()
        )
        
        // Log attachment field detection
        if (isAttachmentField || (Array.isArray(value) && value.length > 0 && value[0] && typeof value[0] === 'object' && (value[0].url || value[0].id))) {
          console.log(`📎 Detected potential attachment field: "${fieldName}"`, {
            isAttachmentField,
            valueType: typeof value,
            isArray: Array.isArray(value),
            arrayLength: Array.isArray(value) ? value.length : 0,
            firstItem: Array.isArray(value) && value.length > 0 ? value[0] : null
          })
        }
        
        // Handle "Profile Name" field FIRST - must be text only, map directly to Airtable "Profile Name" field
        if (fieldName === 'Profile Name' || fieldName === 'profile name' || fieldName === 'profileName') {
          console.log(`📝 Mapping "Profile Name" field from Airtable:`, {
            fieldName,
            valueType: typeof value,
            isArray: Array.isArray(value),
            value: value
          })
          // CRITICAL: Profile Name must be a text string, never an attachment filename
          // Map directly to Airtable "Profile Name" field (text field)
          if (Array.isArray(value)) {
            // This is wrong - Profile Name should not be an array/attachment
            console.warn(`⚠️ Profile Name field contains array/attachment data - ignoring. Field should be text only.`)
            result['Profile Name'] = '' // Map to exact Airtable field name
          } else if (value && typeof value === 'object' && (value.filename || value.url || value.name)) {
            // Value is an attachment object - this is wrong for Profile Name
            console.warn(`⚠️ Profile Name field contains attachment object (filename: ${value.filename || value.name}) - ignoring. Field should be text only.`)
            result['Profile Name'] = '' // Map to exact Airtable field name
          } else if (typeof value === 'string' && (value.endsWith('.png') || value.endsWith('.jpg') || value.endsWith('.jpeg') || value.endsWith('.gif') || value.endsWith('.pdf'))) {
            // Value looks like a filename - this might be incorrectly mapped attachment data
            console.warn(`⚠️ Profile Name field contains what looks like a filename (${value}) - this might be incorrectly mapped attachment data. Setting to empty.`)
            result['Profile Name'] = '' // Map to exact Airtable field name
          } else {
            // Normal text field - convert to string and map to exact Airtable field name
            result['Profile Name'] = value != null ? String(value) : ''
          }
        }
        // Handle attachment fields - preserve full attachment objects, map to exact Airtable field name
        // CRITICAL: Map "Attachment" field to Airtable "Attachment" field
        // Also detect attachment arrays even if field name doesn't match our list
        else if (isAttachmentField || (Array.isArray(value) && value.length > 0 && value[0] && typeof value[0] === 'object' && (value[0].url || value[0].id || value[0].filename))) {
          // Airtable attachment fields are arrays of attachment objects
          // Each object has: id, url, filename, size, type, thumbnails
          // Map to exact Airtable field name (preserve original field name from Airtable)
          // If field name is "Attachment" or "Attachments", map to "Attachment"
          const attachmentFieldName = (fieldName === 'Attachment' || fieldName === 'attachment' || fieldName === 'Attachments' || fieldName === 'attachments') 
            ? 'Attachment' 
            : fieldName
          
          console.log(`📎 Processing attachment field "${fieldName}" -> "${attachmentFieldName}"`, {
            valueLength: Array.isArray(value) ? value.length : 0,
            firstAttachment: Array.isArray(value) && value.length > 0 ? value[0] : null
          })
          
          if (Array.isArray(value) && value.length > 0) {
            result[attachmentFieldName] = value.map((att: any) => {
              // Preserve full attachment object if it exists
              if (att && typeof att === 'object') {
                const attachmentObj = {
                  id: att.id,
                  url: att.url,
                  filename: att.filename || att.name || 'attachment',
                  size: att.size,
                  type: att.type,
                  thumbnails: att.thumbnails
                }
                console.log(`  ✅ Mapped attachment:`, attachmentObj)
                return attachmentObj
              }
              return att
            })
            console.log(`  ✅ Final Attachment field value:`, result[attachmentFieldName])
          } else {
            result[attachmentFieldName] = value || []
            console.log(`  ⚠️ Attachment field is empty or invalid`)
          }
        }
        // Handle linked records - extract IDs
        // CRITICAL: Only treat as linked record if it has id but NOT url/filename (attachment objects have both)
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
    
    // Log final result to verify Attachment field is present
    if (result['Attachment'] || result['attachment']) {
      console.log(`✅ Final mapped record ${record.id} has Attachment field:`, {
        attachmentField: result['Attachment'] || result['attachment'],
        allKeys: Object.keys(result)
      })
    } else {
      console.log(`⚠️ Final mapped record ${record.id} does NOT have Attachment field. Available fields:`, Object.keys(result))
    }
    
    return result
  }

  /**
   * Resolve linked record names for User Table relationships
   * Resolves: Company, User Roles, Modules (Application List)
   * Note: Organization Scope removed - table doesn't exist
   */
  private async resolveLinkedRecordNames(userTableRecords: any[]): Promise<void> {
    console.log(`\n🔍 [resolveLinkedRecordNames] Starting resolution for ${userTableRecords.length} record(s)`)
    
    if (!this.relationshipResolver || userTableRecords.length === 0) {
      console.log(`⚠️ [resolveLinkedRecordNames] Skipping - no resolver or empty records`)
      return
    }

    try {
      // Collect all unique IDs for each relationship type
      const companyIds = new Set<string>()
      const userRoleIds = new Set<string>()
      const moduleIds = new Set<string>()
      // Organization Scope removed - table doesn't exist

      userTableRecords.forEach(record => {
        console.log(`  📋 Processing record ${record.id}:`, {
          Company: record.Company,
          'User Roles': record['User Roles'],
          Modules: record.Modules
          // Organization Scope removed - table doesn't exist
        })
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
        // Organization Scope removed - table doesn't exist
        // Collect Modules IDs (maps to "Application List" table)
        if (record.Modules) {
          const ids = Array.isArray(record.Modules) ? record.Modules : [record.Modules]
          ids.forEach((id: string) => id && moduleIds.add(id))
        }
      })

      // Resolve all relationships in parallel
      // Use direct access for all tables (bypasses permission issues with RelationshipResolver)
      // Organization Scope removed - table doesn't exist
      const [companyNames, userRoleNames, moduleNames] = await Promise.all([
        companyIds.size > 0 ? this.resolveCompanyNamesDirectly(Array.from(companyIds)) : Promise.resolve([]),
        userRoleIds.size > 0 ? this.resolveLinkedRecordsDirectly(Array.from(userRoleIds), this.userRolesTableId || 'User Roles', 'Name') : Promise.resolve([]),
        moduleIds.size > 0 ? this.resolveLinkedRecordsDirectly(Array.from(moduleIds), this.modulesTableId || 'Application List', 'Name') : Promise.resolve([]),
      ])
      
      // Debug logging
      console.log(`\n📊 [resolveLinkedRecordNames] Collected IDs:`, {
        companyIds: companyIds.size,
        userRoleIds: userRoleIds.size,
        moduleIds: moduleIds.size
        // Organization Scope removed
      })
      
      if (companyIds.size > 0) {
        console.log(`✅ Resolved ${companyNames.length} company names from ${companyIds.size} company IDs`)
        if (companyNames.length > 0) {
          console.log(`   Company names:`, companyNames.map(r => `${r.id} -> ${r.name}`).join(', '))
        }
        if (companyNames.length === 0) {
          console.warn('⚠️  No company names resolved! Check Companies table access and field names.')
        }
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
      console.log(`🔍 [resolveLinkedRecordsDirectly] Resolving ${recordIds.length} ${tableType} IDs using table: "${tableIdOrName}"`)
      
      // First, try a simple test query to verify table access (helps diagnose issues)
      try {
        await this.base(tableIdOrName)
          .select({
            maxRecords: 1,
            fields: [displayField],
          })
          .firstPage()
        console.log(`✅ [resolveLinkedRecordsDirectly] Table "${tableIdOrName}" is accessible`)
      } catch (testError: any) {
        // If test query fails, provide detailed diagnostics
        if (testError.error === 'NOT_FOUND' || testError.statusCode === 404) {
          console.error(`❌ Table "${tableIdOrName}" not found. Possible issues:`)
          console.error(`   - Table name might be incorrect (check spelling, case, spaces)`)
          console.error(`   - Table might be in a different base`)
          console.error(`   - Table might not exist yet`)
        } else if (testError.error === 'NOT_AUTHORIZED' || testError.statusCode === 403) {
          console.error(`❌ No permission to access table "${tableIdOrName}"`)
          console.error(`   - Check API token permissions in Airtable`)
          console.error(`   - Verify the table exists and is accessible`)
        }
        throw testError // Re-throw to be handled by outer catch
      }
      
      // Fetch records by ID using the table ID or name (same approach as AirtableService)
      const records = await this.base(tableIdOrName)
        .select({
          filterByFormula: `OR(${recordIds.map(id => `RECORD_ID() = "${id}"`).join(', ')})`,
          fields: [displayField], // Only fetch the display field
          maxRecords: 100, // Limit to prevent large queries
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

      console.log(`✅ [resolveLinkedRecordsDirectly] Resolved ${resolved.length} ${tableType} names:`, 
        resolved.map(r => `${r.id} -> ${r.name}`).join(', '))

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
    
    console.log(`📝 Mapped fields for Airtable:`, Object.keys(fields).join(', '))
    console.log(`   Linked record fields:`, linkedRecordFields.filter(f => fields[f] !== undefined).map(f => `${f}=${JSON.stringify(fields[f])}`).join(', '))
    
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
      console.log(`📥 Fetching paginated user table: offset=${offset}, limit=${limit}`)
      
      const startRecordIndex = offset
      const endRecordIndex = offset + limit
      const startPage = Math.floor(startRecordIndex / 100) + 1
      const endPage = Math.ceil(endRecordIndex / 100)
      
      let allRecords: Airtable.Record<any>[] = []
      let currentPage = 0
      
      // Only use sort if sortBy is provided - don't assume any field exists
      const sortField = sortBy && sortBy.trim() !== '' ? this.mapFieldNameToAirtable(sortBy) : null
      const sortDirection = sortOrder === 'desc' ? 'desc' : 'asc'
      
      if (sortField) {
        console.log(`   Sorting by: ${sortBy} -> ${sortField} (${sortDirection})`)
      } else {
        console.log(`   No sort field specified - using Airtable default order`)
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
      
      if (filterFormula) {
        console.log(`   Applying filter formula: ${filterFormula}`)
      }
      
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
      console.log(`\n🔍 [findById] Fetching record ${id} from table "${this.tableName}"`)
      const record = await this.base(this.tableName).find(id)
      console.log(`✅ [findById] Record fetched, calling mapAirtableToUserTable`)
      const mapped = this.mapAirtableToUserTable(record)
      console.log(`📋 [findById] Mapped record has Company:`, mapped.Company)
      console.log(`📋 [findById] Mapped record has CompanyName (before resolution):`, mapped.CompanyName)
      // Resolve linked record names
      console.log(`🔄 [findById] Calling resolveLinkedRecordNames...`)
      await this.resolveLinkedRecordNames([mapped])
      console.log(`✅ [findById] After resolution - CompanyName:`, mapped.CompanyName)
      console.log(`📋 [findById] Final record keys:`, Object.keys(mapped))
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
      console.log(`📝 Creating user table in Airtable`)
      const airtableFields = this.mapUserTableToAirtable(fields)
      console.log(`   Mapped Airtable fields:`, JSON.stringify(airtableFields, null, 2))
      
      const record = await this.base(this.tableName).create(airtableFields)
      console.log(`✅ Successfully created user table in Airtable: ${record.id}`)
      
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
      console.log(`📝 Updating user table in Airtable: ${id}`)
      const airtableFields = this.mapUserTableToAirtable(fields)
      
      const record = await this.base(this.tableName).update(id, airtableFields)
      console.log(`✅ Successfully updated user table: ${id}`)
      
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

