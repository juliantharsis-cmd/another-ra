# AI Context Awareness - How It Works

## Overview

The chatbot is made context-aware by automatically detecting the user's current page and including that information as a **system message** in every AI request. This allows the AI to understand what the user is viewing and provide relevant, contextual responses.

## Architecture Flow

```
┌─────────────────┐
│  User on Page   │
│  /spaces/system-│
│  config/companies│
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  usePathname() Hook              │
│  Gets current route:             │
│  "/spaces/system-config/companies"│
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  gatherPageContext(pathname)    │
│  Analyzes pathname and extracts: │
│  - Space: "system-config"        │
│  - Table: "companies"            │
│  - Page Type: "list"             │
│  - Page Title: "Companies"      │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  formatContextAsSystemMessage() │
│  Creates compact system message:│
│  "AI assistant... | Space:     │
│  System Config | Page: Companies│
│  (list) | Viewing: Companies    │
│  list | Route: /spaces/..."     │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  AI Request                     │
│  messages: [                     │
│    { role: "system",            │
│      content: "AI assistant..." │
│    },                            │
│    { role: "user",              │
│      content: "What can I do?"  │
│    }                             │
│  ]                               │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  AI Provider (Claude/OpenAI)    │
│  Receives context + question    │
│  Understands user is on:        │
│  - Companies table               │
│  - List view                     │
│  - System Config space           │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Contextual Response             │
│  "You're viewing the Companies  │
│  list in System Configuration.  │
│  You can filter, search, or     │
│  click a row to view details..."│
└─────────────────────────────────┘
```

## Step-by-Step Breakdown

### Step 1: Pathname Detection

The chatbot uses Next.js's `usePathname()` hook to get the current route:

```typescript
const pathname = usePathname()
// Example: "/spaces/system-config/companies"
```

### Step 2: Context Gathering

The `gatherPageContext()` function analyzes the pathname using multiple helper functions:

```typescript
export function gatherPageContext(pathname: string, userId?: string): PageContext {
  const space = detectSpace(pathname)           // "system-config"
  const tableName = extractTableName(pathname)  // "companies"
  const entityId = extractEntityId(pathname)     // undefined (no ID = list view)
  const pageType = detectPageType(pathname)      // "list"
  const pageTitle = getPageTitle(pathname, space) // "Companies"
  
  return {
    pathname: "/spaces/system-config/companies",
    route: "/spaces/system-config/companies",
    space: "system-config",
    pageTitle: "Companies",
    pageType: "list",
    tableName: "companies",
    entityId: undefined,
    userId: "user123"
  }
}
```

#### Helper Functions Explained

**1. `detectSpace(pathname)`**
```typescript
// Checks pathname prefix to determine space
if (pathname.startsWith('/spaces/system-config')) return 'system-config'
if (pathname.startsWith('/spaces/admin')) return 'admin'
// ... etc
```

**2. `extractTableName(pathname)`**
```typescript
// Uses regex to extract table name from path
const match = pathname.match(/\/spaces\/[^/]+\/([^/]+)/)
// "/spaces/system-config/companies" → "companies"
```

**3. `extractEntityId(pathname)`**
```typescript
// Detects if viewing a specific record
// "/spaces/system-config/companies/123" → "123"
// "/spaces/system-config/companies" → undefined
```

**4. `detectPageType(pathname)`**
```typescript
// Determines if list, detail, dashboard, etc.
if (pathname.match(/\/[^/]+\/[^/]+$/)) return 'detail'  // Has ID
if (pathname.match(/\/spaces\/[^/]+\/[^/]+$/)) return 'list'  // Table page
```

### Step 3: Context Formatting

The context is formatted into a compact system message optimized for tokens:

```typescript
export function formatContextAsSystemMessage(context: PageContext): string {
  // Input: { space: "system-config", tableName: "companies", pageType: "list", ... }
  
  // Output: "AI assistant for application navigation and data understanding. | 
  //          Space: System Config | Page: Companies (list) | 
  //          Viewing: Companies list | Route: /spaces/system-config/companies | 
  //          Help: navigation, data questions, feature guidance, table references."
}
```

**Why pipe-separated format?**
- More token-efficient than line breaks
- Easier for AI to parse
- Compact but readable

### Step 4: Memoization (Performance Optimization)

Context is memoized to avoid recalculation on every render:

```typescript
// Only recalculates when pathname changes
const pageContext = useMemo(() => {
  const userId = localStorage.getItem('userId')
  return gatherPageContext(pathname, userId)
}, [pathname])

// Only reformats when context changes
const contextMessage = useMemo(() => 
  formatContextAsSystemMessage(pageContext), 
  [pageContext]
)
```

### Step 5: System Message Injection

When sending a message, the context is included as a system message:

```typescript
const handleSend = async () => {
  // Check if context needs updating (pathname changed)
  const needsContextUpdate = contextSentRef.current !== pathname
  
  if (needsContextUpdate) {
    // Remove old system message, add new one
    const messagesWithoutSystem = messageHistory.filter(m => m.role !== 'system')
    messagesToSend = [
      { role: 'system', content: contextMessage },  // ← Context injected here
      ...messagesWithoutSystem,
      userMessage
    ]
    contextSentRef.current = pathname  // Track that we've sent context
  } else {
    // Context already sent for this pathname, just add user message
    messagesToSend = [...messageHistory, userMessage]
  }
  
  // Send to AI provider
  await aiClient.chat({ messages: messagesToSend, ... })
}
```

