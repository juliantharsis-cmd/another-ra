# Another RA MCP Server

Model Context Protocol (MCP) server that exposes Another RA application capabilities to AI agents.

## What is MCP?

Model Context Protocol is a standardized protocol that allows AI assistants to interact with external tools and services. This MCP server enables AI agents to:

- Query and manage data from your tables
- Create and update records
- List applications and integrations
- Manage user preferences
- Create new tables from Airtable

## Installation

```bash
cd mcp-server
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your API URL:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

## Connecting to Claude Desktop

Add this to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "another-ra": {
      "command": "node",
      "args": [
        "/path/to/another-ra/mcp-server/dist/index.js"
      ],
      "env": {
        "NEXT_PUBLIC_API_URL": "http://localhost:3001/api"
      }
    }
  }
}
```

## Available Tools

### Data Management
- `list_tables` - List all available tables
- `get_table_data` - Retrieve data from a table with filtering
- `create_table_record` - Create a new record
- `update_table_record` - Update an existing record
- `delete_table_record` - Delete a record

### Application Management
- `list_applications` - List all applications
- `get_user_preferences` - Get user preferences
- `update_user_preferences` - Update user preferences
- `list_ai_integrations` - List AI integrations

### Table Creation
- `create_table_from_airtable` - Create a new table from Airtable

## Available Resources

- `another-ra://tables` - List of all tables
- `another-ra://spaces` - List of all spaces
- `another-ra://api-endpoints` - API endpoint documentation

## Example Usage

Once connected, you can ask Claude:

- "List all companies in the system"
- "Create a new user with name John Doe"
- "Show me all active applications"
- "What tables are available in the system configuration space?"
- "Create a new table from Airtable base app123, table tbl456, named 'New Table'"

## Development

### Project Structure
```
mcp-server/
├── src/
│   └── index.ts          # Main server implementation
├── dist/                 # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```

### Adding New Tools

1. Add tool definition to `ListToolsRequestSchema` handler
2. Add handler method in `CallToolRequestSchema`
3. Implement the handler method

Example:
```typescript
{
  name: 'my_new_tool',
  description: 'Does something useful',
  inputSchema: {
    type: 'object',
    properties: {
      param: { type: 'string' }
    }
  }
}
```

## Troubleshooting

### Server won't start
- Check that port 3001 is available (your API server)
- Verify `.env` file exists and has correct values
- Check Node.js version (requires Node 18+)

### Tools not working
- Ensure your API server is running
- Check API endpoints are accessible
- Review server logs for errors

### Connection issues
- Verify Claude Desktop config path is correct
- Check file permissions
- Ensure MCP SDK is installed correctly

## Security Notes

- The MCP server runs with the same permissions as the user
- API calls use the configured API URL
- Consider authentication for production use
- Review tool permissions before exposing sensitive operations

## License

Same as parent project.

