/**
 * AI Context Gathering Utility
 * 
 * Collects context about the current page, route, and available data
 * to help the AI assistant understand what the user is viewing
 */

export interface PageContext {
  // Route information
  pathname: string
  route: string
  space?: 'system-config' | 'admin' | 'emission-management' | 'ecm-management' | 'reference-data' | 'other'
  
  // Page information
  pageTitle?: string
  pageType?: 'list' | 'detail' | 'dashboard' | 'settings' | 'other'
  
  // Data context
  tableName?: string
  entityId?: string
  availableTables?: string[]
  
  // User context
  userId?: string
  
  // Additional metadata
  metadata?: Record<string, any>
}

/**
 * Detect the current space from pathname
 */
export function detectSpace(pathname: string): PageContext['space'] {
  if (pathname.startsWith('/spaces/system-config')) return 'system-config'
  if (pathname.startsWith('/spaces/admin')) return 'admin'
  if (pathname.startsWith('/spaces/emission-management')) return 'emission-management'
  if (pathname.startsWith('/spaces/ecm-management')) return 'ecm-management'
  if (pathname.startsWith('/spaces/reference-data')) return 'reference-data'
  return 'other'
}

/**
 * Extract table name from pathname
 * Examples:
 * - /spaces/system-config/companies -> companies
 * - /spaces/admin/application-list -> application-list
 */
export function extractTableName(pathname: string): string | undefined {
  const match = pathname.match(/\/spaces\/[^/]+\/([^/]+)/)
  return match ? match[1] : undefined
}

/**
 * Extract entity ID from pathname
 * Examples:
 * - /spaces/system-config/companies/123 -> 123
 */
export function extractEntityId(pathname: string): string | undefined {
  const parts = pathname.split('/')
  // Entity ID is typically the last part if it's not a known route segment
  const lastPart = parts[parts.length - 1]
  // Check if it looks like an ID (UUID, number, or alphanumeric)
  if (lastPart && lastPart !== 'page' && /^[a-zA-Z0-9-]+$/.test(lastPart)) {
    // Make sure it's not a known route segment
    const knownSegments = ['page', 'new', 'edit', 'create', 'settings']
    if (!knownSegments.includes(lastPart.toLowerCase())) {
      return lastPart
    }
  }
  return undefined
}

/**
 * Detect page type from pathname
 */
export function detectPageType(pathname: string): PageContext['pageType'] {
  if (pathname.includes('/settings')) return 'settings'
  if (pathname.match(/\/[^/]+\/[^/]+$/)) {
    // Has entity ID - likely detail page
    return 'detail'
  }
  if (pathname.includes('/dashboard') || pathname === '/') return 'dashboard'
  if (pathname.match(/\/spaces\/[^/]+\/[^/]+$/)) {
    // Space + table name - likely list page
    return 'list'
  }
  return 'other'
}

/**
 * Get page title from pathname
 */
export function getPageTitle(pathname: string, space?: PageContext['space']): string {
  const tableName = extractTableName(pathname)
  if (tableName) {
    // Convert kebab-case to Title Case
    return tableName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
  
  if (space === 'system-config') return 'System Configuration'
  if (space === 'admin') return 'Administration'
  if (space === 'emission-management') return 'Emission Management'
  if (space === 'ecm-management') return 'ECM Management'
  if (space === 'reference-data') return 'Reference Data'
  
  return 'Home'
}

/**
 * Gather context from the current page
 */
export function gatherPageContext(pathname: string, userId?: string): PageContext {
  const space = detectSpace(pathname)
  const tableName = extractTableName(pathname)
  const entityId = extractEntityId(pathname)
  const pageType = detectPageType(pathname)
  const pageTitle = getPageTitle(pathname, space)
  
  return {
    pathname,
    route: pathname,
    space,
    pageTitle,
    pageType,
    tableName,
    entityId,
    userId,
  }
}

/**
 * Format context as a system message for AI
 * Optimized for clarity and token efficiency
 */
export function formatContextAsSystemMessage(context: PageContext): string {
  const parts: string[] = []
  
  // Core role - explicit about understanding current page
  parts.push('You are an AI assistant helping a user navigate and understand their application.')
  parts.push('IMPORTANT: The user is currently viewing a specific page in the application. You MUST use this context when answering their questions.')
  
  // Space context - explicit
  if (context.space && context.space !== 'other') {
    const spaceNames: Record<string, string> = {
      'system-config': 'System Configuration',
      'admin': 'Administration',
      'emission-management': 'Emission Management',
      'ecm-management': 'ECM Management',
      'reference-data': 'Reference Data',
    }
    parts.push(`\nThe user is currently in the "${spaceNames[context.space]}" space.`)
  }
  
  // Page context - explicit and clear
  if (context.pageTitle) {
    const pageTypeDescriptions: Record<string, string> = {
      'list': 'a list view showing multiple records',
      'detail': 'a detail view showing a specific record',
      'dashboard': 'a dashboard with overview information',
      'settings': 'a settings page',
      'other': 'a general page',
    }
    const typeDesc = context.pageType ? pageTypeDescriptions[context.pageType] || 'a page' : 'a page'
    parts.push(`\nCurrent page: "${context.pageTitle}"`)
    parts.push(`This is ${typeDesc}.`)
  }
  
  // Table context - most important, make it very clear
  if (context.tableName) {
    const tableDisplayName = context.tableName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    
    if (context.entityId) {
      parts.push(`\nThe user is viewing a specific record from the "${tableDisplayName}" table.`)
      parts.push(`Record ID: ${context.entityId}`)
    } else {
      parts.push(`\nThe user is viewing the "${tableDisplayName}" table.`)
      parts.push(`They are looking at a list of all records in this table.`)
    }
  }
  
  // Route - explicit URL
  parts.push(`\nCurrent URL/Route: ${context.route}`)
  
  // Instructions - make it clear what to do
  parts.push(`\nWhen the user asks questions, you should:`)
  parts.push(`- Understand that they are asking about the CURRENT PAGE they are viewing`)
  parts.push(`- Reference the table, data, and features visible on this page`)
  parts.push(`- Answer questions about what data is displayed, what fields are shown, and what actions are available`)
  parts.push(`- If they ask about data on "this page" or "here", they mean the current page: ${context.pageTitle || context.route}`)
  
  if (context.tableName) {
    parts.push(`\nYou can reference the "${context.tableName}" table and its data when answering questions.`)
    parts.push(`When the user asks about data, fields, or values, they are likely referring to data visible in the "${context.tableName}" table on the current page.`)
  }
  
  return parts.join(' ')
}

/**
 * Get available tables/spaces (for future enhancement)
 * This can be extended to fetch from API or context
 */
export async function getAvailableTables(): Promise<string[]> {
  // For now, return common tables based on known routes
  // This can be enhanced to fetch from an API endpoint
  return [
    'application-list',
    'companies',
    'user-preferences',
    'protocols',
    'survey-themes',
    'thermal-criteria',
    'geo-code',
  ]
}

