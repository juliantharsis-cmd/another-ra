# Quick Connect: MCP + Gemini + Chatbot

## Simple 3-Step Setup

### 1. Start MCP Server (Optional for Claude Desktop)

If you want to use MCP with Claude Desktop:
```bash
cd mcp-server
npm install && npm run build && npm start
```

**Note**: For chatbot integration, you don't need the MCP server running - the proxy routes handle it directly.

### 2. Your Chatbot Already Works!

Your existing chatbot (`AIChatInterface`) already:
- ✅ Uses your Gemini integration
- ✅ Injects AI Agent Profile
- ✅ Has context awareness

### 3. Enable MCP Tools (Optional Enhancement)

To add MCP tool capabilities to your chatbot:

**Option A: Use Enhanced Component**

Replace in `ChatbotModal.tsx`:
```typescript
// Change this:
import AIChatInterface from './AIChatInterface'

// To this:
import AIChatInterfaceMCP from './AIChatInterfaceMCP'
```

**Option B: Use Enhanced Function**

In `WelcomeDashboard.tsx`, replace:
```typescript
// Change this:
const response = await aiClient.chat(...)

// To this:
import { smartChatWithMCP } from '@/lib/ai/mcp-enhanced'
const response = await smartChatWithMCP(prompt, integrationId, context)
```

## What You Get

### Without MCP Tools (Current)
- ✅ Chat with Gemini
- ✅ AI Agent Profile injection
- ✅ Context awareness
- ❌ Can't query your data

### With MCP Tools (Enhanced)
- ✅ Everything above, PLUS:
- ✅ Can query tables: "List all companies"
- ✅ Can list applications: "Show me active apps"
- ✅ Can get preferences: "What are my settings?"
- ✅ Gemini analyzes the data and responds naturally

## Example Queries

Try these in your chatbot:

1. **"List all companies"**
   - Executes: `get_table_data({ table: "companies" })`
   - Gemini formats and explains the results

2. **"What applications are available?"**
   - Executes: `list_applications({})`
   - Gemini lists and describes them

3. **"Show me tables in system configuration"**
   - Executes: `list_tables({ space: "system-config" })`
   - Gemini explains what each table does

## Current Status

Your chatbot **already works** with:
- ✅ Gemini integration
- ✅ AI Agent Profile
- ✅ Context awareness

**To add MCP tools**, just use the enhanced components/functions above.

## No MCP Server Needed for Chatbot

The chatbot uses **direct API calls** through the proxy routes, so you don't need the MCP server running for chatbot functionality. The MCP server is only needed if you want to use it with Claude Desktop or other MCP clients.

