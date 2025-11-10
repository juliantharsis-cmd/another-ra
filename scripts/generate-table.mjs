#!/usr/bin/env node

/**
 * Table Generator Script
 * 
 * Generates all necessary files for a new table based on an Airtable table name.
 * 
 * Usage: node scripts/generate-table.mjs "Table Name" [options]
 * 
 * Options:
 *   --route <path>          Custom route path (default: auto-generated from table name)
 *   --menu <parent>         Parent menu item (default: "Emission management")
 *   --feature-flag <name>   Feature flag name (default: auto-generated)
 *   --no-feature-flag      Don't add feature flag
 *   --api-route <path>     Custom API route (default: auto-generated)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Helper functions
function toCamelCase(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase()
    })
    .replace(/\s+/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
}

function toPascalCase(str) {
  const camel = toCamelCase(str)
  return camel.charAt(0).toUpperCase() + camel.slice(1)
}

function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
}

function toSnakeCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
}

// Parse command line arguments
const args = process.argv.slice(2)
const tableName = args[0]

if (!tableName) {
  console.error('❌ Error: Table name is required')
  console.log('\nUsage: node scripts/generate-table.mjs "Table Name" [options]')
  console.log('\nExample: node scripts/generate-table.mjs "GHG Type"')
  process.exit(1)
}

// Parse options
const options = {
  route: null,
  menu: 'Emission management',
  featureFlag: null,
  noFeatureFlag: false,
  apiRoute: null,
}

for (let i = 1; i < args.length; i++) {
  if (args[i] === '--route' && args[i + 1]) {
    options.route = args[i + 1]
    i++
  } else if (args[i] === '--menu' && args[i + 1]) {
    options.menu = args[i + 1]
    i++
  } else if (args[i] === '--feature-flag' && args[i + 1]) {
    options.featureFlag = args[i + 1]
    i++
  } else if (args[i] === '--api-route' && args[i + 1]) {
    options.apiRoute = args[i + 1]
    i++
  } else if (args[i] === '--no-feature-flag') {
    options.noFeatureFlag = true
  }
}

// Generate names
const entityName = tableName
const entityNamePlural = tableName + 's'
const camelCase = toCamelCase(tableName)
const pascalCase = toPascalCase(tableName)
const kebabCase = options.route || toKebabCase(tableName)
const snakeCase = toSnakeCase(tableName)
const apiRoute = options.apiRoute || kebabCase
const featureFlagName = options.featureFlag || camelCase

console.log(`\n🚀 Generating table: ${tableName}`)
console.log(`   Entity: ${pascalCase}`)
console.log(`   Route: /spaces/emission-management/${kebabCase}`)
console.log(`   API Route: /api/${apiRoute}`)
console.log(`   Feature Flag: ${featureFlagName}`)
console.log(`\n`)

// Main generation function (async)
async function generateTable() {
// Read template files
const baseDir = path.join(__dirname, '..')
const templateDir = path.join(baseDir, 'scripts', 'templates')

// Function to replace placeholders in template
function replacePlaceholders(content, replacements) {
  let result = content
  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(key, 'g')
    result = result.replace(regex, value)
  }
  return result
}

// Read GHG Type files as templates
function readTemplate(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8')
  } catch (error) {
    console.warn(`⚠️  Could not read template ${filePath}, using inline template`)
    return null
  }
}

// Generate replacements object
const replacements = {
  'GHGType': pascalCase,
  'GHG Type': entityName,
  'GHG Types': entityNamePlural,
  'ghgType': camelCase,
  'ghg-types': apiRoute,
  'ghgTypes': featureFlagName,
  'GHG_TYPE': snakeCase.toUpperCase(),
  'ghg_type': snakeCase,
}

// Backend files
const backendDir = path.join(baseDir, 'server', 'src')
const frontendDir = path.join(baseDir, 'src')

console.log('📁 Creating backend files...')

// Helper function to fetch Airtable schema
async function fetchAirtableSchema(tableName) {
  try {
    const dotenv = await import('dotenv')
    const { fileURLToPath } = await import('url')
    const { dirname, join } = await import('path')
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    
    dotenv.config({ path: join(__dirname, '..', '.env') })
    
    const API_KEY = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY
    const BASE_ID = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 
                    process.env.AIRTABLE_EMISSION_BASE_ID || 
                    process.env.AIRTABLE_BASE_ID
    
    if (!API_KEY || !BASE_ID) {
      console.warn('⚠️  Could not fetch Airtable schema: API key or base ID not set')
      return null
    }
    
    const metaUrl = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`
    const response = await fetch(metaUrl, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      console.warn('⚠️  Could not fetch Airtable schema:', response.status)
      return null
    }
    
    const data = await response.json()
    const table = data.tables?.find((t) => 
      t.name.toLowerCase() === tableName.toLowerCase()
    )
    
    if (!table) {
      console.warn(`⚠️  Table "${tableName}" not found in Airtable`)
      return null
    }
    
    return table
  } catch (error) {
    console.warn('⚠️  Error fetching Airtable schema:', error.message)
    return null
  }
}

// Fetch actual schema from Airtable
let airtableSchema = null
try {
  airtableSchema = await fetchAirtableSchema(tableName)
  if (airtableSchema) {
    console.log(`   ✅ Fetched schema from Airtable (${airtableSchema.fields?.length || 0} fields)`)
  }
} catch (error) {
  console.warn(`   ⚠️  Could not fetch schema: ${error.message}`)
}

// Generate TypeScript interface from Airtable schema
function generateTypeInterface(schema) {
  if (!schema || !schema.fields) {
    // Fallback to minimal template
    return `export interface ${pascalCase} {
  id: string
  // Add fields based on your Airtable schema
}

export interface Create${pascalCase}Dto {
  // Add fields based on your Airtable schema
}

export interface Update${pascalCase}Dto {
  // Add fields based on your Airtable schema
}
`
  }
  
  const fields = schema.fields
  const interfaceFields = ['  id: string']
  const createFields = []
  const updateFields = []
  
  // System fields that should be optional metadata
  const systemFields = ['Created Time', 'Created time', 'Last Modified Time', 'Last modified time', 
                        'Created By', 'Created by', 'Last Modified By', 'Last modified by']
  
  fields.forEach((field) => {
    const fieldName = field.name
    const isSystemField = systemFields.some(sf => 
      fieldName.toLowerCase() === sf.toLowerCase()
    )
    
    // Skip system fields in main interface (they'll be added as optional metadata)
    if (isSystemField) {
      return
    }
    
    // Map Airtable field types to TypeScript types
    let tsType = 'string'
    if (field.type === 'number' || field.type === 'percent' || field.type === 'currency' || field.type === 'rating') {
      tsType = 'number'
    } else if (field.type === 'checkbox') {
      tsType = 'boolean'
    } else if (field.type === 'date' || field.type === 'dateTime') {
      tsType = 'string' // ISO date string
    } else if (field.type === 'multipleRecordLinks') {
      tsType = 'string | string[]' // Linked record IDs
    } else if (field.type === 'multipleAttachments') {
      tsType = 'any[]' // Attachment objects
    } else if (field.type === 'multipleSelects') {
      tsType = 'string[]'
    }
    
    // Convert field name to camelCase for TypeScript
    const camelFieldName = fieldName.replace(/\s+/g, '').replace(/^./, c => c.toLowerCase())
    
    interfaceFields.push(`  ${camelFieldName}?: ${tsType}`)
    createFields.push(`  ${camelFieldName}?: ${tsType}`)
    updateFields.push(`  ${camelFieldName}?: ${tsType}`)
  })
  
  // Add optional metadata fields (only if they exist in Airtable)
  const hasCreatedTime = fields.some(f => 
    ['Created Time', 'Created time'].includes(f.name)
  )
  const hasUpdatedTime = fields.some(f => 
    ['Last Modified Time', 'Last modified time'].includes(f.name)
  )
  const hasCreatedBy = fields.some(f => 
    ['Created By', 'Created by'].includes(f.name)
  )
  const hasUpdatedBy = fields.some(f => 
    ['Last Modified By', 'Last modified by'].includes(f.name)
  )
  
  if (hasCreatedTime) interfaceFields.push('  createdAt?: string')
  if (hasUpdatedTime) interfaceFields.push('  updatedAt?: string')
  if (hasCreatedBy) interfaceFields.push('  createdBy?: string')
  if (hasUpdatedBy) interfaceFields.push('  lastModifiedBy?: string')
  
  return `export interface ${pascalCase} {
${interfaceFields.join('\\n')}
}

export interface Create${pascalCase}Dto {
${createFields.join('\\n')}
}

export interface Update${pascalCase}Dto {
${updateFields.join('\\n')}
}
`
}

// 1. Types
const typesTemplate = readTemplate(path.join(backendDir, 'types', 'GHGType.ts')) || 
  generateTypeInterface(airtableSchema)

const typesPath = path.join(backendDir, 'types', `${pascalCase}.ts`)
fs.writeFileSync(typesPath, replacePlaceholders(typesTemplate, replacements))
console.log(`   ✅ Created ${path.relative(baseDir, typesPath)}`)

// 2. Service - read from GHG Type and replace
const serviceTemplate = readTemplate(path.join(backendDir, 'services', 'GHGTypeAirtableService.ts'))
if (serviceTemplate) {
  const servicePath = path.join(backendDir, 'services', `${pascalCase}AirtableService.ts`)
  fs.writeFileSync(servicePath, replacePlaceholders(serviceTemplate, replacements))
  console.log(`   ✅ Created ${path.relative(baseDir, servicePath)}`)
}

// 3. Repository
const repoTemplate = readTemplate(path.join(backendDir, 'data', 'GHGTypeRepository.ts'))
if (repoTemplate) {
  const repoPath = path.join(backendDir, 'data', `${pascalCase}Repository.ts`)
  fs.writeFileSync(repoPath, replacePlaceholders(repoTemplate, replacements))
  console.log(`   ✅ Created ${path.relative(baseDir, repoPath)}`)
}

// 4. Controller
const controllerTemplate = readTemplate(path.join(backendDir, 'controllers', 'GHGTypeController.ts'))
if (controllerTemplate) {
  const controllerPath = path.join(backendDir, 'controllers', `${pascalCase}Controller.ts`)
  fs.writeFileSync(controllerPath, replacePlaceholders(controllerTemplate, replacements))
  console.log(`   ✅ Created ${path.relative(baseDir, controllerPath)}`)
}

// 5. Routes
const routesTemplate = readTemplate(path.join(backendDir, 'routes', 'ghgTypeRoutes.ts'))
if (routesTemplate) {
  const routesPath = path.join(backendDir, 'routes', `${camelCase}Routes.ts`)
  fs.writeFileSync(routesPath, replacePlaceholders(routesTemplate, replacements))
  console.log(`   ✅ Created ${path.relative(baseDir, routesPath)}`)
}

// 6. Update server index.ts
const serverIndexPath = path.join(backendDir, 'index.ts')
if (fs.existsSync(serverIndexPath)) {
  let serverIndex = fs.readFileSync(serverIndexPath, 'utf8')
  
  // Add import
  if (!serverIndex.includes(`import ${camelCase}Routes`)) {
    const importLine = `import ${camelCase}Routes from './routes/${camelCase}Routes'`
    // Find the last import before tableConfigurationRoutes
    const lastImportMatch = serverIndex.match(/import .* from '\.\/routes\/.*Routes'/g)
    if (lastImportMatch && lastImportMatch.length > 0) {
      const lastImport = lastImportMatch[lastImportMatch.length - 1]
      const lastImportIndex = serverIndex.lastIndexOf(lastImport)
      const nextLine = serverIndex.indexOf('\n', lastImportIndex)
      serverIndex = serverIndex.slice(0, nextLine) + '\n' + importLine + serverIndex.slice(nextLine)
    }
  }
  
  // Add route
  if (!serverIndex.includes(`app.use('/api/${apiRoute}'`)) {
    const routeLine = `app.use('/api/${apiRoute}', ${camelCase}Routes)`
    // Find the last app.use('/api/...') line
    const lastRouteMatch = serverIndex.match(/app\.use\('\/api\/[^']+', .*Routes\)/g)
    if (lastRouteMatch && lastRouteMatch.length > 0) {
      const lastRoute = lastRouteMatch[lastRouteMatch.length - 1]
      const lastRouteIndex = serverIndex.lastIndexOf(lastRoute)
      const nextLine = serverIndex.indexOf('\n', lastRouteIndex)
      serverIndex = serverIndex.slice(0, nextLine) + '\n' + routeLine + serverIndex.slice(nextLine)
    }
  }
  
  fs.writeFileSync(serverIndexPath, serverIndex)
  console.log(`   ✅ Updated ${path.relative(baseDir, serverIndexPath)}`)
}

console.log('\n📁 Creating frontend files...')

// 7. API Client
const apiTemplate = readTemplate(path.join(frontendDir, 'lib', 'api', 'ghgType.ts'))
if (apiTemplate) {
  const apiPath = path.join(frontendDir, 'lib', 'api', `${camelCase}.ts`)
  let apiContent = replacePlaceholders(apiTemplate, replacements)
  // Update API route in baseUrl
  apiContent = apiContent.replace(
    new RegExp('this\\.baseUrl = `\\$\\{API_BASE_URL\\}/ghg-types`', 'g'),
    `this.baseUrl = \`\${API_BASE_URL}/${apiRoute}\``
  )
  // Update class name
  apiContent = apiContent.replace(
    new RegExp('class GHGTypeApiClient', 'g'),
    `class ${pascalCase}ApiClient`
  )
  // Update export
  apiContent = apiContent.replace(
    new RegExp('export const ghgTypeApi = new GHGTypeApiClient\\(\\)', 'g'),
    `export const ${camelCase}Api = new ${pascalCase}ApiClient()`
  )
  fs.writeFileSync(apiPath, apiContent)
  console.log(`   ✅ Created ${path.relative(baseDir, apiPath)}`)
}

// 8. Config
const configTemplate = readTemplate(path.join(frontendDir, 'components', 'templates', 'configs', 'ghgTypeConfig.tsx'))
if (configTemplate) {
  const configPath = path.join(frontendDir, 'components', 'templates', 'configs', `${camelCase}Config.tsx`)
  let configContent = replacePlaceholders(configTemplate, replacements)
  // Update import path
  configContent = configContent.replace(
    new RegExp("from '@/lib/api/ghgType'", 'g'),
    `from '@/lib/api/${camelCase}'`
  )
  // Update config name
  configContent = configContent.replace(
    new RegExp('export const ghgTypeConfig', 'g'),
    `export const ${camelCase}Config`
  )
  // Update API client usage
  configContent = configContent.replace(
    /ghgTypeApi/g,
    `${camelCase}Api`
  )
  fs.writeFileSync(configPath, configContent)
  console.log(`   ✅ Created ${path.relative(baseDir, configPath)}`)
}

// 9. Page
const pageTemplate = readTemplate(path.join(frontendDir, 'app', 'spaces', 'emission-management', 'ghg-types', 'page.tsx'))
if (pageTemplate) {
  const pageDir = path.join(frontendDir, 'app', 'spaces', 'emission-management', kebabCase)
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true })
  }
  const pagePath = path.join(pageDir, 'page.tsx')
  let pageContent = replacePlaceholders(pageTemplate, replacements)
  // Update import paths
  pageContent = pageContent.replace(
    new RegExp("from '@/components/templates/configs/ghgTypeConfig'", 'g'),
    `from '@/components/templates/configs/${camelCase}Config'`
  )
  pageContent = pageContent.replace(
    new RegExp('ghgTypeConfig', 'g'),
    `${camelCase}Config`
  )
  pageContent = pageContent.replace(
    new RegExp("isFeatureEnabled\\('ghgTypes'", 'g'),
    `isFeatureEnabled('${featureFlagName}'`
  )
  fs.writeFileSync(pagePath, pageContent)
  console.log(`   ✅ Created ${path.relative(baseDir, pagePath)}`)
}

// 10. Layout
const layoutTemplate = readTemplate(path.join(frontendDir, 'app', 'spaces', 'emission-management', 'ghg-types', 'layout.tsx'))
if (layoutTemplate) {
  const layoutPath = path.join(frontendDir, 'app', 'spaces', 'emission-management', kebabCase, 'layout.tsx')
  fs.writeFileSync(layoutPath, replacePlaceholders(layoutTemplate, replacements))
  console.log(`   ✅ Created ${path.relative(baseDir, layoutPath)}`)
}

// 11. Update feature flags
if (!options.noFeatureFlag) {
  const featureFlagsPath = path.join(frontendDir, 'lib', 'featureFlags.ts')
  if (fs.existsSync(featureFlagsPath)) {
    let featureFlags = fs.readFileSync(featureFlagsPath, 'utf8')
    
    // Add to type
    if (!featureFlags.includes(`'${featureFlagName}'`)) {
      featureFlags = featureFlags.replace(
        new RegExp('type FeatureFlag = (.*?)(\\n|$)', ''),
        `type FeatureFlag = $1 | '${featureFlagName}'$2`
      )
    }
    
    // Add to flags object
    if (!featureFlags.includes(`${featureFlagName}:`)) {
      const flagsLine = `  ${featureFlagName}: process.env.NEXT_PUBLIC_FEATURE_${snakeCase.toUpperCase()} === 'true' || process.env.NODE_ENV === 'development',`
      const lastFlag = featureFlags.lastIndexOf('columnResizeV2:')
      const nextLine = featureFlags.indexOf('\n', featureFlags.indexOf('true', lastFlag))
      featureFlags = featureFlags.slice(0, nextLine) + '\n' + flagsLine + featureFlags.slice(nextLine)
    }
    
    fs.writeFileSync(featureFlagsPath, featureFlags)
    console.log(`   ✅ Updated ${path.relative(baseDir, featureFlagsPath)}`)
  }
}

// 12. Update sidebar
const sidebarPath = path.join(frontendDir, 'components', 'Sidebar.tsx')
if (fs.existsSync(sidebarPath)) {
  let sidebar = fs.readFileSync(sidebarPath, 'utf8')
  
  // Check if already has the menu item
  if (!sidebar.includes(`path: '/spaces/emission-management/${kebabCase}'`)) {
    // Add menu item
    const menuItem = `      ...(isFeatureEnabled('${featureFlagName}') ? [{ name: '${entityName}', Icon: ChartIcon, path: '/spaces/emission-management/${kebabCase}' }] : []),`
    
    // Find the menu parent
    const menuParent = options.menu
    const parentIndex = sidebar.indexOf(`name: '${menuParent}'`)
    if (parentIndex !== -1) {
      const childrenStart = sidebar.indexOf('children: [', parentIndex)
      const lastChildIndex = sidebar.lastIndexOf('}', childrenStart + 200)
      const insertPos = sidebar.indexOf('\n', lastChildIndex)
      
      if (insertPos !== -1) {
        sidebar = sidebar.slice(0, insertPos) + '\n' + menuItem + sidebar.slice(insertPos)
        fs.writeFileSync(sidebarPath, sidebar)
        console.log(`   ✅ Updated ${path.relative(baseDir, sidebarPath)}`)
      }
    }
  } else {
    console.log(`   ⚠️  Sidebar already contains menu item for ${entityName}`)
  }

  console.log('\n✨ Table generation complete!')
  console.log('\n📝 Next steps:')
  console.log('   1. Review and update field mappings in the service file based on your Airtable schema')
  console.log('   2. Update the types file with actual field names from your Airtable table')
  console.log('   3. Update the config file to match your table columns and fields')
  console.log('   4. Test the API endpoints')
  console.log('   5. Restart both servers')
  console.log(`\n💡 To enable the feature in production, set: NEXT_PUBLIC_FEATURE_${snakeCase.toUpperCase()}=true\n`)
}

// Run the generation
generateTable().catch(error => {
  console.error('❌ Error generating table:', error)
  process.exit(1)
})

