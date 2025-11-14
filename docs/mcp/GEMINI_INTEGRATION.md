# Gemini Integration with MCP Server

## Overview

The MCP server can be configured to use your existing Gemini integration and AI Agent Profile system. This allows Gemini to:

1. Use your configured API key from the integrations system
2. Automatically inject AI Agent Profile (personality, tone, preferences)
3. Access all MCP tools and resources
4. Provide contextual responses based on your agent profile

## Setup

### Option 1: Configure via MCP Tool (Recommended)

Once the MCP server is running, configure Gemini using the `configure_gemini` tool:

```json
{
  "tool": "configure_gemini",
  "arguments": {
    "apiKey": "your-gemini-api-key",
    "model": "gemini-1.5-flash",
    "userId": "your-user-id"
  }
}
```

### Option 2: Environment Variables

Set in `mcp-server/.env`:

```env
GEMINI_API_KEY=your-api-key-here
GEMINI_MODEL=gemini-1.5-flash
USER_ID=your-user-id
```

### Option 3: Get from Existing Integration

The MCP server can read your existing Gemini integration from localStorage (if running client-side) or you can pass it via the configure tool.

## Using Gemini with MCP

### Basic Chat

```json
{
  "tool": "chat_with_gemini",
  "arguments": {
    "message": "List all companies in the system",
    "context": "You are an AI assistant helping with data management."
  }
}
```

### With Tool Execution

The MCP server can:
1. Execute tools (like `get_table_data`)
2. Pass results to Gemini
3. Get a natural language response

Example flow:
```
User: "Show me all active applications"
  ↓
MCP executes: list_applications({ status: "active" })
  ↓
MCP sends to Gemini: "Here are the active applications: [results]"
  ↓
Gemini responds: "I found 5 active applications: [formatted list]"
```

## AI Agent Profile Integration

When you configure Gemini with a `userId`, the MCP server automatically:

1. **Fetches your AI Agent Profile** from the system
2. **Injects it into every Gemini request** as part of the system message
3. **Personalizes responses** based on:
   - Your preferred tone (professional, friendly, casual, technical)
   - Detail level (concise, balanced, detailed)
   - Response style (direct, conversational, structured)
   - Domain focus (your area of expertise)

### Managing AI Agent Profile

**Get your profile:**
```json
{
  "tool": "get_ai_agent_profile",
  "arguments": {
    "userId": "your-user-id"
  }
}
```

**Update your profile:**
```json
{
  "tool": "update_ai_agent_profile",
  "arguments": {
    "userId": "your-user-id",
    "profile": {
      "name": "Data Analyst Assistant",
      "role": "Senior Data Analyst",
      "tone": "professional",
      "detailLevel": "detailed",
      "responseStyle": "structured",
      "domainFocus": "Data management and analysis"
    }
  }
}
```

## Example: Full Workflow

### 1. Configure Gemini
```json
{
  "tool": "configure_gemini",
  "arguments": {
    "apiKey": "AIza...",
    "model": "gemini-1.5-flash",
    "userId": "user-123"
  }
}
```

### 2. Query Data
```json
{
  "tool": "get_table_data",
  "arguments": {
    "table": "companies",
    "limit": 10
  }
}
```

### 3. Get AI Analysis
```json
{
  "tool": "chat_with_gemini",
  "arguments": {
    "message": "Analyze these companies and suggest which ones need attention",
    "context": "You are analyzing company data. Be concise and actionable."
  }
}
```

## Integration with Your System

### Reading Your Existing Integration

If you want the MCP server to automatically use your existing Gemini integration:

1. **Get API key from integrations:**
   - Navigate to Integration Marketplace in your app
   - Find your Gemini integration
   - Copy the API key

2. **Get User ID:**
   - Check localStorage: `localStorage.getItem('userId')`
   - Or use your authentication system

3. **Configure MCP:**
   ```json
   {
     "tool": "configure_gemini",
     "arguments": {
       "apiKey": "[from integrations]",
       "userId": "[from auth system]"
     }
   }
   ```

### Using with Claude Desktop

Even when using Claude Desktop, you can configure Gemini as a fallback or for specific tasks:

```json
{
  "mcpServers": {
    "another-ra": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
      "env": {
        "NEXT_PUBLIC_API_URL": "http://localhost:3001/api",
        "GEMINI_API_KEY": "your-key",
        "USER_ID": "your-user-id"
      }
    }
  }
}
```

## Benefits

1. **Unified Experience**: Same AI Agent Profile across all AI interactions
2. **Context Awareness**: Gemini understands your preferences and style
3. **Tool Integration**: Gemini can use MCP tools and provide natural language responses
4. **Personalization**: Responses match your configured tone and detail level

## Troubleshooting

### "Gemini not configured" error
- Use `configure_gemini` tool first
- Or set `GEMINI_API_KEY` in environment

### AI Agent Profile not applied
- Ensure `userId` is set in configuration
- Verify AI Agent Profile exists in system
- Check API endpoint: `/api/ai-agent-profile`

### Model not found
- Check model name matches Gemini API
- Default: `gemini-1.5-flash`
- Alternatives: `gemini-1.5-pro`, `gemini-pro`

## Next Steps

1. Configure Gemini with your API key
2. Set up your AI Agent Profile
3. Test with simple queries
4. Use in combination with MCP tools for powerful workflows

