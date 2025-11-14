# Connecting MCP Server to Your Chatbot

## Quick Setup Guide

### Step 1: Start MCP Server

```bash
cd mcp-server
npm install
npm run build

# In one terminal - keep running
npm start
```

### Step 2: Configure Gemini

The chatbot will automatically use your existing Gemini integration. Make sure:

1. **Gemini is configured** in Integration Marketplace
2. **User ID exists** (check localStorage: `localStorage.getItem('userId')`)

### Step 3: Use Enhanced Chatbot

Replace `AIChatInterface` with `AIChatInterfaceMCP` in your components:

**In `ChatbotModal.tsx`:**
```typescript
import AIChatInterfaceMCP from './AIChatInterfaceMCP'

// Replace AIChatInterface with:
<AIChatInterfaceMCP onClose={onClose} />
```

**In `WelcomeDashboard.tsx`:**
```typescript
import { smartChatWithMCP } from '@/lib/ai/mcp-enhanced'

// Replace aiClient.chat with:
const response = await smartChatWithMCP(
  prompt,
  activeIntegration.id,
  'You are an expert sustainability analyst...'
)
```

## How It Works

### Automatic Tool Detection

When you ask:
- "List all companies" → Uses `get_table_data` tool
- "Show me applications" → Uses `list_applications` tool
- "What tables are available?" → Uses `list_tables` tool

### Flow

```
User: "List all companies"
  ↓
Chatbot detects intent
  ↓
Calls MCP tool: get_table_data({ table: "companies" })
  ↓
Gets data from your API
  ↓
Sends data + question to Gemini
  ↓
Gemini provides formatted response
  ↓
User sees: "Here are the companies: [formatted list]"
```

## Manual Tool Usage

You can also use tools directly:

```typescript
import { callMCPTool } from '@/lib/mcp/client'

// Get companies
const result = await callMCPTool({
  name: 'get_table_data',
  arguments: {
    table: 'companies',
    limit: 10,
  },
})

console.log(result.content) // JSON data
```

## Testing

1. **Start MCP server**: `cd mcp-server && npm start`
2. **Start API server**: `cd server && npm run dev`
3. **Start frontend**: `npm run dev`
4. **Open chatbot** and try:
   - "List all companies"
   - "Show me active applications"
   - "What tables are in the system?"

## Troubleshooting

### "MCP server not responding"
- Check MCP server is running
- Verify API URL in `mcp-server/.env`
- Check server logs

### "Tools not working"
- Ensure API server is running
- Check MCP proxy route is registered
- Verify tool names match exactly

### "Gemini not configured"
- Check Integration Marketplace has Gemini
- Verify API key is set
- Try configuring manually: `configureGeminiForMCP(apiKey, model, userId)`

