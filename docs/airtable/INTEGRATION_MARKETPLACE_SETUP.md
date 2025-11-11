# Integration Marketplace Airtable Table Setup Guide

## Quick Setup Steps

### 1. Create the Table

1. Go to your Airtable base (System Configuration space)
2. Click **"Add a table"** or use the **"+"** button
3. Name the table: **"Integration Marketplace"**

### 2. Create Fields

Add the following fields in order:

| Field Name | Field Type | Options/Configuration | Required |
|------------|------------|----------------------|----------|
| **Name** | Single line text | - | ✓ Yes |
| **Provider ID** | Single line text | - | ✓ Yes |
| **Description** | Long text | - | ✓ Yes |
| **Icon** | Single line text | - | No |
| **Category** | Single select | Options: `llm`, `vision`, `speech`, `custom` | ✓ Yes |
| **Auth Type** | Single select | Options: `api_key`, `pat`, `oauth`, `custom` | ✓ Yes |
| **Base URL** | URL | - | No |
| **Documentation URL** | URL | - | No |
| **Supported Models** | Long text | (comma-separated list) | No |
| **Default Model** | Single line text | - | No |
| **Features** | Long text | (comma-separated list) | No |
| **Enabled** | Checkbox | Default: checked | ✓ Yes |
| **Sort Order** | Number | Format: Integer | No |

### 3. Field Configuration Details

#### Category Field (Single select)
Options to add:
- `llm`
- `vision`
- `speech`
- `custom`

#### Auth Type Field (Single select)
Options to add:
- `api_key`
- `pat`
- `oauth`
- `custom`

#### Enabled Field (Checkbox)
- Default value: Checked (true)
- This controls whether the provider appears in the marketplace

#### Sort Order Field (Number)
- Format: Integer
- Lower numbers appear first
- Use this to control the display order

### 4. Create Initial Records

Create the following records to get started:

#### Record 1: OpenAI
```
Name: OpenAI
Provider ID: openai
Description: GPT-4, GPT-3.5, and other OpenAI models for chat, embeddings, and vision
Icon: openai
Category: llm
Auth Type: api_key
Base URL: https://api.openai.com/v1
Documentation URL: https://platform.openai.com/docs
Supported Models: gpt-4, gpt-4-turbo, gpt-3.5-turbo, text-embedding-ada-002, gpt-4-vision-preview
Default Model: gpt-3.5-turbo
Features: chat, embeddings, vision
Enabled: ✓ (checked)
Sort Order: 1
```

#### Record 2: Anthropic Claude
```
Name: Anthropic Claude
Provider ID: anthropic
Description: Claude AI models for advanced reasoning and long-context conversations
Icon: anthropic
Category: llm
Auth Type: api_key
Base URL: https://api.anthropic.com/v1
Documentation URL: https://docs.anthropic.com
Supported Models: claude-3-opus-20240229, claude-3-sonnet-20240229, claude-3-haiku-20240307
Default Model: claude-3-sonnet-20240229
Features: chat, embeddings
Enabled: ✓ (checked)
Sort Order: 2
```

#### Record 3: Google Gemini
```
Name: Google Gemini
Provider ID: google
Description: Google's Gemini AI models for multimodal understanding
Icon: google
Category: llm
Auth Type: api_key
Base URL: https://generativelanguage.googleapis.com/v1
Documentation URL: https://ai.google.dev/docs
Supported Models: gemini-pro, gemini-pro-vision
Default Model: gemini-pro
Features: chat, vision
Enabled: ✓ (checked)
Sort Order: 3
```

#### Record 4: Custom AI Provider
```
Name: Custom AI Provider
Provider ID: custom
Description: Connect to a custom AI service endpoint with your own API key
Icon: custom
Category: custom
Auth Type: custom
Base URL: (leave empty)
Documentation URL: (leave empty)
Supported Models: (leave empty)
Default Model: (leave empty)
Features: chat
Enabled: ✓ (checked)
Sort Order: 99
```

### 5. Create Views

