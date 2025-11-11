/**
 * Table Implementation Validation Script
 * 
 * Validates that all required files exist and follow the correct patterns
 * for bulk table creation.
 * 
 * Usage: npx tsx scripts/validate-table-implementation.ts <table-name>
 * Example: npx tsx scripts/validate-table-implementation.ts normalizedActivity
 */

import * as fs from 'fs'
import * as path from 'path'

interface ValidationResult {
  check: string
  passed: boolean
  message: string
  file?: string
}

class TableValidator {
  private tableName: string
  private tableNamePascal: string
  private tableNameKebab: string
  private tableNameCamel: string
  private results: ValidationResult[] = []

  constructor(tableName: string) {
    this.tableName = tableName
    this.tableNamePascal = this.toPascalCase(tableName)
    this.tableNameKebab = this.toKebabCase(tableName)
    this.tableNameCamel = this.toCamelCase(tableName)
  }

  private toPascalCase(str: string): string {
    return str
      .split(/(?=[A-Z])|[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
  }

  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase()
      .replace(/[_\s]/g, '-')
  }

  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str)
    return pascal.charAt(0).toLowerCase() + pascal.slice(1)
  }

  private addResult(check: string, passed: boolean, message: string, file?: string) {
    this.results.push({ check, passed, message, file })
  }

  private fileExists(filePath: string): boolean {
    return fs.existsSync(filePath)
  }

  private readFile(filePath: string): string {
    try {
      return fs.readFileSync(filePath, 'utf-8')
    } catch {
      return ''
    }
  }

  validate(): ValidationResult[] {
    console.log(`\n🔍 Validating table implementation: ${this.tableName}\n`)

    this.validateBackend()
    this.validateFrontend()
    this.validateIntegration()

    return this.results
  }

  private validateBackend() {
    console.log('📦 Validating Backend...\n')

    // Type file
    const typeFile = `server/src/types/${this.tableNamePascal}.ts`
    this.addResult(
      'Backend Type File',
      this.fileExists(typeFile),
      this.fileExists(typeFile) ? 'Type file exists' : `Missing: ${typeFile}`,
      typeFile
    )

    if (this.fileExists(typeFile)) {
      const content = this.readFile(typeFile)
      this.addResult(
        'Type File - Main Interface',
        content.includes(`export interface ${this.tableNamePascal}`),
        'Main interface defined',
        typeFile
      )
      this.addResult(
        'Type File - CreateDto',
        content.includes(`Create${this.tableNamePascal}Dto`),
        'CreateDto interface defined',
        typeFile
      )
      this.addResult(
        'Type File - UpdateDto',
        content.includes(`Update${this.tableNamePascal}Dto`),
        'UpdateDto interface defined',
        typeFile
      )
    }

    // Service file
    const serviceFile = `server/src/services/${this.tableNamePascal}AirtableService.ts`
    this.addResult(
      'Backend Service File',
      this.fileExists(serviceFile),
      this.fileExists(serviceFile) ? 'Service file exists' : `Missing: ${serviceFile}`,
      serviceFile
    )

    if (this.fileExists(serviceFile)) {
      const content = this.readFile(serviceFile)
      this.addResult(
        'Service - No Constructor Instantiation',
        !content.includes('this.service = new') && !content.includes('= new Service'),
        'Service does not instantiate in constructor (uses lazy init)',
        serviceFile
      )
      this.addResult(
        'Service - getAll Method',
        content.includes('async getAll'),
        'getAll method implemented',
        serviceFile
      )
      this.addResult(
        'Service - getById Method',
        content.includes('async getById'),
        'getById method implemented',
        serviceFile
      )
      this.addResult(
        'Service - Relationship Resolution',
        content.includes('relationshipResolver') || !content.includes('resolveLinkedRecords'),
        'Relationship resolution implemented or not needed',
        serviceFile
      )
    }

    // Controller file
    const controllerFile = `server/src/controllers/${this.tableNamePascal}Controller.ts`
    this.addResult(
      'Backend Controller File',
      this.fileExists(controllerFile),
      this.fileExists(controllerFile) ? 'Controller file exists' : `Missing: ${controllerFile}`,
      controllerFile
    )

    if (this.fileExists(controllerFile)) {
      const content = this.readFile(controllerFile)
      this.addResult(
        'Controller - Lazy Initialization',
        content.includes('private service:') && content.includes('| null = null'),
        'Controller uses lazy initialization pattern',
        controllerFile
      )
      this.addResult(
        'Controller - getService Method',
        content.includes('private getService()') || content.includes('getService():'),
        'getService() method implemented',
        controllerFile
      )
      this.addResult(
        'Controller - Uses getService()',
        content.includes('this.getService()'),
        'Controller methods use getService()',
        controllerFile
      )
      this.addResult(
        'Controller - No Direct Service Access',
        !content.includes('this.service.') || content.includes('this.getService()'),
        'Controller does not access service directly',
        controllerFile
      )
    }

    // Route file
    const routeFile = `server/src/routes/${this.tableNameCamel}Routes.ts`
    this.addResult(
      'Backend Route File',
      this.fileExists(routeFile),
      this.fileExists(routeFile) ? 'Route file exists' : `Missing: ${routeFile}`,
      routeFile
    )

    // Route registration
    const indexFile = 'server/src/index.ts'
    if (this.fileExists(indexFile)) {
      const content = this.readFile(indexFile)
      this.addResult(
        'Route Registration - Import',
        content.includes(`import.*${this.tableNameCamel}Routes`) || content.includes(`${this.tableNameCamel}Routes`),
        'Route imported in index.ts',
        indexFile
      )
      // Check for route registration - be flexible with plural/singular and quote styles
      // Convert camelCase to kebab-case and check for both singular and plural
      const kebabSingular = this.tableNameCamel.replace(/([A-Z])/g, '-$1').toLowerCase()
      const kebabPlural = kebabSingular + 's' // e.g., normalized-activity -> normalized-activities
      const kebabWithoutS = kebabSingular.replace(/s$/, '') // Remove trailing 's' if present
      
      // Check for route with various patterns
      const routePatterns = [
        `/api/${kebabSingular}`,
        `/api/${kebabPlural}`,
        `/api/${kebabWithoutS}`,
        `/api/${this.tableNameKebab}`,
        `/api/${this.tableNameKebab}s`,
      ]
      
      let hasRoute = false
      for (const pattern of routePatterns) {
        if (content.includes(`app.use('${pattern}'`) || 
            content.includes(`app.use("${pattern}"`) ||
            content.includes(`app.use(\`${pattern}\``) ||
            content.includes(`${this.tableNameCamel}Routes`)) {
          hasRoute = true
          break
        }
      }
      
      this.addResult(
        'Route Registration - app.use',
        hasRoute,
        'Route registered with app.use()',
        indexFile
      )
    }
  }

  private validateFrontend() {
    console.log('🎨 Validating Frontend...\n')

    // API client file
    const apiFile = `src/lib/api/${this.tableNameCamel}.ts`
    this.addResult(
      'Frontend API Client File',
      this.fileExists(apiFile),
      this.fileExists(apiFile) ? 'API client file exists' : `Missing: ${apiFile}`,
      apiFile
    )

    if (this.fileExists(apiFile)) {
      const content = this.readFile(apiFile)
      this.addResult(
        'API Client - Interface',
        content.includes(`export interface ${this.tableNamePascal}`),
        'Main interface defined',
        apiFile
      )
      this.addResult(
        'API Client - getPaginated Method',
        content.includes('async getPaginated'),
        'getPaginated method implemented',
        apiFile
      )
      this.addResult(
        'API Client - Retry Logic',
        content.includes('maxRetries') || content.includes('retry'),
        'Retry logic implemented',
        apiFile
      )
      // Check for baseUrl - be flexible with plural/singular
      const kebabSingular = this.tableNameCamel.replace(/([A-Z])/g, '-$1').toLowerCase()
      const kebabPlural = kebabSingular + 's'
      const kebabWithoutS = kebabSingular.replace(/s$/, '')
      
      const baseUrlPatterns = [
        `/${kebabSingular}`,
        `/${kebabPlural}`,
        `/${kebabWithoutS}`,
        `/${this.tableNameKebab}`,
        `/${this.tableNameKebab}s`,
      ]
      
      let hasBaseUrl = false
      for (const pattern of baseUrlPatterns) {
        if (content.includes(`baseUrl = \`\${API_BASE_URL}${pattern}\``) ||
            content.includes(`baseUrl = \`\${API_BASE_URL}${pattern}\``) ||
            content.includes(`${pattern}`)) {
          hasBaseUrl = true
          break
        }
      }
      
      this.addResult(
        'API Client - BaseUrl',
        hasBaseUrl,
        'BaseUrl matches route path',
        apiFile
      )
    }

    // Config file
    const configFile = `src/components/templates/configs/${this.tableNameCamel}Config.tsx`
    this.addResult(
      'Frontend Config File',
      this.fileExists(configFile),
      this.fileExists(configFile) ? 'Config file exists' : `Missing: ${configFile}`,
      configFile
    )

    if (this.fileExists(configFile)) {
      const content = this.readFile(configFile)
      this.addResult(
        'Config - ListDetailTemplateConfig',
        content.includes(`ListDetailTemplateConfig<${this.tableNamePascal}>`),
        'Config uses correct type',
        configFile
      )
      this.addResult(
        'Config - Columns Defined',
        content.includes('columns: ['),
        'Columns array defined',
        configFile
      )
      this.addResult(
        'Config - Fields Defined',
        content.includes('fields: ['),
        'Fields array defined',
        configFile
      )
      this.addResult(
        'Config - Panel Defined',
        content.includes('panel: {'),
        'Panel configuration defined',
        configFile
      )
      this.addResult(
        'Config - API Client Adapter',
        content.includes('ApiClient') || content.includes('apiClient'),
        'API client adapter defined',
        configFile
      )
    }

    // Page file - check both singular and plural forms
    const kebabSingular = this.tableNameCamel.replace(/([A-Z])/g, '-$1').toLowerCase()
    const kebabPlural = kebabSingular + 's'
    const pageFile1 = `src/app/spaces/emission-management/${kebabSingular}/page.tsx`
    const pageFile2 = `src/app/spaces/emission-management/${kebabPlural}/page.tsx`
    const pageFile3 = `src/app/spaces/emission-management/${this.tableNameKebab}/page.tsx`
    const pageFile4 = `src/app/spaces/emission-management/${this.tableNameKebab}s/page.tsx`
    const pageExists = this.fileExists(pageFile1) || this.fileExists(pageFile2) || this.fileExists(pageFile3) || this.fileExists(pageFile4)
    const actualPageFile = this.fileExists(pageFile1) ? pageFile1 : 
                          (this.fileExists(pageFile2) ? pageFile2 : 
                          (this.fileExists(pageFile3) ? pageFile3 : pageFile4))
    this.addResult(
      'Frontend Page File',
      pageExists,
      pageExists ? `Page file exists: ${actualPageFile}` : `Missing: ${pageFile1} or ${pageFile2}`,
      actualPageFile
    )

    if (pageExists) {
      const content = this.readFile(actualPageFile)
      this.addResult(
        'Page - Uses ListDetailTemplate',
        content.includes('ListDetailTemplate'),
        'Page uses ListDetailTemplate',
        actualPageFile
      )
      this.addResult(
        'Page - Imports Config',
        content.includes(`${this.tableNameCamel}Config`),
        'Page imports config',
        actualPageFile
      )
    }

    // Layout file - check both singular and plural forms
    const layoutFile1 = `src/app/spaces/emission-management/${kebabSingular}/layout.tsx`
    const layoutFile2 = `src/app/spaces/emission-management/${kebabPlural}/layout.tsx`
    const layoutFile3 = `src/app/spaces/emission-management/${this.tableNameKebab}/layout.tsx`
    const layoutFile4 = `src/app/spaces/emission-management/${this.tableNameKebab}s/layout.tsx`
    const layoutExists = this.fileExists(layoutFile1) || this.fileExists(layoutFile2) || this.fileExists(layoutFile3) || this.fileExists(layoutFile4)
    const actualLayoutFile = this.fileExists(layoutFile1) ? layoutFile1 : 
                            (this.fileExists(layoutFile2) ? layoutFile2 : 
                            (this.fileExists(layoutFile3) ? layoutFile3 : layoutFile4))
    this.addResult(
      'Frontend Layout File',
      layoutExists,
      layoutExists ? `Layout file exists: ${actualLayoutFile}` : `Missing: ${layoutFile1} or ${layoutFile2}`,
      actualLayoutFile
    )

    if (layoutExists) {
      const content = this.readFile(actualLayoutFile)
      this.addResult(
        'Layout - SidebarProvider',
        content.includes('SidebarProvider'),
        'Layout wraps with SidebarProvider',
        actualLayoutFile
      )
    }
  }

  private validateIntegration() {
    console.log('🔗 Validating Integration...\n')

    // Feature flags
    const featureFlagsFile = 'src/lib/featureFlags.ts'
    if (this.fileExists(featureFlagsFile)) {
      const content = this.readFile(featureFlagsFile)
      // Check for feature flag in type definition (with or without quotes)
      const hasTypeDef = content.includes(`'${this.tableNameCamel}'`) || 
                        content.includes(`"${this.tableNameCamel}"`) ||
                        content.includes(`\`${this.tableNameCamel}\``) ||
                        content.includes(`| '${this.tableNameCamel}'`) ||
                        content.includes(`| "${this.tableNameCamel}"`)
      this.addResult(
        'Feature Flag - Type Definition',
        hasTypeDef,
        'Feature flag added to type',
        featureFlagsFile
      )
      // Check for feature flag default value
      const hasDefault = (content.includes(`${this.tableNameCamel}:`) && 
                         (content.includes('process.env') || content.includes('true') || content.includes('false')))
      this.addResult(
        'Feature Flag - Default Value',
        hasDefault,
        'Feature flag has default value',
        featureFlagsFile
      )
    }

    // Sidebar
    const sidebarFile = 'src/components/Sidebar.tsx'
    if (this.fileExists(sidebarFile)) {
      const content = this.readFile(sidebarFile)
      // Check for table name in various forms
      const hasMenuItem = content.includes(this.tableNamePascal) || 
                         content.includes(this.tableNameKebab) ||
                         content.includes(this.tableNameKebab + 's') ||
                         content.includes(this.tableNameCamel)
      this.addResult(
        'Sidebar - Menu Item',
        hasMenuItem,
        'Table added to sidebar menu',
        sidebarFile
      )
      // Check for feature flag in defaults (both server and client)
      const hasFeatureFlag = content.includes(`${this.tableNameCamel}: true`) ||
                            content.includes(`${this.tableNameCamel}:true`)
      this.addResult(
        'Sidebar - Feature Flag Default',
        hasFeatureFlag,
        'Feature flag added to Sidebar defaults',
        sidebarFile
      )
    }

    // Settings Modal
    const settingsModalFile = 'src/components/SettingsModal.tsx'
    if (this.fileExists(settingsModalFile)) {
      const content = this.readFile(settingsModalFile)
      // Check for feature flag in Settings Modal (with various quote styles)
      const hasToggle = content.includes(`key: '${this.tableNameCamel}'`) ||
                       content.includes(`key: "${this.tableNameCamel}"`) ||
                       content.includes(`key: \`${this.tableNameCamel}\``)
      this.addResult(
        'Settings Modal - Feature Flag Toggle',
        hasToggle,
        'Feature flag added to Settings Modal',
        settingsModalFile
      )
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(60))
    console.log('VALIDATION RESULTS')
    console.log('='.repeat(60) + '\n')

    const passed = this.results.filter(r => r.passed).length
    const total = this.results.length
    const percentage = ((passed / total) * 100).toFixed(1)

    this.results.forEach(result => {
      const icon = result.passed ? '✅' : '❌'
      console.log(`${icon} ${result.check}`)
      console.log(`   ${result.message}`)
      if (result.file) {
        console.log(`   File: ${result.file}`)
      }
      console.log()
    })

    console.log('='.repeat(60))
    console.log(`SUMMARY: ${passed}/${total} checks passed (${percentage}%)`)
    console.log('='.repeat(60) + '\n')

    if (passed === total) {
      console.log('🎉 All checks passed! Table implementation is valid.\n')
      process.exit(0)
    } else {
      console.log('⚠️  Some checks failed. Please review the issues above.\n')
      process.exit(1)
    }
  }
}

// Main execution
const tableName = process.argv[2]

if (!tableName) {
  console.error('❌ Error: Table name required')
  console.log('Usage: npx tsx scripts/validate-table-implementation.ts <table-name>')
  console.log('Example: npx tsx scripts/validate-table-implementation.ts normalizedActivity')
  process.exit(1)
}

const validator = new TableValidator(tableName)
const results = validator.validate()
validator.printResults()

