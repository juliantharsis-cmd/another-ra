# AI Model Registry Airtable Table

## Table Name
`AI Model Registry`

## Purpose
Centralized storage for AI model availability, metadata, and verification status. This enables:
- Shared model information across multiple server instances
- Persistent model data that survives server restarts
- Model availability tracking over time
- Rich metadata (costs, features, deprecation dates)
- Non-developer management of model configurations

## Table Structure

### Fields

| Field Name | Field Type | Options/Notes | Required |
|------------|------------|---------------|----------|
| **Provider ID** | Single line text | `google`, `openai`, `anthropic`, `custom` | Yes |
| **Model ID** | Single line text | Unique model identifier (e.g., `gemini-1.5-flash-latest`) | Yes |
| **Model Name** | Single line text | Display name (e.g., "Gemini 1.5 Flash") | Yes |
| **Status** | Single select | `active`, `deprecated`, `beta`, `preview` | Yes (default: `active`) |
| **Available** | Checkbox | Currently available via API | Yes (default: true) |
| **Last Verified** | Date (date/time) | Last time model was verified | No |
| **Discovery Method** | Single select | `api`, `manual`, `fallback` | Yes (default: `api`) |
| **Cost per 1K tokens** | Number | Pricing information (optional) | No |
| **Max Tokens** | Number | Maximum context window | No |
| **Features** | Multiple select | `chat`, `vision`, `embeddings`, `streaming`, `function_calling` | No |
| **Regions** | Multiple select | `us`, `eu`, `global` | No |
| **Deprecation Date** | Date | When model will be deprecated | No |
| **Recommended** | Checkbox | Recommended model for provider | Yes (default: false) |
| **Sort Order** | Number | Display order (lower = first) | No |
| **Metadata** | Long text | JSON string with additional data | No |
| **Created At** | Created time | Auto-generated | Auto |
| **Updated At** | Last modified time | Auto-generated | Auto |

## Example Records

### Google Gemini - Flash (Recommended)
- **Provider ID**: google
- **Model ID**: gemini-1.5-flash-latest
- **Model Name**: Gemini 1.5 Flash
- **Status**: active
- **Available**: ✓
- **Last Verified**: [Current timestamp]
- **Discovery Method**: api
- **Features**: chat, vision
- **Recommended**: ✓
- **Sort Order**: 1

### Google Gemini - Pro
- **Provider ID**: google
- **Model ID**: gemini-1.5-pro-latest
- **Model Name**: Gemini 1.5 Pro
- **Status**: active
- **Available**: ✓
- **Last Verified**: [Current timestamp]
- **Discovery Method**: api
- **Features**: chat, vision
- **Recommended**: false
- **Sort Order**: 2

### Anthropic Claude - Haiku (Recommended)
- **Provider ID**: anthropic
- **Model ID**: claude-3-haiku-20240307
- **Model Name**: Claude 3 Haiku
- **Status**: active
- **Available**: ✓
- **Last Verified**: [Current timestamp]
- **Discovery Method**: api
- **Features**: chat, embeddings
- **Recommended**: ✓
- **Sort Order**: 1

## Views

### Default View: "Active Models by Provider"
- Group by: `Provider ID`
- Filter: `Available` = true, `Status` = active
- Sort: `Provider ID` (asc), `Sort Order` (asc), `Model Name` (asc)

### View: "Recommended Models"
- Filter: `Recommended` = true, `Available` = true
- Sort: `Provider ID` (asc), `Sort Order` (asc)

### View: "Needs Verification"
- Filter: `Last Verified` is empty OR `Last Verified` < 24 hours ago
- Sort: `Provider ID` (asc), `Last Verified` (asc)

## Usage

### Automatic Updates
The system automatically:
1. Discovers models from provider APIs
2. Updates Airtable with discovered models
3. Verifies model availability
4. Updates `Last Verified` timestamps

### Manual Management
Administrators can:
1. Mark models as recommended
2. Set deprecation dates
3. Add cost information
4. Update features and regions
5. Adjust sort order

## Integration with AIService

The `AIService` uses this table in the hybrid approach:
1. **Check Cache** (1 hour TTL) - Fastest
2. **Check Airtable** (if data < 24 hours old) - Shared, persistent
3. **Discover from API** - Fallback, updates Airtable

## Benefits

- **Scalability**: Shared across multiple server instances
- **Persistence**: Survives server restarts
- **Flexibility**: Non-developers can manage models
- **Rich Metadata**: Track costs, features, deprecation
- **Performance**: Reduces API calls with caching
- **Resilience**: Multiple fallback layers

