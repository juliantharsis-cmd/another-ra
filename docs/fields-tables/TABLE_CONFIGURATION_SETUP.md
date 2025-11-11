# Table Configuration Setup Guide

## Overview

The Table Configuration feature uses a dedicated "Table Configuration" table in Airtable as a configuration layer on top of existing tables. This allows you to customize field names, types, and formats in Another Resource Advisor without modifying the original Airtable schema.

## Airtable Table Setup

### Create the "Table Configuration" Table

1. In your Airtable base (System Configuration space), create a new table named **"Table Configuration"**

2. Add the following fields to the table:

| Field Name | Field Type | Description |
|------------|------------|-------------|
| **Table Name** | Single line text | Name of the table being configured (e.g., "Companies", "Geography", "EF GWP") |
| **Field Name (Original)** | Single line text | Original field name from Airtable schema |
| **Field Name (Custom)** | Single line text | Custom field name for Another Resource Advisor |
| **Field Type** | Single select | Field type (see options below) |
| **Format Preferences** | Long text | JSON string containing format options (e.g., `{"precision": 2, "symbol": "$"}`) |
| **Is Active** | Checkbox | Whether this field is active/enabled (default: checked) |
| **Description** | Long text | Optional field description |
| **Default Value** | Single line text | Default value for the field |

### Field Type Options

The **Field Type** field should be a Single select with the following options:

- Single line text
- Long text
- Attachment
- Checkbox
- Multiple select
- Single select
- User
- Date
- Phone number
- Email
- URL
- Number
- Currency
- Percent
- Duration
- Rating
- Formula
- Multiple record links
- Single record link
- Created time
- Last modified time
- Created by
- Last modified by

## How It Works

### Initial Configuration

1. When you first open "Configure Table" for a table, the system will:
   - Check if a configuration exists in the "Table Configuration" table
   - If not found, attempt to fetch the original schema from Airtable (requires Metadata API access)
   - Create initial configuration records with original field names

2. If Metadata API access is not available, you can manually create configuration records or the system will create them from current fields.

### Using the Configuration

1. **Field Name Customization**: 
   - The "Field Name (Original)" stores the original Airtable field name
   - The "Field Name (Custom)" is what appears in Another Resource Advisor
   - Both are displayed in the configuration panel for clarity

2. **Field Type Changes**:
   - You can change field types in the configuration without affecting the original Airtable schema
   - Format preferences are stored as JSON in the "Format Preferences" field

3. **Active/Inactive Fields**:
   - Use the "Is Active" checkbox to enable/disable fields
   - Inactive fields are not displayed in Another Resource Advisor

## API Endpoints

### GET /api/configurations/:tableName
Fetches the configuration for a specific table.

**Example:**
```bash
GET /api/configurations/Companies
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tableId": "companies",
    "tableName": "Companies",
    "fields": [
      {
        "id": "rec123",
        "name": "Company Name",
        "type": "singleLineText",
        "airtableFieldName": "Name",
        "syncedWithAirtable": true
      }
    ]
  }
}
```

### PUT /api/configurations/:tableName
Updates the configuration for a specific table.

**Example:**
```bash
PUT /api/configurations/Companies
Content-Type: application/json

{
  "tableName": "Companies",
  "fields": [
    {
      "name": "Company Name",
      "type": "singleLineText",
      "airtableFieldName": "Name",
      "format": {},
      "description": "Company name field"
    }
  ]
}
```

## Environment Variables

The following environment variables are used:

- `AIRTABLE_CONFIG_TABLE_NAME`: Name of the configuration table (default: "Table Configuration")
- `AIRTABLE_SYSTEM_CONFIG_BASE_ID`: Airtable base ID for system configuration
- `AIRTABLE_PERSONAL_ACCESS_TOKEN`: Airtable API token

## Benefits

1. **Non-Destructive**: Original Airtable schema remains unchanged
2. **Flexible**: Customize field names and types per environment
3. **Reversible**: Can always revert to original field names
4. **Version Control**: Configuration can be exported/imported as JSON
5. **Multi-Environment**: Different configurations for dev/staging/prod

## Example Configuration Record

| Table Name | Field Name (Original) | Field Name (Custom) | Field Type | Format Preferences | Is Active |
|------------|----------------------|---------------------|------------|-------------------|-----------|
| Companies | Name | Company Name | Single line text | {} | ✓ |
| Companies | ISIN Code | ISIN | Single line text | {} | ✓ |
| Companies | Status | Status | Single select | {"options": ["Active", "Closed"]} | ✓ |

## Troubleshooting

### Configuration Not Found

If you see "Configuration not found":
1. Check that the "Table Configuration" table exists in your Airtable base
2. Verify the table name matches exactly (case-sensitive)
3. Ensure at least one record exists for the table

### Original Field Names Not Showing

If original field names are not displayed:
1. Check that "Field Name (Original)" is populated in the configuration records
2. Verify Metadata API access is available (optional, not required)
3. Original names will be set to custom names if not available

### Changes Not Reflecting

If changes aren't appearing:
1. Refresh the page
2. Check that "Is Active" is checked for the field
3. Verify the configuration was saved successfully

