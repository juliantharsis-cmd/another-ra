# MCP Server Quick Start

## Installation

```bash
cd mcp-server
npm install
```

## Configuration

1. Create `.env` file:
```bash
cp .env.example .env
```

2. Edit `.env` and set:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Build

```bash
npm run build
```

## Run

```bash
npm start
```

## Connect to Claude Desktop

### Windows
Edit: `%APPDATA%\Claude\claude_desktop_config.json`

### macOS
Edit: `~/Library/Application Support/Claude/claude_desktop_config.json`

Add:
```json
{
  "mcpServers": {
    "another-ra": {
      "command": "node",
      "args": ["C:/full/path/to/another-ra/mcp-server/dist/index.js"],
      "env": {
        "NEXT_PUBLIC_API_URL": "http://localhost:3001/api"
      }
    }
  }
}
```

**Important**: Use the full absolute path to `index.js`

## Test

1. Make sure your API server is running (`cd server && npm run dev`)
2. Start the MCP server (`cd mcp-server && npm start`)
3. Open Claude Desktop
4. Try asking: "List all tables in the system"

## Troubleshooting

- **Server won't start**: Check that port 3001 is available
- **Tools not working**: Verify API server is running
- **Claude can't connect**: Check file path in config is absolute

