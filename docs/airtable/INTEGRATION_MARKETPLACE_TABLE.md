# Integration Marketplace Airtable Table

## Table Name
`Integration Marketplace`

## Purpose
Store and manage AI provider configurations that can be dynamically loaded into the Integration Marketplace UI. This allows administrators to add, update, and manage AI integrations without code changes.

## Table Structure

### Fields

| Field Name | Field Type | Options/Notes | Required |
|------------|------------|----------------|----------|
| **Name** | Single line text | Display name of the AI provider (e.g., "OpenAI", "Anthropic Claude") | Yes |
| **Provider ID** | Single line text | Unique identifier (e.g., "openai", "anthropic", "custom") | Yes |
| **Description** | Long text | Description of the provider and its capabilities | Yes |
| **Icon** | Single line text | Icon identifier or emoji (e.g., "openai", "🤖", "🧠") | No |
| **Category** | Single select | Options: `llm`, `vision`, `speech`, `custom` | Yes |
| **Auth Type** | Single select | Options: `api_key`, `pat`, `oauth`, `custom` | Yes |
| **Base URL** | Single line text | Default API endpoint URL (e.g., "https://api.openai.com/v1") | No |
| **Documentation URL** | URL | Link to provider documentation | No |
| **Supported Models** | Multiple select | List of supported models (comma-separated or multiple select) | No |
| **Default Model** | Single line text | Default model to use if none specified | No |
| **Features** | Multiple select | Options: `chat`, `embeddings`, `vision`, `speech`, `custom` | Yes |
| **Enabled** | Checkbox | Whether this provider is available in the marketplace | Yes (default: true) |
| **Sort Order** | Number | Display order in marketplace (lower numbers appear first) | No |
| **Created At** | Created time | Auto-generated timestamp | Auto |
| **Updated At** | Last modified time | Auto-generated timestamp | Auto |

## Example Records

### OpenAI
- **Name**: OpenAI
- **Provider ID**: openai
- **Description**: GPT-4, GPT-3.5, and other OpenAI models for chat, embeddings, and vision
- **Icon**: openai
- **Category**: llm
- **Auth Type**: api_key
- **Base URL**: https://api.openai.com/v1
- **Documentation URL**: https://platform.openai.com/docs
- **Supported Models**: gpt-4, gpt-4-turbo, gpt-3.5-turbo, text-embedding-ada-002, gpt-4-vision-preview
- **Default Model**: gpt-3.5-turbo
- **Features**: chat, embeddings, vision
- **Enabled**: ✓
- **Sort Order**: 1

### Anthropic Claude
- **Name**: Anthropic Claude
- **Provider ID**: anthropic
- **Description**: Claude AI models for advanced reasoning and long-context conversations
- **Icon**: anthropic
- **Category**: llm
- **Auth Type**: api_key
- **Base URL**: https://api.anthropic.com/v1
- **Documentation URL**: https://docs.anthropic.com
- **Supported Models**: claude-3-opus-20240229, claude-3-sonnet-20240229, claude-3-haiku-20240307
- **Default Model**: claude-3-sonnet-20240229
- **Features**: chat, embeddings
- **Enabled**: ✓
- **Sort Order**: 2

### Custom Provider
- **Name**: Custom AI Provider
- **Provider ID**: custom
- **Description**: Connect to a custom AI service endpoint with your own API key
- **Icon**: custom
- **Category**: custom
- **Auth Type**: custom
- **Base URL**: (empty - user provides)
- **Documentation URL**: (empty)
- **Supported Models**: (empty)
- **Default Model**: (empty)
- **Features**: chat
- **Enabled**: ✓
- **Sort Order**: 99

## Views

### Default View: "Active Integrations"
- Filter: `Enabled` = true
- Sort: `Sort Order` (ascending), then `Name` (ascending)

### View: "All Integrations"
- No filter
- Sort: `Sort Order` (ascending), then `Name` (ascending)

## Usage

1. **Adding New Providers**: Administrators can add new AI providers by creating records in this table
2. **Updating Providers**: Modify existing records to update provider information
3. **Disabling Providers**: Uncheck "Enabled" to hide a provider from the marketplace
4. **Reordering**: Adjust "Sort Order" to control display order

## API Integration

The Integration Marketplace UI will:
1. Fetch all enabled providers from this table
2. Display them in the marketplace grid
3. Use the configuration when users connect to a provider

## Notes

- **Provider ID** must be unique and URL-safe (lowercase, no spaces)
- **Features** should match the capabilities of the provider
- **Base URL** can be overridden by users in the configuration modal
- **Supported Models** can be a comma-separated string or multiple select values

