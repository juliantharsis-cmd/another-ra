# MCP Server Setup Guide

## Overview

The Model Context Protocol (MCP) server allows AI agents like Claude to interact with your Another RA application. This enables natural language queries and operations on your data.

## Quick Start

### 1. Install Dependencies

```bash
cd mcp-server
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and set NEXT_PUBLIC_API_URL
```

### 3. Build and Run

```bash
npm run build
npm start
```

### 4. Connect to Claude Desktop

Add to Claude Desktop config (see README.md for paths):

```json
{
  "mcpServers": {
    "another-ra": {
      "command": "node",
      "args": ["C:/path/to/another-ra/mcp-server/dist/index.js"],
      "env": {
        "NEXT_PUBLIC_API_URL": "http://localhost:3001/api"
      }
    }
  }
}
```

## Architecture

```
┌─────────────┐
│ Claude AI   │
│  Assistant  │
└──────┬──────┘
       │ MCP Protocol (stdio)
       │
┌──────▼──────────────────┐
│  MCP Server             │
│  (mcp-server/)          │
└──────┬──────────────────┘
       │ HTTP API Calls
       │
┌──────▼──────────────────┐
│  Another RA API Server  │
│  (server/)              │
└──────┬──────────────────┘
       │
┌──────▼──────────────────┐
│  Airtable / Database    │
└─────────────────────────┘
```

## Available Capabilities

### Tools (Actions)

1. **Data Operations**
   - List tables
   - Query table data
   - Create/update/delete records

2. **Application Management**
   - List applications
   - Manage user preferences
   - List AI integrations

3. **Table Creation**
   - Create tables from Airtable

### Resources (Information)

1. **Tables** - List of all available tables
2. **Spaces** - System spaces and their tables
3. **API Endpoints** - Documentation of available endpoints

## Use Cases

### Example 1: Query Data
**User**: "Show me all companies in the system"
**Claude**: Uses `get_table_data` tool with table="companies"

### Example 2: Create Record
**User**: "Add a new user named John Doe"
**Claude**: Uses `create_table_record` tool with table="users", data={name: "John Doe"}

### Example 3: List Applications
**User**: "What applications are available?"
**Claude**: Uses `list_applications` tool

## Extending the Server

### Adding a New Tool

1. **Define the tool** in `ListToolsRequestSchema`:
```typescript
{
  name: 'my_tool',
  description: 'What it does',
  inputSchema: {
    type: 'object',
    properties: {
      param: { type: 'string' }
    }
  }
}
```

2. **Add handler** in `CallToolRequestSchema`:
```typescript
case 'my_tool':
  return await this.handleMyTool(args as any)
```

3. **Implement handler**:
```typescript
private async handleMyTool(args: { param: string }) {
  // Your implementation
  return {
    content: [{ type: 'text', text: 'Result' }]
  }
}
```

### Adding a New Resource

1. **Add to `ListResourcesRequestSchema`**:
```typescript
{
  uri: 'another-ra://my-resource',
  name: 'My Resource',
  description: 'Description',
  mimeType: 'application/json',
}
```

2. **Handle in `ReadResourceRequestSchema`**:
```typescript
case 'another-ra://my-resource':
  return await this.getMyResource()
```

## Testing

### Manual Testing

1. Start the MCP server:
```bash
npm run dev
```

2. Test with MCP client (if available) or connect via Claude Desktop

### Integration Testing

The server communicates via stdio, so testing requires:
- MCP client library
- Or connect via Claude Desktop and test interactions

## Security Considerations

1. **API Authentication**: Currently uses API URL directly. Consider:
   - API key authentication
   - User context passing
   - Rate limiting

2. **Tool Permissions**: Some tools modify data. Consider:
   - Permission checks
   - Audit logging
   - Confirmation for destructive operations

3. **Environment Variables**: Keep `.env` secure and don't commit it

## Troubleshooting

### Server Not Starting
- Check Node.js version (18+)
- Verify dependencies installed
- Check `.env` file exists

### Tools Not Working
- Verify API server is running
- Check API URL in `.env`
- Review API server logs

### Claude Not Connecting
- Verify config file path
- Check file permissions
- Ensure server is running
- Review Claude Desktop logs

## Next Steps

1. Add authentication/authorization
2. Add more tools for specific use cases
3. Implement caching for frequently accessed data
4. Add error handling and retries
5. Create tool documentation for AI agents

