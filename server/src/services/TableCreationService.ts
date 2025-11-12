/**
 * Table Creation Service
 * 
 * Handles the actual table creation workflow:
 * 1. Fetch schema from Airtable
 * 2. Generate backend service
 * 3. Generate frontend API client
 * 4. Generate route handler
 * 5. Generate ListDetailTemplate config
 * 6. Update navigation
 */

import * as fs from 'fs'
import * as path from 'path'
import { TableCreationJobService } from './TableCreationJobService'

export interface TableCreationOptions {
  baseId: string
  tableId: string
  tableName: string
  targetSection?: string
}

export class TableCreationService {
  private apiKey: string

  constructor(private jobService: TableCreationJobService) {
    this.apiKey = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || 
                  process.env.AIRTABLE_API_KEY || ''
    
    if (!this.apiKey) {
      throw new Error('AIRTABLE_PERSONAL_ACCESS_TOKEN or AIRTABLE_API_KEY is required')
    }
  }

  /**
   * Create a table from Airtable
   */
  async createTable(jobId: string, options: TableCreationOptions): Promise<void> {
    try {
      console.log(`📋 [TableCreation] Starting table creation for: ${options.tableName}`)
      console.log(`   Base ID: ${options.baseId}`)
      console.log(`   Table ID: ${options.tableId}`)
      
      // Step 1: Fetch table schema
      this.jobService.updateJob(jobId, {
        status: 'in-progress',
        progress: 10,
        currentStep: 'Fetching table schema from Airtable...',
      })

      console.log(`📋 [TableCreation] Step 1: Fetching schema...`)
      const schema = await this.fetchTableSchema(options.baseId, options.tableId)
      console.log(`✅ [TableCreation] Schema fetched: ${schema.fields?.length || 0} fields`)
      
      // Step 2: Generate backend service
      this.jobService.updateJob(jobId, {
        progress: 30,
        currentStep: 'Generating backend service...',
      })

      console.log(`📋 [TableCreation] Step 2: Generating backend service...`)
      await this.generateBackendService(options, schema)
      console.log(`✅ [TableCreation] Backend service generated`)

      // Step 3: Generate frontend API client
      this.jobService.updateJob(jobId, {
        progress: 50,
        currentStep: 'Generating frontend API client...',
      })

      console.log(`📋 [TableCreation] Step 3: Generating frontend API client...`)
      await this.generateFrontendApiClient(options, schema)
      console.log(`✅ [TableCreation] Frontend API client generated`)

      // Step 4: Generate route handler
      this.jobService.updateJob(jobId, {
        progress: 70,
        currentStep: 'Generating route handler...',
      })

      console.log(`📋 [TableCreation] Step 4: Generating route handler...`)
      await this.generateRouteHandler(options)
      console.log(`✅ [TableCreation] Route handler generated`)

      // Step 5: Generate ListDetailTemplate config
      this.jobService.updateJob(jobId, {
        progress: 85,
        currentStep: 'Generating frontend template config...',
      })

      console.log(`📋 [TableCreation] Step 5: Generating template config...`)
      await this.generateTemplateConfig(options, schema)
      console.log(`✅ [TableCreation] Template config generated`)

      // Step 6: Register route in index.ts
      this.jobService.updateJob(jobId, {
        progress: 95,
        currentStep: 'Registering route in server...',
      })

      console.log(`📋 [TableCreation] Step 6: Registering route...`)
      await this.registerRoute(options)
      console.log(`✅ [TableCreation] Route registered`)

      // Step 7: Verify files were created
      const serviceFileName = `${this.toPascalCase(options.tableName)}AirtableService.ts`
      const apiFileName = `${this.toCamelCase(options.tableName)}.ts`
      const routeFileName = `${this.toCamelCase(options.tableName)}Routes.ts`
      const configFileName = `${this.toCamelCase(options.tableName)}Config.tsx`
      
      const projectRoot = path.resolve(__dirname, '../..')
      const servicePath = path.join(__dirname, serviceFileName)
      const apiPath = path.join(projectRoot, 'src', 'lib', 'api', apiFileName)
      // Route path: from server/src/services to server/src/routes
      const routePath = path.resolve(__dirname, '..', 'routes', routeFileName)
      const configPath = path.join(projectRoot, 'src', 'components', 'templates', 'configs', configFileName)
      
      const filesCreated = {
        service: fs.existsSync(servicePath),
        api: fs.existsSync(apiPath),
        route: fs.existsSync(routePath),
        config: fs.existsSync(configPath),
      }
      
      console.log(`✅ [TableCreation] Table creation completed!`)
      console.log(`   Table: ${options.tableName}`)
      console.log(`   Files verification:`)
      console.log(`   - Backend service: ${filesCreated.service ? '✅' : '❌'} ${serviceFileName}`)
      console.log(`   - Frontend API: ${filesCreated.api ? '✅' : '❌'} ${apiFileName}`)
      console.log(`   - Route handler: ${filesCreated.route ? '✅' : '❌'} ${routeFileName}`)
      console.log(`   - Template config: ${filesCreated.config ? '✅' : '❌'} ${configFileName}`)
      
      const tablePath = this.generateTablePath(options)
      const allFilesCreated = filesCreated.service && filesCreated.api && filesCreated.route && filesCreated.config
      
      this.jobService.updateJob(jobId, {
        progress: 100,
        status: 'completed',
        currentStep: allFilesCreated 
          ? 'Table created successfully! All files verified. Server restart required to use the new table.'
          : 'Table creation completed with warnings. Some files may be missing. Please check server logs.',
        result: {
          tableName: options.tableName,
          tablePath,
          filesCreated,
        },
      })
    } catch (error: any) {
      console.error(`❌ [TableCreation] Error creating table:`, error)
      console.error(`   Error message: ${error.message}`)
      console.error(`   Stack: ${error.stack}`)
      this.jobService.updateJob(jobId, {
        status: 'failed',
        error: error.message || 'Failed to create table',
      })
      throw error
    }
  }

