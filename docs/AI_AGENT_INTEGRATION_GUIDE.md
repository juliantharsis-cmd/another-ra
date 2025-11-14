# AI Agent Integration - Code Structure & Documentation

## Overview

The AI Agent Integration system personalizes AI responses based on user-specific preferences (tone, detail level, domain focus, etc.). It integrates seamlessly with the existing AI chat system (Anthropic Claude, OpenAI, Google Gemini) and injects user preferences as system prompts.

---

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (User)                          │
│  - AIChatInterface.tsx                                      │
│  - WelcomeDashboard.tsx                                     │
│  - UserPreferencesModal.tsx (AI Agent Profile Section)      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP Request (with userId)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Frontend API Client                            │
│  - src/lib/ai/client.ts                                     │
│    • Retrieves userId from localStorage/sessionStorage      │
│    • Includes userId in chat request                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ POST /api/ai/chat { userId, ... }
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend API Route                             │
│  - server/src/routes/aiRoutes.ts                           │
│    • Receives userId from request body                      │
│    • Passes userId to AIService                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ AIService.chat({ userId, ... })
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              AI Service                                    │
│  - server/src/services/AIService.ts                        │
│    • Routes to provider-specific handler                    │
│    • Calls injectUserProfile() before sending to AI         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ injectUserProfile(messages, userId)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         AI Agent Profile Service                            │
│  - server/src/services/AIAgentProfileService.ts            │
│    • Fetches user profile from Preferences system           │
│    • Returns merged profile (user + defaults)               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ profileToSystemPrompt(profile)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         Profile to System Prompt                           │
│  - server/src/types/AIAgentProfile.ts                      │
│    • Converts profile object to natural language           │
│    • Generates system message instructions                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Merged into messages array
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              AI Provider (Gemini/Claude/OpenAI)            │
│  • Receives messages with personalized system prompt        │
│  • Generates response based on user preferences             │
└─────────────────────────────────────────────────────────────┘
```

---

## Code Structure

### 1. **Type Definitions**

**File**: `server/src/types/AIAgentProfile.ts`

**Purpose**: Defines the AI Agent Profile data structure and utility functions.

**Key Components**:
```typescript
interface AIAgentProfile {
  tone?: 'analytical' | 'conversational' | 'professional' | 'friendly' | 'technical' | 'concise'
  detailLevel?: 'low' | 'medium' | 'high'
  responseStyle?: 'concise' | 'detailed' | 'balanced'
  domainFocus?: 'sustainability_data' | 'energy_data' | 'carbon_emissions' | 'compliance' | 'general' | 'financial' | 'operations'
  customInstructions?: string
  includeReasoning?: boolean
  outputFormat?: 'paragraph' | 'bullet_points' | 'structured' | 'mixed'
  language?: string
}

// Default profile (used when user has no custom profile)
const DEFAULT_AI_AGENT_PROFILE: Required<AIAgentProfile>

// Merges user profile with defaults
function mergeWithDefaults(profile?: Partial<AIAgentProfile>): Required<AIAgentProfile>

// Converts profile object to natural language system prompt
function profileToSystemPrompt(profile: Required<AIAgentProfile>): string
```

**What it does**:
- Defines all possible profile settings
- Provides default values when user hasn't configured preferences
- Converts profile settings into natural language instructions for the AI
- Example output: "You are an AI assistant with an analytical tone. Provide high-detail responses focused on sustainability_data. Use structured output format..."

---

### 2. **Backend Service**

**File**: `server/src/services/AIAgentProfileService.ts`

**Purpose**: Manages CRUD operations for AI Agent Profiles using the Preferences system.

**Key Methods**:
```typescript
class AIAgentProfileService {
  // Get user's profile (returns defaults if none exists)
  async getProfile(userId: string): Promise<Required<AIAgentProfile>>
  
  // Save user's profile
  async saveProfile(userId: string, profile: Partial<AIAgentProfile>): Promise<void>
  
  // Delete user's profile (revert to defaults)
  async deleteProfile(userId: string): Promise<void>
  
