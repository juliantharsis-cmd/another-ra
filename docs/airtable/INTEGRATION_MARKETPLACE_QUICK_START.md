# Integration Marketplace - Quick Start Guide

## Step 1: Create Airtable Table

1. Open your Airtable base (System Configuration space)
2. Click **"Add a table"** or **"+"** button
3. Name it: **"Integration Marketplace"**

## Step 2: Add Fields

Create these fields in order:

1. **Name** - Single line text (Required)
2. **Provider ID** - Single line text (Required)
3. **Description** - Long text (Required)
4. **Icon** - Single line text (Optional)
5. **Category** - Single select (Required)
   - Options: `llm`, `vision`, `speech`, `custom`
6. **Auth Type** - Single select (Required)
   - Options: `api_key`, `pat`, `oauth`, `custom`
7. **Base URL** - URL (Optional)
8. **Documentation URL** - URL (Optional)
9. **Supported Models** - Long text (Optional)
   - Use comma-separated values: `gpt-4, gpt-3.5-turbo`
10. **Default Model** - Single line text (Optional)
11. **Features** - Long text (Required)
    - Use comma-separated values: `chat, embeddings, vision`
12. **Enabled** - Checkbox (Required, default: checked)
13. **Sort Order** - Number (Optional)

## Step 3: Create Initial Records

Copy and paste these 4 records:

### Record 1: OpenAI
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
Enabled: ✓
Sort Order: 1
```

### Record 2: Anthropic Claude
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
Enabled: ✓
Sort Order: 2
```

### Record 3: Google Gemini
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
Enabled: ✓
Sort Order: 3
```

### Record 4: Custom AI Provider
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
Enabled: ✓
Sort Order: 99
```

## Step 4: Create Views

### View: "Active Integrations"
- **Filter**: `Enabled` = `true`
- **Sort**: `Sort Order` (ascending), then `Name` (ascending)

### View: "All Integrations"
- **Filter**: None
- **Sort**: `Sort Order` (ascending), then `Name` (ascending)

## Step 5: Backend Setup

The backend service and routes are already created:
- `server/src/services/IntegrationMarketplaceService.ts`
- `server/src/routes/integrationMarketplace.ts`

Make sure your `.env` file has:
```
AIRTABLE_API_KEY=your_api_key_here
AIRTABLE_BASE_ID=your_base_id_here
```

The routes are automatically registered in `server/src/index.ts`.

## Step 6: Test

1. Start your backend server
2. Navigate to **System Configuration** → **Application Settings** → **Integrations**
3. You should see the 4 providers loaded from Airtable
4. Try creating/editing a provider in the management interface

## Troubleshooting

**Providers not showing?**
- Check `Enabled` checkbox is checked
- Verify backend is running and connected to Airtable
- Check browser console for API errors
- Verify table name is exactly "Integration Marketplace"

**API errors?**
- Verify `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID` in `.env`
- Check field names match exactly (case-sensitive)
- Ensure table exists in the correct base

## Adding New Providers

Simply create a new record in Airtable with:
- Unique `Provider ID`
- All required fields filled
- `Enabled` checked
- Appropriate `Sort Order`

The provider will automatically appear in the marketplace!

