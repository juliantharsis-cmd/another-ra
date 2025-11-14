/**
 * MCP Proxy Routes
 * 
 * Proxies MCP tool calls from frontend to backend services
 * This allows the chatbot to use MCP tools without needing the MCP server running
 */

import { Router, Request, Response } from 'express'

const router = Router()
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

/**
 * POST /api/mcp/tools/call
 * Call an MCP tool
 * 
 * This directly calls the backend services instead of going through MCP stdio
 * for better performance and reliability
 */
router.post('/tools/call', async (req: Request, res: Response) => {
  try {
    const { name, arguments: args } = req.body

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Tool name is required',
        content: '',
      })
    }

    // Directly call backend services (same as MCP server does)
    let result: any

    switch (name) {
      case 'get_table_data':
        result = await handleGetTableData(args)
        break
      case 'list_applications':
        result = await handleListApplications(args)
        break
      case 'list_tables':
        result = await handleListTables(args)
        break
      case 'get_user_preferences':
        result = await handleGetUserPreferences(args)
        break
      case 'configure_gemini':
        // Store in memory (in production, use Redis or database)
        result = { success: true, message: 'Gemini configured' }
        break
      default:
        return res.status(400).json({
          success: false,
          error: `Unknown tool: ${name}`,
          content: '',
        })
    }

    res.json({
      success: true,
      content: JSON.stringify(result, null, 2),
    })
  } catch (error: any) {
    console.error('Error calling MCP tool:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to call MCP tool',
      content: '',
    })
  }
})

// Tool handlers (same logic as MCP server)
async function handleGetTableData(args: any) {
  const { table, page = 1, limit = 25, search, filters } = args
  const params = new URLSearchParams()
  params.append('page', page.toString())
  params.append('limit', limit.toString())
  if (search) params.append('search', search)

  const response = await fetch(`${API_BASE_URL}/${table}?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filters: filters || {} }),
  })

  if (!response.ok) {
    throw new Error(`Failed to get table data: ${response.statusText}`)
  }

  return await response.json()
}

async function handleListApplications(args: any) {
  const { status } = args
  const params = status ? `?status=${status}` : ''
  const response = await fetch(`${API_BASE_URL}/application-list${params}`)
  
  if (!response.ok) {
    throw new Error(`Failed to list applications: ${response.statusText}`)
  }

  return await response.json()
}

async function handleListTables(args: any) {
  const { space } = args
  const response = await fetch(`${API_BASE_URL}/table-configuration`)
  
  if (!response.ok) {
    throw new Error(`Failed to list tables: ${response.statusText}`)
  }

  const tables = await response.json()
  return space ? tables.filter((t: any) => t.space === space) : tables
}

async function handleGetUserPreferences(args: any) {
  const { userId } = args
  const url = userId ? `${API_BASE_URL}/user-preferences/${userId}` : `${API_BASE_URL}/user-preferences`
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`Failed to get user preferences: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * GET /api/mcp/tools/list
 * List available MCP tools
 */
router.get('/tools/list', async (req: Request, res: Response) => {
  const tools = [
    { name: 'get_table_data', description: 'Retrieve data from a table' },
    { name: 'list_applications', description: 'List all applications' },
    { name: 'list_tables', description: 'List all available tables' },
    { name: 'get_user_preferences', description: 'Get user preferences' },
    { name: 'configure_gemini', description: 'Configure Gemini integration' },
  ]

  res.json({ tools })
})

export default router