## Example Scenarios

### Scenario 1: User on Companies List Page

**Pathname:** `/spaces/system-config/companies`

**Context Detected:**
```json
{
  "space": "system-config",
  "tableName": "companies",
  "pageType": "list",
  "pageTitle": "Companies",
  "entityId": undefined
}
```

**System Message:**
```
AI assistant for application navigation and data understanding. | 
Space: System Config | Page: Companies (list) | 
Viewing: Companies list | Route: /spaces/system-config/companies | 
Help: navigation, data questions, feature guidance, table references.
```

**User Question:** "What can I do here?"

**AI Response:** "You're viewing the Companies list in System Configuration. You can filter companies, search for specific ones, or click a row to view details. Would you like help with filtering or searching?"

### Scenario 2: User on Company Detail Page

**Pathname:** `/spaces/system-config/companies/abc123`

**Context Detected:**
```json
{
  "space": "system-config",
  "tableName": "companies",
  "pageType": "detail",
  "pageTitle": "Companies",
  "entityId": "abc123"
}
```

**System Message:**
```
AI assistant for application navigation and data understanding. | 
Space: System Config | Page: Companies (detail) | 
Viewing: Companies record abc123 | Route: /spaces/system-config/companies/abc123 | 
Help: navigation, data questions, feature guidance, table references.
```

**User Question:** "Tell me about this record"

**AI Response:** "You're viewing a specific company record (ID: abc123) in the Companies table. I can help you understand the fields displayed, navigate to related records, or explain what actions you can take on this record."

### Scenario 3: User Navigates During Conversation

**Initial Pathname:** `/spaces/system-config/companies`
- Context sent: "Viewing: Companies list"

**User asks:** "How do I filter?"

**User navigates to:** `/spaces/admin/application-list`
- Context automatically updates: "Viewing: Application List list"
- Old system message removed, new one added

**User asks:** "What's this page?"

**AI Response:** "You're now viewing the Application List in the Administration space. This page shows all configured applications in the system..."

## Key Features

### 1. Automatic Context Detection
- No manual configuration needed
- Works with any route structure
- Extracts information from URL patterns

### 2. Dynamic Updates
- Context updates when user navigates
- Old context removed, new context added
- Tracks pathname to avoid duplicate system messages

### 3. Token Optimization
- Compact format (~150-200 tokens vs ~300)
- Pipe-separated for efficiency
- Abbreviated space names

### 4. Performance Optimized
- Memoized context gathering
- Only recalculates on pathname change
- Fast string operations (< 1ms)

## How AI Uses the Context

The system message tells the AI:

1. **Where the user is:** Space and page information
2. **What they're viewing:** Table name and view type (list/detail)
3. **What they can do:** Capabilities and available actions
4. **How to help:** Guidance on providing relevant assistance

This allows the AI to:
- Answer questions about the current page
- Provide navigation guidance
- Explain available features
- Reference specific tables and data
- Give context-aware responses

## Extending Context Awareness

### Future Enhancements

1. **Data Context:** Include actual data from the page
   ```typescript
   // Could add:
   currentRecord?: Record<string, any>
   visibleColumns?: string[]
   filters?: FilterState
   ```

2. **User Actions:** Track recent actions
   ```typescript
   // Could add:
   recentActions?: string[]
   lastAction?: string
   ```

3. **Page State:** Include UI state
   ```typescript
   // Could add:
   isFiltered?: boolean
   sortOrder?: string
   selectedItems?: string[]
   ```

4. **Available Actions:** List what user can do
   ```typescript
   // Could add:
   availableActions?: string[]
   permissions?: string[]
   ```

## Technical Details

### Context Update Logic

```typescript
// Track which pathname we've sent context for
const contextSentRef = useRef<string | null>(null)

// Check if pathname changed
const needsContextUpdate = contextSentRef.current !== pathname

if (needsContextUpdate) {
  // Remove old system message, add new one
  const messagesWithoutSystem = messageHistory.filter(m => m.role !== 'system')
  messagesToSend = [
    { role: 'system', content: contextMessage },
    ...messagesWithoutSystem,
    userMessage
  ]
  contextSentRef.current = pathname  // Remember we sent it
}
```

### Message History Management

```typescript
// Limit to prevent token bloat
const MAX_MESSAGES = 20
if (messagesToSend.length > MAX_MESSAGES + 1) {
  const systemMsg = messagesToSend.find(m => m.role === 'system')
  const nonSystemMessages = messagesToSend.filter(m => m.role !== 'system')
  const recentMessages = nonSystemMessages.slice(-MAX_MESSAGES)
  messagesToSend = systemMsg ? [systemMsg, ...recentMessages] : recentMessages
}
```

## Summary

The context-aware system works by:

1. **Detecting** the current page from the URL pathname
2. **Extracting** relevant information (space, table, page type, etc.)
3. **Formatting** it into a compact system message
4. **Injecting** it into every AI request as a system message
5. **Updating** automatically when the user navigates

This gives the AI full awareness of what the user is viewing, enabling contextual, relevant responses without requiring the user to explain their current location.