  // Validates profile data
  private validateProfile(profile: Partial<AIAgentProfile>): Partial<AIAgentProfile>
}
```

**What it does**:
- Stores profiles in Airtable via the Preferences system (namespace: 'ai', key: 'agentProfile')
- Validates profile data (ensures valid enum values, sanitizes strings)
- Merges user preferences with defaults
- Handles errors gracefully (returns defaults if profile fetch fails)

**Storage**: Uses `PreferencesService` with:
- Namespace: `'ai'`
- Key: `'agentProfile'`
- Type: `'json'` (stores profile as JSON object)

---

### 3. **Backend API Routes**

**File**: `server/src/routes/aiAgentProfileRoutes.ts`

**Purpose**: REST API endpoints for managing AI Agent Profiles.

**Endpoints**:
```
GET    /api/ai-agent-profile/:userId    - Get user's profile
POST   /api/ai-agent-profile/:userId    - Save user's profile
DELETE /api/ai-agent-profile/:userId    - Delete user's profile
```

**What it does**:
- Provides HTTP API for frontend to manage profiles
- Validates userId parameter
- Handles errors and returns appropriate HTTP status codes
- Lazy-loads service to avoid errors if Airtable not configured

---

### 4. **Frontend API Client**

**File**: `src/lib/api/aiAgentProfile.ts`

**Purpose**: Frontend TypeScript client for AI Agent Profile API.

**Key Methods**:
```typescript
class AIAgentProfileApiClient {
  // Get profile (auto-detects userId from localStorage)
  async getProfile(userId?: string): Promise<AIAgentProfile>
  
  // Save profile (auto-detects userId from localStorage)
  async saveProfile(profile: Partial<AIAgentProfile>, userId?: string): Promise<void>
  
  // Delete profile (auto-detects userId from localStorage)
  async deleteProfile(userId?: string): Promise<void>
}
```

**What it does**:
- Provides type-safe API client for frontend
- Auto-detects userId from `localStorage` or `sessionStorage`
- Falls back to `'default-user'` if no userId found
- Handles HTTP errors gracefully

**Usage**:
```typescript
import { aiAgentProfileApi } from '@/lib/api/aiAgentProfile'

// Get profile
const profile = await aiAgentProfileApi.getProfile()

// Save profile
await aiAgentProfileApi.saveProfile({
  tone: 'analytical',
  detailLevel: 'high',
  domainFocus: 'sustainability_data'
})
```

---

### 5. **Frontend UI Component**

**File**: `src/components/AIAgentProfileSection.tsx`

**Purpose**: React component for editing AI Agent Profile in User Preferences modal.

**What it does**:
- Renders form fields for all profile settings
- Loads current profile on mount
- Saves profile when user clicks "Save"
- Provides dropdowns for enum fields (tone, detailLevel, etc.)
- Includes textarea for custom instructions

**Integration**: Used in `UserPreferencesModal.tsx` as a collapsible section.

---

### 6. **AI Service Integration**

**File**: `server/src/services/AIService.ts`

**Purpose**: Main AI service that routes requests to providers and injects user profiles.

**Key Method**:
```typescript
class AIService {
  // Injects user profile into messages as system prompt
  private async injectUserProfile(
    messages: ChatMessage[], 
    userId?: string
  ): Promise<ChatMessage[]>
  
  // Routes to provider-specific handler (Anthropic, OpenAI, Google)
  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>
}
```

**What it does**:
1. **Receives chat request** with optional `userId`
2. **Calls `injectUserProfile()`** before sending to AI provider:
   - Fetches user's profile from `AIAgentProfileService`
   - Converts profile to system prompt using `profileToSystemPrompt()`
   - Merges with existing system message or adds new one
3. **Sends enhanced messages** to AI provider (Gemini/Claude/OpenAI)
4. **Returns personalized response**

**Profile Injection Logic**:
- If `userId` is provided → fetch profile → inject as system message
- If `userId` is missing → skip injection → use default AI behavior
- If profile service unavailable → skip injection → use default AI behavior
- If user has no custom profile → use default profile → still inject (for consistency)

**Provider-Specific Integration**:
- **Google Gemini** (`chatGoogle`): Profile injected before API call
- **Anthropic Claude** (`chatAnthropic`): Profile injected before API call
- **OpenAI** (`chatOpenAI`): Profile injected before API call

---

### 7. **Frontend AI Client**

**File**: `src/lib/ai/client.ts`

**Purpose**: Frontend client for making AI chat requests.

**Key Method**:
```typescript
class AIClient {
  async chat(
    options: ChatCompletionOptions, 
    integrationId?: string
  ): Promise<ChatCompletionResponse>
}
```

**What it does**:
- Retrieves `userId` from `localStorage` or `sessionStorage` if not provided
- Includes `userId` in request body when calling `/api/ai/chat`
- Logs userId for debugging
- Updates integration `lastUsed` timestamp on success

**Usage**:
```typescript
import { aiClient } from '@/lib/ai/client'