  /**
   * Fetch table schema from Airtable
   * Note: Airtable Metadata API doesn't support fetching a single table by ID,
   * so we fetch all tables and find the matching one
   */
  private async fetchTableSchema(baseId: string, tableId: string): Promise<any> {
    const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Airtable API access denied. Check your API token permissions.')
      }
      throw new Error(`Failed to fetch tables: ${response.statusText}`)
    }

    const data = await response.json() as { tables?: Array<{ id: string; name: string; fields?: any[] }> }
    const tables = data.tables || []
    
    // Find table by ID
    const table = tables.find(t => t.id === tableId)
    
    if (!table) {
      throw new Error(`Table with ID ${tableId} not found in base ${baseId}`)
    }

    return table
  }

  /**
   * Generate backend service file
   */
  private async generateBackendService(options: TableCreationOptions, schema: any): Promise<void> {
    const serviceName = this.toPascalCase(options.tableName) + 'AirtableService'
    const fileName = `${serviceName}.ts`
    const filePath = path.join(__dirname, fileName)

    console.log(`   📝 Generating: ${fileName}`)
    console.log(`   📁 Path: ${filePath}`)

    // Check if file already exists
    if (fs.existsSync(filePath)) {
      console.log(`   ⚠️  File already exists, overwriting: ${fileName}`)
    }

    // Generate service code (simplified template)
    const serviceCode = this.generateServiceTemplate(options, schema, serviceName)

    fs.writeFileSync(filePath, serviceCode, 'utf-8')
    console.log(`   ✅ File ${fs.existsSync(filePath) ? 'updated' : 'created'}: ${filePath}`)
  }

  /**
   * Generate frontend API client
   */
  private async generateFrontendApiClient(options: TableCreationOptions, schema: any): Promise<void> {
    const fileName = `${this.toCamelCase(options.tableName)}.ts`
    // Resolve path relative to project root (server directory's parent)
    const projectRoot = path.resolve(__dirname, '../..')
    const filePath = path.join(projectRoot, 'src', 'lib', 'api', fileName)

    console.log(`   📝 Generating: ${fileName}`)
    console.log(`   📁 Path: ${filePath}`)

    // Ensure directory exists
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.log(`   📁 Created directory: ${dir}`)
    }

    // Check if file already exists
    const fileExists = fs.existsSync(filePath)
    if (fileExists) {
      console.log(`   ⚠️  File already exists, overwriting: ${fileName}`)
    }

    const clientCode = this.generateApiClientTemplate(options, schema)
    fs.writeFileSync(filePath, clientCode, 'utf-8')
    console.log(`   ✅ File ${fileExists ? 'updated' : 'created'}: ${filePath}`)
  }

  /**
   * Generate route handler
   */
  private async generateRouteHandler(options: TableCreationOptions): Promise<void> {
    const fileName = `${this.toCamelCase(options.tableName)}Routes.ts`
    // Resolve path: from server/src/services to server/src/routes
    const filePath = path.resolve(__dirname, '..', 'routes', fileName)

    console.log(`   📝 Generating: ${fileName}`)
    console.log(`   📁 Path: ${filePath}`)

    const fileExists = fs.existsSync(filePath)
    if (fileExists) {
      console.log(`   ⚠️  File already exists, overwriting: ${fileName}`)
    }

    const routeCode = this.generateRouteTemplate(options)
    fs.writeFileSync(filePath, routeCode, 'utf-8')
    console.log(`   ✅ File ${fileExists ? 'updated' : 'created'}: ${filePath}`)
  }

  /**
   * Generate ListDetailTemplate config
   */
  private async generateTemplateConfig(options: TableCreationOptions, schema: any): Promise<void> {
    const fileName = `${this.toCamelCase(options.tableName)}Config.tsx`
    // Resolve path relative to project root (server directory's parent)
    const projectRoot = path.resolve(__dirname, '../..')
    const filePath = path.join(projectRoot, 'src', 'components', 'templates', 'configs', fileName)

    console.log(`   📝 Generating: ${fileName}`)
    console.log(`   📁 Path: ${filePath}`)

    // Ensure directory exists
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.log(`   📁 Created directory: ${dir}`)
    }

    const fileExists = fs.existsSync(filePath)
    if (fileExists) {
      console.log(`   ⚠️  File already exists, overwriting: ${fileName}`)
    }

    const configCode = this.generateTemplateConfigCode(options, schema)
    fs.writeFileSync(filePath, configCode, 'utf-8')
    console.log(`   ✅ File ${fileExists ? 'updated' : 'created'}: ${filePath}`)
  }

  /**
   * Generate table path for navigation
   */
  private generateTablePath(options: TableCreationOptions): string {
    const sectionPath = options.targetSection 
      ? this.toKebabCase(options.targetSection)
      : 'system-config'
    const tablePath = this.toKebabCase(options.tableName)
    return `/spaces/${sectionPath}/${tablePath}`
  }

  /**
   * Helper: Convert to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
  }

  /**
   * Helper: Convert to camelCase
   */
  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str)
    return pascal.charAt(0).toLowerCase() + pascal.slice(1)
  }

  /**
   * Helper: Convert to kebab-case
   */
  private toKebabCase(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase()
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  /**
   * Generate backend service template
   */
  private generateServiceTemplate(options: TableCreationOptions, schema: any, serviceName: string): string {
    const className = serviceName
    const entityName = this.toPascalCase(options.tableName)
    const tableNameVar = this.toCamelCase(options.tableName) + 'TableName'

    return `import Airtable from 'airtable'
import { RelationshipResolver } from './RelationshipResolver'

/**
 * ${entityName} Airtable Service
 * 
 * Auto-generated service for ${options.tableName} table
 */
export class ${className} {
  private base: Airtable.Base
  private tableName: string
  private relationshipResolver: RelationshipResolver

  constructor() {
    const apiKey = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || 
                   process.env.AIRTABLE_API_KEY
    
    if (!apiKey) {
      throw new Error('Airtable API token is required')
    }
    
    const baseId = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 
                   'appGtLbKhmNkkTLVL'
    
    this.tableName = '${options.tableName}'
    
    Airtable.configure({ apiKey })
    this.base = Airtable.base(baseId)
    this.relationshipResolver = new RelationshipResolver(baseId, apiKey)
  }

  // TODO: Implement getAll, getById, create, update, delete methods
  // This is a template - customize based on your needs
}
`
  }

  /**
   * Generate frontend API client template
   */
  private generateApiClientTemplate(options: TableCreationOptions, schema: any): string {
    const entityName = this.toPascalCase(options.tableName)
    const clientName = entityName + 'ApiClient'
    const apiPath = this.toKebabCase(options.tableName)

    return `/**
 * API Client for ${entityName}
 * Auto-generated client for ${options.tableName} table
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface ${entityName} {
  id: string
  // TODO: Add fields based on schema
}

export interface Create${entityName}Dto {
  // TODO: Add fields
}

export interface Update${entityName}Dto {
  // TODO: Add fields
}

class ${clientName} {
  private baseUrl: string

  constructor() {
    this.baseUrl = \`\${API_BASE_URL}/${apiPath}\`
  }

  // TODO: Implement API methods
}

export const ${this.toCamelCase(options.tableName)}Api = new ${clientName}()
`
  }

  /**
   * Generate route handler template
   */
  private generateRouteTemplate(options: TableCreationOptions): string {
    const serviceName = this.toPascalCase(options.tableName) + 'AirtableService'
    const routePath = this.toKebabCase(options.tableName)

    return `import { Router, Request, Response } from 'express'
import { ${serviceName} } from '../services/${serviceName}'

const router = Router()
let serviceInstance: ${serviceName} | null = null

function getService(): ${serviceName} | null {
  if (!serviceInstance) {
    try {
      serviceInstance = new ${serviceName}()
    } catch (error) {
      console.warn('${serviceName} not available:', error)
      return null
    }
  }
  return serviceInstance
}

// TODO: Add routes (GET, POST, PUT, DELETE)

export default router
`
  }

  /**
   * Register route in index.ts
   */
  private async registerRoute(options: TableCreationOptions): Promise<void> {
    const routeFileName = `${this.toCamelCase(options.tableName)}Routes.ts`
    const routeImportName = this.toCamelCase(options.tableName) + 'Routes'
    const apiPath = this.toKebabCase(options.tableName)
    const indexFilePath = path.join(__dirname, '../index.ts')

    console.log(`   📝 Updating: server/src/index.ts`)
    console.log(`   📁 Path: ${indexFilePath}`)

    if (!fs.existsSync(indexFilePath)) {
      throw new Error('index.ts not found')
    }

    let indexContent = fs.readFileSync(indexFilePath, 'utf-8')

    // Check if route is already imported
    const importPattern = new RegExp(`import\\s+${routeImportName}\\s+from`, 'i')
    if (!importPattern.test(indexContent)) {
      console.log(`   📝 Adding import for ${routeImportName}...`)
      // Add import before developerRoutes
      const importLine = `import ${routeImportName} from './routes/${routeFileName.replace('.ts', '')}'\n`
      const developerImportIndex = indexContent.indexOf("import developerRoutes from './routes/developerRoutes'")
      if (developerImportIndex > -1) {
        indexContent = indexContent.slice(0, developerImportIndex) + importLine + indexContent.slice(developerImportIndex)
      } else {
        // Fallback: add at end of imports
        const lastImportIndex = indexContent.lastIndexOf("import")
        const nextLineIndex = indexContent.indexOf('\n', lastImportIndex)
        indexContent = indexContent.slice(0, nextLineIndex + 1) + importLine + indexContent.slice(nextLineIndex + 1)
      }
    } else {
      console.log(`   ℹ️  Import for ${routeImportName} already exists`)
    }

    // Check if route is already registered
    const routePattern = new RegExp(`app\\.use\\(['"]/api/${apiPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'i')
    if (!routePattern.test(indexContent)) {
      console.log(`   📝 Adding route registration for /api/${apiPath}...`)
      // Add route registration before developerRoutes
      const routeLine = `app.use('/api/${apiPath}', ${routeImportName})\n`
      const developerRouteIndex = indexContent.indexOf("app.use('/api/developer', developerRoutes)")
      if (developerRouteIndex > -1) {
        indexContent = indexContent.slice(0, developerRouteIndex) + routeLine + indexContent.slice(developerRouteIndex)
      } else {
        // Fallback: add before 404 handler
        const notFoundIndex = indexContent.indexOf('// 404 handler')
        if (notFoundIndex > -1) {
          indexContent = indexContent.slice(0, notFoundIndex) + routeLine + indexContent.slice(notFoundIndex)
        }
      }
    } else {
      console.log(`   ℹ️  Route /api/${apiPath} already registered`)
    }

    fs.writeFileSync(indexFilePath, indexContent, 'utf-8')
    console.log(`   ✅ Route registered in index.ts`)
  }

  /**
   * Generate template config code
   */
  private generateTemplateConfigCode(options: TableCreationOptions, schema: any): string {
    const configName = this.toCamelCase(options.tableName) + 'Config'

    return `/**
 * ListDetailTemplate Configuration for ${options.tableName}
 * Auto-generated config
 */

import { ListDetailConfig } from '../ListDetailTemplate'

export const ${configName}: ListDetailConfig = {
  // TODO: Configure columns, filters, fields, panel
  // This is a template - customize based on your needs
}
`
  }
}

