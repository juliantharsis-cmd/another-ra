#!/usr/bin/env node

/**
 * Another RA MCP Server
 * 
 * Exposes application capabilities to AI agents via Model Context Protocol
 * 
 * Usage:
 *   npm run dev    # Development mode
 *   npm start      # Production mode
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '../.env') })

// Import API clients (adjust paths based on your structure)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

// Gemini configuration (optional - can be set via environment or tool)
let geminiConfig: {
  apiKey?: string
  model?: string
  userId?: string
} = {
  apiKey: process.env.GEMINI_API_KEY,
  model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  userId: process.env.USER_ID,
}

/**
 * MCP Server Implementation
 */
class AnotherRAMCPServer {
  private server: Server

  constructor() {
    this.server = new Server(
      {
        name: 'another-ra-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    )

    this.setupHandlers()
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'list_tables',
          description: 'List all available tables in the system configuration space',
          inputSchema: {
            type: 'object',
            properties: {
              space: {
                type: 'string',
                enum: ['system-config', 'admin', 'emission-management'],
                description: 'The space to list tables from',
              },
            },
          },
        },
        {
          name: 'get_table_data',
          description: 'Retrieve data from a specific table with optional filtering and pagination',
          inputSchema: {
            type: 'object',
            properties: {
              table: {
                type: 'string',
                description: 'Name of the table (e.g., "companies", "users", "emission-factors")',
              },
              page: {
                type: 'number',
                description: 'Page number (default: 1)',
                default: 1,
              },
              limit: {
                type: 'number',
                description: 'Items per page (default: 25)',
                default: 25,
              },
              search: {
                type: 'string',
                description: 'Search query to filter results',
              },
              filters: {
                type: 'object',
                description: 'Additional filters as key-value pairs',
              },
            },
            required: ['table'],
          },
        },
        {
          name: 'create_table_record',
          description: 'Create a new record in a table',
          inputSchema: {
            type: 'object',
            properties: {
              table: {
                type: 'string',
                description: 'Name of the table',
              },
              data: {
                type: 'object',
                description: 'Record data as key-value pairs',
              },
            },
            required: ['table', 'data'],
          },
        },
        {
          name: 'update_table_record',
          description: 'Update an existing record in a table',
          inputSchema: {
            type: 'object',
            properties: {
              table: {
                type: 'string',
                description: 'Name of the table',
              },
              id: {
                type: 'string',
                description: 'Record ID',
              },
              data: {
                type: 'object',
                description: 'Fields to update as key-value pairs',
              },
            },
            required: ['table', 'id', 'data'],
          },
        },
        {
          name: 'delete_table_record',
          description: 'Delete a record from a table',
          inputSchema: {
            type: 'object',
            properties: {
              table: {
                type: 'string',
                description: 'Name of the table',
              },
              id: {
                type: 'string',
                description: 'Record ID to delete',
              },
            },
            required: ['table', 'id'],
          },
        },
        {
          name: 'list_applications',
          description: 'List all applications in the system',
          inputSchema: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['active', 'coming-soon', 'inactive'],
                description: 'Filter by application status',
              },
            },
          },
        },
        {
          name: 'get_user_preferences',
          description: 'Get user preferences for a specific user',
          inputSchema: {
            type: 'object',
            properties: {
              userId: {
                type: 'string',
                description: 'User ID (defaults to current user)',
              },
            },
          },
        },
        {
          name: 'update_user_preferences',
          description: 'Update user preferences',
          inputSchema: {
            type: 'object',
            properties: {
              userId: {
                type: 'string',
                description: 'User ID (defaults to current user)',
              },
              preferences: {
                type: 'object',
                description: 'Preferences to update',
                properties: {
                  defaultPageSize: { type: 'number' },
                  sidebarLayout: { type: 'string', enum: ['sidebarFooter', 'topBanner'] },
                },
              },
            },
            required: ['preferences'],
          },
        },
        {
          name: 'list_ai_integrations',
          description: 'List all configured AI integrations',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'create_table_from_airtable',
          description: 'Create a new table configuration from an Airtable table',
          inputSchema: {
            type: 'object',
            properties: {
              baseId: {
                type: 'string',
                description: 'Airtable base ID',
              },
              tableId: {
                type: 'string',
                description: 'Airtable table ID',
              },
              tableName: {
                type: 'string',
                description: 'Name for the new table',
              },
              targetSection: {
                type: 'string',
                enum: ['system-config', 'admin', 'emission-management'],
                description: 'Target space section',
              },
            },
            required: ['baseId', 'tableId', 'tableName', 'targetSection'],
          },
        },
        {
          name: 'configure_gemini',
          description: 'Configure Gemini integration for MCP server (uses your existing Gemini API key)',
          inputSchema: {
            type: 'object',
            properties: {
              apiKey: {
                type: 'string',
                description: 'Gemini API key (from your integrations)',
              },
              model: {
                type: 'string',
                description: 'Gemini model to use (default: gemini-1.5-flash)',
                default: 'gemini-1.5-flash',
              },
              userId: {
                type: 'string',
                description: 'User ID for AI Agent Profile injection',
              },
            },
            required: ['apiKey'],
          },
        },
        {
          name: 'chat_with_gemini',
          description: 'Send a chat message to Gemini using the configured integration and AI Agent Profile',
          inputSchema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Message to send to Gemini',
              },
              context: {
                type: 'string',
                description: 'Additional context or system instructions',
              },
            },
            required: ['message'],
          },
        },
        {
          name: 'get_ai_agent_profile',
          description: 'Get the AI Agent Profile for a user (personality, tone, preferences)',
          inputSchema: {
            type: 'object',
            properties: {
              userId: {
                type: 'string',
                description: 'User ID (defaults to configured user)',
              },
            },
          },
        },
        {
          name: 'update_ai_agent_profile',
          description: 'Update the AI Agent Profile (personality, tone, domain focus, etc.)',
          inputSchema: {
            type: 'object',
            properties: {
              userId: {
                type: 'string',
                description: 'User ID (defaults to configured user)',
              },
              profile: {
                type: 'object',
                description: 'Profile fields to update',
                properties: {
                  name: { type: 'string' },
                  role: { type: 'string' },
                  tone: { type: 'string', enum: ['professional', 'friendly', 'casual', 'technical'] },
                  detailLevel: { type: 'string', enum: ['concise', 'balanced', 'detailed'] },
                  responseStyle: { type: 'string', enum: ['direct', 'conversational', 'structured'] },
                  domainFocus: { type: 'string' },
                },
              },
            },
            required: ['profile'],
          },
        },
      ],
    }))

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params

      try {
        switch (name) {
          case 'list_tables':
            return await this.handleListTables(args as any)
          case 'get_table_data':
            return await this.handleGetTableData(args as any)
          case 'create_table_record':
            return await this.handleCreateTableRecord(args as any)
          case 'update_table_record':
            return await this.handleUpdateTableRecord(args as any)
          case 'delete_table_record':
            return await this.handleDeleteTableRecord(args as any)
          case 'list_applications':
            return await this.handleListApplications(args as any)
          case 'get_user_preferences':
            return await this.handleGetUserPreferences(args as any)
          case 'update_user_preferences':
            return await this.handleUpdateUserPreferences(args as any)
          case 'list_ai_integrations':
            return await this.handleListAIIntegrations(args as any)
          case 'create_table_from_airtable':
            return await this.handleCreateTableFromAirtable(args as any)
          case 'configure_gemini':
            return await this.handleConfigureGemini(args as any)
          case 'chat_with_gemini':
            return await this.handleChatWithGemini(args as any)
          case 'get_ai_agent_profile':
            return await this.handleGetAIAgentProfile(args as any)
          case 'update_ai_agent_profile':
            return await this.handleUpdateAIAgentProfile(args as any)
          default:
            throw new Error(`Unknown tool: ${name}`)
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        }
      }
    })

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'another-ra://tables',
          name: 'Available Tables',
          description: 'List of all tables in the system',
          mimeType: 'application/json',
        },
        {
          uri: 'another-ra://spaces',
          name: 'Spaces',
          description: 'List of all spaces in the system',
          mimeType: 'application/json',
        },
        {
          uri: 'another-ra://api-endpoints',
          name: 'API Endpoints',
          description: 'List of all available API endpoints',
          mimeType: 'application/json',
        },
      ],
    }))

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params

      try {
        switch (uri) {
          case 'another-ra://tables':
            return await this.getTablesResource()
          case 'another-ra://spaces':
            return await this.getSpacesResource()
          case 'another-ra://api-endpoints':
            return await this.getAPIEndpointsResource()
          default:
            throw new Error(`Unknown resource: ${uri}`)
        }
      } catch (error: any) {
        return {
          contents: [
            {
              uri,
              mimeType: 'text/plain',
              text: `Error: ${error.message}`,
            },
          ],
        }
      }
    })
  }

  // Tool handlers
  private async handleListTables(args: { space?: string }) {
    const response = await fetch(`${API_BASE_URL}/table-configuration`)
    const tables = await response.json() as any[]
    
    const filtered = args.space
      ? tables.filter((t: any) => t.space === args.space)
      : tables

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(filtered, null, 2),
        },
      ],
    }
  }

  private async handleGetTableData(args: {
    table: string
    page?: number
    limit?: number
    search?: string
    filters?: Record<string, any>
  }) {
    const params = new URLSearchParams()
    if (args.page) params.append('page', args.page.toString())
    if (args.limit) params.append('limit', args.limit.toString())
    if (args.search) params.append('search', args.search)

    const url = `${API_BASE_URL}/${args.table}?${params.toString()}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filters: args.filters || {} }),
    })

    const data = await response.json()

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    }
  }

  private async handleCreateTableRecord(args: { table: string; data: Record<string, any> }) {
    const response = await fetch(`${API_BASE_URL}/${args.table}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args.data),
    })

    const result = await response.json()

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    }
  }

  private async handleUpdateTableRecord(args: {
    table: string
    id: string
    data: Record<string, any>
  }) {
    const response = await fetch(`${API_BASE_URL}/${args.table}/${args.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args.data),
    })

    const result = await response.json()

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    }
  }

  private async handleDeleteTableRecord(args: { table: string; id: string }) {
    const response = await fetch(`${API_BASE_URL}/${args.table}/${args.id}`, {
      method: 'DELETE',
    })

    const result = await response.json()

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    }
  }

  private async handleListApplications(args: { status?: string }) {
    const params = args.status ? `?status=${args.status}` : ''
    const response = await fetch(`${API_BASE_URL}/application-list${params}`)
    const data = await response.json()

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    }
  }

  private async handleGetUserPreferences(args: { userId?: string }) {
    const url = args.userId
      ? `${API_BASE_URL}/user-preferences/${args.userId}`
      : `${API_BASE_URL}/user-preferences`
    const response = await fetch(url)
    const data = await response.json()

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    }
  }

  private async handleUpdateUserPreferences(args: {
    userId?: string
    preferences: Record<string, any>
  }) {
    const url = args.userId
      ? `${API_BASE_URL}/user-preferences/${args.userId}`
      : `${API_BASE_URL}/user-preferences`
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args.preferences),
    })

    const result = await response.json()

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    }
  }

  private async handleListAIIntegrations(args: {}) {
    const response = await fetch(`${API_BASE_URL}/ai/integrations`)
    const data = await response.json()

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    }
  }

  private async handleCreateTableFromAirtable(args: {
    baseId: string
    tableId: string
    tableName: string
    targetSection: string
  }) {
    const response = await fetch(`${API_BASE_URL}/developer/tables/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'airtable',
        ...args,
      }),
    })

    const result = await response.json()

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    }
  }

  private async handleConfigureGemini(args: {
    apiKey: string
    model?: string
    userId?: string
  }) {
    geminiConfig = {
      apiKey: args.apiKey,
      model: args.model || geminiConfig.model || 'gemini-1.5-flash',
      userId: args.userId || geminiConfig.userId,
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Gemini configured successfully',
            model: geminiConfig.model,
            userId: geminiConfig.userId || 'not set',
          }, null, 2),
        },
      ],
    }
  }

  private async handleChatWithGemini(args: {
    message: string
    context?: string
  }) {
    if (!geminiConfig.apiKey) {
      throw new Error('Gemini not configured. Use configure_gemini tool first.')
    }

    // Use the API endpoint to chat with Gemini (which handles AI Agent Profile injection)
    const response = await fetch(`${API_BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId: 'google',
        apiKey: geminiConfig.apiKey,
        model: geminiConfig.model || 'gemini-1.5-flash',
        messages: [
          ...(args.context ? [{ role: 'system' as const, content: args.context }] : []),
          { role: 'user' as const, content: args.message },
        ],
        userId: geminiConfig.userId, // This injects the AI Agent Profile
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText })) as any
      throw new Error(`Failed to chat with Gemini: ${error?.error || response.statusText}`)
    }

    const result = await response.json() as any

    return {
      content: [
        {
          type: 'text',
          text: result?.content || result?.data?.content || JSON.stringify(result, null, 2),
        },
      ],
    }
  }

  private async handleGetAIAgentProfile(args: { userId?: string }) {
    const userId = args.userId || geminiConfig.userId
    if (!userId) {
      throw new Error('User ID required. Provide userId argument or configure it via configure_gemini.')
    }

    const url = `${API_BASE_URL}/ai-agent-profile/${userId}`
    const response = await fetch(url)
    
    if (!response.ok) {
      if (response.status === 404) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ message: 'No AI Agent Profile found. Using defaults.' }, null, 2),
            },
          ],
        }
      }
      throw new Error(`Failed to get AI Agent Profile: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    }
  }

  private async handleUpdateAIAgentProfile(args: {
    userId?: string
    profile: Record<string, any>
  }) {
    const userId = args.userId || geminiConfig.userId
    if (!userId) {
      throw new Error('User ID required. Provide userId argument or configure it via configure_gemini.')
    }

    const url = `${API_BASE_URL}/ai-agent-profile/${userId}`
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args.profile),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText })) as any
      throw new Error(`Failed to update AI Agent Profile: ${error?.error || response.statusText}`)
    }

    const result = await response.json()

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    }
  }

  // Resource handlers
  private async getTablesResource() {
    const response = await fetch(`${API_BASE_URL}/table-configuration`)
    const tables = await response.json()

    return {
      contents: [
        {
          uri: 'another-ra://tables',
          mimeType: 'application/json',
          text: JSON.stringify(tables, null, 2),
        },
      ],
    }
  }

  private async getSpacesResource() {
    const spaces = [
      {
        id: 'system-config',
        name: 'System Configuration',
        description: 'Manage companies, organizational structure, and system configurations',
        tables: ['companies', 'geography', 'user-roles', 'application-list'],
      },
      {
        id: 'admin',
        name: 'Administration',
        description: 'Administrative functions and user management',
        tables: ['entities', 'customer-value-chain', 'customer-activities'],
      },
      {
        id: 'emission-management',
        name: 'Emission Management',
        description: 'Track and manage greenhouse gas emissions data',
        tables: ['emission-factors', 'ghg-types', 'standard-emission-factors'],
      },
    ]

    return {
      contents: [
        {
          uri: 'another-ra://spaces',
          mimeType: 'application/json',
          text: JSON.stringify(spaces, null, 2),
        },
      ],
    }
  }

  private async getAPIEndpointsResource() {
    const endpoints = {
      tables: {
        list: 'GET /api/table-configuration',
        get: 'GET /api/{table}',
        create: 'POST /api/{table}',
        update: 'PUT /api/{table}/{id}',
        delete: 'DELETE /api/{table}/{id}',
      },
      applications: {
        list: 'GET /api/application-list',
      },
      preferences: {
        get: 'GET /api/user-preferences',
        update: 'PUT /api/user-preferences',
      },
      ai: {
        integrations: 'GET /api/ai/integrations',
        chat: 'POST /api/ai/chat',
      },
      developer: {
        createTable: 'POST /api/developer/tables/create',
      },
    }

    return {
      contents: [
        {
          uri: 'another-ra://api-endpoints',
          mimeType: 'application/json',
          text: JSON.stringify(endpoints, null, 2),
        },
      ],
    }
  }

  async run() {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    console.error('Another RA MCP Server running on stdio')
  }
}

// Start server
const server = new AnotherRAMCPServer()
server.run().catch(console.error)