const response = await aiClient.chat({
  providerId: 'google',
  apiKey: '...',
  model: 'gemini-1.5-flash',
  messages: [{ role: 'user', content: 'Hello' }],
  userId: 'user-123' // Optional - auto-detected if not provided
})
```

---

### 8. **Frontend Chat Components**

**Files**:
- `src/components/AIChatInterface.tsx` - Main chat interface
- `src/components/WelcomeDashboard.tsx` - Welcome page with AI analysis

**What they do**:
- Use `aiClient.chat()` to send messages
- Automatically include `userId` from localStorage
- Display AI responses with typewriter effect
- Handle context awareness (gather page context, inject as system message)

**Context Awareness**:
- `src/lib/ai/context.ts` - Gathers page context (current page, table data, etc.)
- Formats context as system message
- Injected alongside user profile

---

## Data Flow Example

### Example: User asks "What are the top 5 emission factors?"

1. **Frontend** (`AIChatInterface.tsx`):
   ```typescript
   // User types message
   const message = "What are the top 5 emission factors?"
   
   // Get userId from localStorage
   const userId = localStorage.getItem('userId') // e.g., "user-123"
   
   // Call AI client
   await aiClient.chat({
     providerId: 'google',
     apiKey: integration.apiKey,
     model: 'gemini-1.5-flash',
     messages: [{ role: 'user', content: message }],
     userId // Included automatically
   })
   ```

2. **Backend Route** (`aiRoutes.ts`):
   ```typescript
   // Receives request
   POST /api/ai/chat
   {
     providerId: 'google',
     messages: [...],
     userId: 'user-123' // From request body
   }
   
   // Passes to AIService
   aiService.chat({ userId: 'user-123', ... })
   ```

3. **AI Service** (`AIService.ts`):
   ```typescript
   // Before sending to Gemini:
   const messagesWithProfile = await injectUserProfile(messages, 'user-123')
   
   // injectUserProfile() does:
   // 1. Fetches profile from AIAgentProfileService
   // 2. Converts to system prompt: "You are an AI assistant with analytical tone..."
   // 3. Merges with existing system messages
   // 4. Returns enhanced messages array
   ```

4. **Profile Service** (`AIAgentProfileService.ts`):
   ```typescript
   // Fetches from Preferences system
   const profile = await preferencesService.get('user-123', 'agentProfile', 'ai')
   
   // Returns merged profile:
   {
     tone: 'analytical',
     detailLevel: 'high',
     domainFocus: 'sustainability_data',
     // ... other settings
   }
   ```

5. **Profile to Prompt** (`AIAgentProfile.ts`):
   ```typescript
   // Converts profile to natural language
   const systemPrompt = profileToSystemPrompt(profile)
   
   // Output:
   "You are an AI assistant with an analytical tone. 
    Provide high-detail responses focused on sustainability_data. 
    Use structured output format with bullet points. 
    Include reasoning for your answers..."
   ```

6. **Final Messages Array**:
   ```typescript
   [
     {
       role: 'system',
       content: 'You are an AI assistant with an analytical tone...' // Profile instructions
     },
     {
       role: 'system',
       content: 'Current page: Emission Factors table...' // Context awareness
     },
     {
       role: 'user',
       content: 'What are the top 5 emission factors?'
     }
   ]
   ```

7. **AI Provider** (Google Gemini):
   - Receives personalized messages
   - Generates response based on:
     - User's tone preference (analytical)
     - Detail level (high)
     - Domain focus (sustainability_data)
     - Page context (Emission Factors table)

---

## Key Files Summary

### Backend
| File | Purpose |
|------|---------|
| `server/src/types/AIAgentProfile.ts` | Type definitions, defaults, prompt conversion |
| `server/src/services/AIAgentProfileService.ts` | CRUD operations for profiles |
| `server/src/routes/aiAgentProfileRoutes.ts` | REST API endpoints |
| `server/src/services/AIService.ts` | Main AI service with profile injection |
| `server/src/routes/aiRoutes.ts` | AI chat API route |

### Frontend
| File | Purpose |
|------|---------|
| `src/lib/api/aiAgentProfile.ts` | Frontend API client |
| `src/lib/ai/client.ts` | AI chat client (includes userId) |
| `src/components/AIAgentProfileSection.tsx` | UI component for editing profile |
| `src/components/AIChatInterface.tsx` | Main chat interface |
| `src/components/WelcomeDashboard.tsx` | Welcome page with AI analysis |
| `src/lib/ai/context.ts` | Context awareness (page context gathering) |

---

## Storage

**Location**: Airtable "User Preferences" table

**Structure**:
- Namespace: `'ai'`
- Key: `'agentProfile'`
- Type: `'json'`
- Value: JSON object with profile settings

**Example Airtable Record**:
```
User Id: "user-123"
Namespace: "ai"
Key: "agentProfile"
Type: "json"
Value (text): '{"tone":"analytical","detailLevel":"high","domainFocus":"sustainability_data"}'
```

---

## Default Profile

When a user has no custom profile, the system uses:

```typescript
{
  tone: 'professional',
  detailLevel: 'medium',
  responseStyle: 'balanced',
  domainFocus: 'general',
  customInstructions: '',
  includeReasoning: false,
  outputFormat: 'paragraph',
  language: 'en'
}
```

This default profile is still injected as a system message for consistency.

---

## Integration Points

### 1. **User Preferences Modal**
- Location: `src/components/UserPreferencesModal.tsx`
- Includes: `AIAgentProfileSection` component
- Allows users to configure their AI preferences

### 2. **Chat Interfaces**
- `AIChatInterface.tsx` - Sidebar chatbot
- `WelcomeDashboard.tsx` - Welcome page AI analysis
- Both automatically include `userId` in requests

### 3. **AI Providers**
- Google Gemini: Profile injected via `chatGoogle()`
- Anthropic Claude: Profile injected via `chatAnthropic()`
- OpenAI: Profile injected via `chatOpenAI()`

---

## Debugging

### Enable Debug Logging

The system includes extensive logging:

1. **Frontend** (`src/lib/ai/client.ts`):
   - Logs when userId is found/missing
   - Logs localStorage/sessionStorage values

2. **Backend Route** (`server/src/routes/aiRoutes.ts`):
   - Logs when userId is received
   - Warns if userId is missing

3. **AI Service** (`server/src/services/AIService.ts`):
   - Logs profile injection attempts
   - Logs custom vs default profile usage
   - Logs profile instructions preview

### Check Logs

Look for these log messages:
- `🔍 [AIClient] Making AI call with userId: ...`
- `🔍 [AI Route] Received AI chat request with userId: ...`
- `🤖 [AI Agent Profile] Injecting custom profile for user ...`
- `📋 [AI Agent Profile] Profile instructions preview: ...`

---

## Testing

### Test Profile Injection

1. **Set userId**:
   ```javascript
   localStorage.setItem('userId', 'test-user-123')
   ```

2. **Save a profile**:
   ```javascript
   import { aiAgentProfileApi } from '@/lib/api/aiAgentProfile'
   await aiAgentProfileApi.saveProfile({
     tone: 'analytical',
     detailLevel: 'high'
   })
   ```

3. **Make a chat request**:
   - Open chatbot
   - Send a message
   - Check server logs for profile injection

4. **Verify response**:
   - Response should reflect your tone/detail level preferences

---

## Future Enhancements

Potential improvements:
- Profile templates (presets for different use cases)
- Profile sharing between users
- Profile versioning/history
- A/B testing different profiles
- Profile analytics (which settings produce best results)

---

## Troubleshooting

### Profile Not Being Applied

1. **Check userId**:
   - Verify `localStorage.getItem('userId')` returns a value
   - Check browser console for userId logs

2. **Check Profile Exists**:
   - Call `aiAgentProfileApi.getProfile()` to verify profile is saved
   - Check Airtable "User Preferences" table

3. **Check Server Logs**:
   - Look for profile injection logs
   - Check for errors in `AIAgentProfileService`

4. **Check Namespace**:
   - Verify 'ai' namespace exists in Airtable Preferences table
   - Run schema update script if needed

---

## Summary

The AI Agent Integration system:
1. ✅ Stores user preferences in Airtable (via Preferences system)
2. ✅ Retrieves preferences when making AI requests
3. ✅ Converts preferences to natural language instructions
4. ✅ Injects instructions as system messages
5. ✅ Personalizes AI responses based on user preferences
6. ✅ Works seamlessly with all AI providers (Gemini, Claude, OpenAI)
7. ✅ Falls back gracefully if profile unavailable
8. ✅ Provides UI for users to configure preferences

The system is **fully functional** and **production-ready**.

