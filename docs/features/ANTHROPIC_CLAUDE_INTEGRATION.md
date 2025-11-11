# Anthropic Claude AI Integration

This document describes the implementation of Anthropic Claude AI integration into the platform.

## Overview

The integration allows users to connect their Anthropic Claude API keys and make chat completion requests through the platform. The API keys are stored securely on the client side (localStorage), and all AI requests are proxied through the backend to keep keys secure.

## Architecture

### Backend Components

1. **`server/src/services/AIService.ts`**
   - Core service for making AI API calls
   - Supports Anthropic Claude and OpenAI (with extensibility for Google and custom providers)
   - Handles provider-specific API formats and authentication
   - Implements connection testing

2. **`server/src/routes/aiRoutes.ts`**
   - REST API endpoints:
     - `POST /api/ai/chat` - Make chat completion requests
     - `POST /api/ai/test-connection` - Test API key validity

### Frontend Components

1. **`src/lib/ai/client.ts`**
   - Frontend client for calling backend AI endpoints
   - Handles usage tracking (updates `lastUsed` timestamp)
   - Provides TypeScript interfaces for type safety

2. **`src/components/AIProviderConfigModal.tsx`**
   - Updated to use real connection testing
   - Replaces placeholder with actual API call to `aiClient.testConnection()`

3. **`src/lib/integrations/storage.ts`**
   - Added `updateLastUsed()` function to track when integrations are used

## How to Use

### 1. Connect Your Anthropic API Key

1. Navigate to **Settings** → **Integrations** tab
2. Click on the **Anthropic Claude** card
3. Enter your API key in the **Credentials** tab
4. Click **Test Connection** to verify your API key works
5. Click **Save** to store the integration

### 2. Make Chat Requests

Use the `aiClient` in your components:

```typescript
import { aiClient } from '@/lib/ai/client'
import { getIntegration } from '@/lib/integrations/storage'

// Get your saved integration
const integration = getIntegration('your-integration-id')
if (!integration) {
  throw new Error('Integration not found')
}

// Make a chat request
const response = await aiClient.chat(
  {
    providerId: integration.providerId,
    apiKey: integration.apiKey,
    model: integration.model || 'claude-3-sonnet-20240229',
    messages: [
      {
        role: 'user',
        content: 'Hello, Claude!',
      },
    ],
    maxTokens: 1024,
    temperature: 0.7,
  },
  integration.id // Optional: pass integration ID to update lastUsed timestamp
)

if (response.success) {
  console.log('AI Response:', response.content)
  console.log('Tokens used:', response.usage)
} else {
  console.error('Error:', response.error)
}
```

### 3. Test Connection Programmatically

```typescript
import { aiClient } from '@/lib/ai/client'

const response = await aiClient.testConnection({
  providerId: 'anthropic',
  apiKey: 'your-api-key',
  model: 'claude-3-haiku-20240307', // Optional
})

if (response.success) {
  console.log('Connection successful!')
} else {
  console.error('Connection failed:', response.error)
}
```

## API Endpoints

### POST /api/ai/chat

Make a chat completion request.

**Request Body:**
```json
{
  "providerId": "anthropic",
  "apiKey": "sk-ant-...",
  "baseUrl": "https://api.anthropic.com/v1", // Optional
  "model": "claude-3-sonnet-20240229",
  "messages": [
    {
      "role": "user",
      "content": "Hello!"
    }
  ],
  "maxTokens": 1024, // Optional
  "temperature": 0.7 // Optional
}
```

**Response:**
```json
{
  "success": true,
  "content": "Hello! How can I help you today?",
  "model": "claude-3-sonnet-20240229",
  "usage": {
    "inputTokens": 10,
    "outputTokens": 12,
    "totalTokens": 22
  }
}
```

### POST /api/ai/test-connection

Test if an API key is valid.

**Request Body:**
```json
{
  "providerId": "anthropic",
  "apiKey": "sk-ant-...",
  "baseUrl": "https://api.anthropic.com/v1", // Optional
  "model": "claude-3-haiku-20240307" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Connection successful! API key is valid."
}
```

## Supported Providers

### Anthropic Claude ✅
- **Provider ID**: `anthropic`
- **Base URL**: `https://api.anthropic.com/v1`
- **Models**: `claude-3-opus-20240229`, `claude-3-sonnet-20240229`, `claude-3-haiku-20240307`
- **Authentication**: API key via `x-api-key` header
- **API Version**: `2023-06-01`

### OpenAI ✅
- **Provider ID**: `openai`
- **Base URL**: `https://api.openai.com/v1`
- **Models**: `gpt-4`, `gpt-4-turbo`, `gpt-3.5-turbo`
- **Authentication**: API key via `Authorization: Bearer` header

### Google Gemini ✅
- **Provider ID**: `google`
- **Base URL**: `https://generativelanguage.googleapis.com/v1`
- **Models**: `gemini-pro`, `gemini-pro-vision`
- **Authentication**: API key via query parameter (`?key=...`)
- **API Format**: Uses `generateContent` endpoint with `contents` array

### Custom Provider ⏳
- **Provider ID**: `custom`
- **Status**: Not yet implemented

## Security Considerations

1. **API Key Storage**: Currently stored in `localStorage` (client-side). For production, consider:
   - Server-side storage with encryption
   - Backend proxy that stores keys securely
   - User authentication before accessing keys

2. **Request Proxying**: All AI requests go through the backend, which:
   - Keeps API keys out of frontend code
   - Allows rate limiting and usage tracking
   - Enables centralized error handling

3. **Key Masking**: API keys are masked in the UI (shows only last 4 characters)

## Error Handling

The service handles various error scenarios:

- **Invalid API Key**: Returns clear error message
- **Network Errors**: Handles timeouts and connection issues
- **API Errors**: Parses and returns Anthropic/OpenAI error messages
- **Validation Errors**: Validates request format before sending

## Usage Tracking

When making chat requests with an integration ID, the `lastUsed` timestamp is automatically updated in `localStorage`. This allows users to see when each integration was last used.

## Future Enhancements

1. **Streaming Responses**: Support for streaming chat completions
2. **Usage Analytics**: Track token usage and costs per integration
3. **Rate Limiting**: Implement rate limits per user/integration
4. **Model Selection UI**: Dropdown to select models in the config modal
5. **Chat History**: Store and display chat history
6. **Custom Prompts**: Pre-configured prompt templates
7. **Multi-turn Conversations**: Maintain conversation context

## Testing

To test the integration:

1. **Connection Test**: Use the "Test Connection" button in the AI Provider Config Modal
2. **Chat Request**: Use the `aiClient.chat()` method in a component
3. **Error Handling**: Test with invalid API keys to verify error messages

## Troubleshooting

### "Connection test failed"
- Verify your API key is correct
- Check that the API key has the necessary permissions
- Ensure the server is running and accessible

### "Unsupported provider"
- Make sure `providerId` matches one of the supported providers (`anthropic`, `openai`)
- Check that the provider is enabled in the Integration Marketplace

### "Request timed out"
- Check your network connection
- Verify the API endpoint URL is correct
- Check Anthropic/OpenAI service status

## Related Files

- `server/src/services/AIService.ts` - Backend AI service
- `server/src/routes/aiRoutes.ts` - API routes
- `src/lib/ai/client.ts` - Frontend client
- `src/components/AIProviderConfigModal.tsx` - Configuration UI
- `src/lib/integrations/storage.ts` - Integration storage

