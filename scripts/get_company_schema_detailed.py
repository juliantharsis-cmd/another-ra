import requests
import json
import os

SYSTEM_CONFIG_BASE_ID = 'appGtLbKhmNkkTLVL'
COMPANY_TABLE_ID = 'tbl82H6ezrakMSkV1'
DIVISION_TABLE_ID = 'tblLIRnxlCNotH2FY'
API_KEY = os.getenv('AIRTABLE_PERSONAL_ACCESS_TOKEN', 'your_airtable_personal_access_token')

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

def get_all_tables():
    """Fetch all tables from base using Meta API"""
    url = f'https://api.airtable.com/v0/meta/bases/{SYSTEM_CONFIG_BASE_ID}/tables'
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        return response.json().get('tables', [])
    else:
        print(f"Error fetching tables: {response.status_code} - {response.text}")
        return []

# Get all tables
all_tables = get_all_tables()

# Find Company and Division tables
company_table = next((t for t in all_tables if t.get('id') == COMPANY_TABLE_ID), None)
division_table = next((t for t in all_tables if t.get('id') == DIVISION_TABLE_ID), None)

output = {
    'company': company_table,
    'division': division_table
}

# Save to file
with open('docs/company-table-schema-detailed.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print("Company table schema extracted successfully!")
if company_table:
    print(f"Company table: {company_table.get('name')} - {len(company_table.get('fields', []))} fields")
    print(f"  Table ID: {company_table.get('id')}")
    print(f"  Primary Field ID: {company_table.get('primaryFieldId')}")
if division_table:
    print(f"Division table: {division_table.get('name')} - {len(division_table.get('fields', []))} fields")
    print(f"  Table ID: {division_table.get('id')}")