#### View 1: "Active Integrations"
- **Filter**: `Enabled` = `true`
- **Sort**: 
  1. `Sort Order` (ascending)
  2. `Name` (ascending)
- **Purpose**: Shows only enabled providers for the marketplace

#### View 2: "All Integrations"
- **Filter**: None
- **Sort**: 
  1. `Sort Order` (ascending)
  2. `Name` (ascending)
- **Purpose**: Shows all providers for admin management

### 6. Field ID Mapping (For Backend)

When setting up the backend API, you'll need to map these field names to Airtable Field IDs. The backend service should:

1. Fetch the field mapping for the "Integration Marketplace" table
2. Use Field IDs for all operations (more stable than field names)

Example field mapping:
```typescript
{
  "Name": "fldXXXXXXXXXXXXXX",
  "Provider ID": "fldYYYYYYYYYYYYYY",
  "Description": "fldZZZZZZZZZZZZZZ",
  // ... etc
}
```

## Backend Integration

### API Endpoint Requirements

Your backend should implement these endpoints:

```
GET    /api/integration-marketplace/providers
       - Returns enabled providers only
       - Uses "Active Integrations" view

GET    /api/integration-marketplace/providers/all
       - Returns all providers (for admin)
       - Uses "All Integrations" view

GET    /api/integration-marketplace/providers/:id
       - Returns single provider by record ID

POST   /api/integration-marketplace/providers
       - Creates new provider record

PUT    /api/integration-marketplace/providers/:id
       - Updates existing provider

DELETE /api/integration-marketplace/providers/:id
       - Deletes provider record
```

### Data Transformation

The backend should transform Airtable records to match this structure:

```typescript
interface IntegrationMarketplaceProvider {
  id: string                    // Airtable record ID
  name: string                  // Name field
  providerId: string            // Provider ID field
  description: string           // Description field
  icon: string                  // Icon field
  category: 'llm' | 'vision' | 'speech' | 'custom'
  authType: 'api_key' | 'pat' | 'oauth' | 'custom'
  baseUrl?: string              // Base URL field
  documentationUrl?: string     // Documentation URL field
  supportedModels?: string[]    // Split Supported Models by comma
  defaultModel?: string         // Default Model field
  features: string[]            // Split Features by comma
  enabled: boolean              // Enabled checkbox
  sortOrder?: number            // Sort Order number
}
```

### Field Parsing Notes

- **Supported Models**: Split comma-separated string into array
- **Features**: Split comma-separated string into array
- **Enabled**: Convert checkbox to boolean
- **Sort Order**: Convert to number (default to 999 if empty)

## Testing

After setup:

1. **Verify Records**: Check that all 4 initial records are created
2. **Test Views**: Ensure "Active Integrations" shows only enabled providers
3. **Test API**: Verify backend endpoints return correct data
4. **Test UI**: Check that providers appear in the Integration Marketplace UI

## Maintenance

### Adding New Providers

1. Create a new record in the "Integration Marketplace" table
2. Fill in all required fields
3. Set appropriate `Sort Order` to control display position
4. Ensure `Enabled` is checked
5. The provider will automatically appear in the marketplace

### Disabling Providers

1. Uncheck the `Enabled` checkbox
2. Provider will be hidden from marketplace but remain in database
3. Can be re-enabled later

### Updating Provider Information

1. Edit the record directly in Airtable
2. Changes will be reflected in the marketplace after API refresh
3. No code changes needed

## Troubleshooting

### Providers Not Appearing

- Check that `Enabled` checkbox is checked
- Verify `Sort Order` is set (use 1, 2, 3, etc.)
- Check backend API is returning data correctly
- Verify field names match exactly (case-sensitive)

### API Errors

- Verify Airtable API key has access to the base
- Check table name is exactly "Integration Marketplace"
- Ensure field names match (case-sensitive)
- Verify Field IDs if using Field ID mapping

### Data Format Issues

- Ensure comma-separated lists (Models, Features) use commas, not semicolons
- Check URLs are valid (Base URL, Documentation URL)
- Verify Category and Auth Type match exact options

