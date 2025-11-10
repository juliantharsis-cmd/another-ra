# Quick Start Guide - API Integration

This guide will help you set up and run the API server alongside the Next.js frontend.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

## Setup Steps

### 1. Install API Server Dependencies

```bash
cd server
npm install
```

### 2. Start the API Server

In the `server` directory:

```bash
npm run dev
```

The API server will start on `http://localhost:3001`

You should see:
```
🚀 API Server running on http://localhost:3001
📋 Health check: http://localhost:3001/health
📊 Companies API: http://localhost:3001/api/companies
```

### 3. Start the Frontend

In the project root directory:

```bash
npm run dev
```

The frontend will start on `http://localhost:3000`

### 4. Verify the Connection

1. Open `http://localhost:3000/spaces/system-config/companies`
2. You should see the companies table loading data from the API
3. Check the browser console for any errors

## Testing the API

### Using Browser

Visit `http://localhost:3001/api/companies` to see all companies in JSON format.

### Using curl

```bash
# Get all companies
curl http://localhost:3001/api/companies

# Get health status
curl http://localhost:3001/health
```

## Troubleshooting

### API Server Not Starting

- Check if port 3001 is already in use
- Verify Node.js version: `node --version` (should be 18+)
- Check for errors in the terminal

### Frontend Can't Connect to API

- Ensure the API server is running on port 3001
- Check browser console for CORS errors
- Verify `NEXT_PUBLIC_API_URL` is set correctly (defaults to `http://localhost:3001/api`)

### CORS Errors

The API server has CORS enabled by default. If you still see CORS errors:
- Check that the API server is running
- Verify the API URL in the frontend matches the server URL

## Next Steps

- See `docs/api-integration-guide.md` for detailed API documentation
- See `server/README.md` for API server details
- To migrate to PostgreSQL, follow the guide in `docs/api-integration-guide.md`

## Development Workflow

1. **Terminal 1**: Run API server (`cd server && npm run dev`)
2. **Terminal 2**: Run frontend (`npm run dev`)
3. Make changes to either frontend or backend
4. Both servers support hot-reload during development

## Environment Variables

### Frontend (.env.local)

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Backend (server/.env)

Create `server/.env`:

```env
PORT=3001
NODE_ENV=development
```

