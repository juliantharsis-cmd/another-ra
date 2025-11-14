# MCP Server Frontend Integration

## Overview

This guide explains how to connect the MCP server with your Gemini integration and the AI chatbot on the welcome page.

## Architecture

```
┌─────────────────┐
│  Welcome Page   │
│   Chatbot       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AIChatInterface│
│  (Frontend)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MCP Client     │
│  (lib/mcp/)     │
└────────┬────────┘
         │ HTTP API
         ▼
┌─────────────────┐
│  MCP Proxy      │
│  (server/routes)│
└────────┬────────┘
         │ stdio
         ▼
┌─────────────────┐
│  MCP Server     │
│  (mcp-server/)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Your API       │
│  (Airtable)     │
└─────────────────┘
```

## Setup Steps

### 1. Start the MCP Server

```bash
cd mcp-server
npm install
npm run build
npm start
```

Keep this running in a separate terminal.

### 2. Configure Gemini Integration

The MCP server will automatically use your existing Gemini integration. Make sure:

1. **Gemini is configured** in your Integration Marketplace
2. **User ID is set** in localStorage (for AI Agent Profile)
3. **MCP server is running** and accessible

### 3. Use in Chatbot

The chatbot will automatically:
- Detect when tools are needed
- Execute MCP tools
- Pass results to Gemini
- Get enhanced responses

## Usage Examples

### Example 1: Query Data

**User**: "List all companies"

**Flow**:
1. Chatbot detects "list companies" intent
2. Calls `get_table_data` MCP tool
3. Gets company data
4. Sends data + original question to Gemini
5. Gemini provides formatted response

### Example 2: Get Applications

**User**: "What applications are available?"

**Flow**:
1. Calls `list_applications` MCP tool
2. Gets application list
3. Gemini formats and explains the results

### Example 3: Direct Tool Usage

You can also explicitly use tools:

```typescript
import { callMCPTool } from '@/lib/mcp/client'

// Get table data
const result = await callMCPTool({
  name: 'get_table_data',
  arguments: {
    table: 'companies',
    limit: 10,
  },
})

// Then use result in chat
```

## Integration Points

### 1. Welcome Page Chatbot

The welcome page chatbot (`WelcomeDashboard`) can use MCP tools:

```typescript
import { smartChatWithMCP } from '@/lib/ai/mcp-enhanced'

// In your component
const response = await smartChatWithMCP(
  userMessage,
  integrationId,
  context
)
```

### 2. Sidebar Chatbot

The sidebar chatbot (`AIChatInterface`) can also use MCP tools:

```typescript
import { chatWithMCPTools } from '@/lib/ai/mcp-enhanced'

// Enhanced chat with tool support
const response = await chatWithMCPTools(
  chatOptions,
  integrationId,
  true // enable MCP tools
)
```

## Configuration

### Environment Variables

In `mcp-server/.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
GEMINI_API_KEY=your-key (optional, can be set via tool)
USER_ID=your-user-id (optional, can be set via tool)
```

### Auto-Configuration

The system will automatically:
1. Find your Gemini integration
2. Configure MCP server with your API key
3. Use your user ID for AI Agent Profile
4. Enable tool usage in chatbot

## How It Works

### 1. Tool Detection

The system detects when a user query needs tools:
- Keywords: "list", "show", "get", "create", etc.
- Entity mentions: "companies", "users", "applications"
- Action verbs: "find", "search", "query"

### 2. Tool Execution

When tools are needed:
1. Parse user intent
2. Select appropriate MCP tool
3. Execute tool with extracted parameters
4. Get results

### 3. Enhanced Response

1. Send original question + tool results to Gemini
2. Gemini provides natural language response
3. User sees formatted, contextual answer

## Benefits

1. **Unified Experience**: Same Gemini integration, same AI Agent Profile
2. **Action Capability**: Chatbot can actually do things, not just chat
3. **Context Aware**: Understands your data and can query it
4. **Personalized**: Uses your AI Agent Profile for consistent responses

## Troubleshooting

### MCP Server Not Responding

1. Check if server is running: `cd mcp-server && npm start`
2. Verify API URL in `.env`
3. Check server logs for errors

### Tools Not Working

1. Ensure MCP server is running
2. Check API server is accessible
3. Verify tool names match exactly

### Gemini Not Configured

1. Use `configure_gemini` tool first
2. Or set `GEMINI_API_KEY` in environment
3. Check your integration has API key set

## Next Steps

1. Start MCP server
2. Test with simple queries
3. Try tool-enabled queries
4. Customize tool detection logic
5. Add more tools as needed

