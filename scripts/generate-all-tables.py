#!/usr/bin/env python3
"""
Generate all table implementation files for 8 tables
"""

import os
import re
from pathlib import Path

# Table configurations
TABLES = [
    {
        'name': 'Normalized Activities',
        'tableName': 'Normalized Activities',
        'entityName': 'Normalized Activity',
        'entityNamePlural': 'Normalized Activities',
        'routePath': 'normalized-activities',
        'pagePath': 'normalized-activities',
        'navName': 'Normalized Activities',
        'relationships': [],
    },
    {
        'name': 'EF/Detailed G',
        'tableName': 'EF/Detailed G',
        'entityName': 'EF/Detailed G',
        'entityNamePlural': 'EF/Detailed G',
        'routePath': 'ef-detailed-g',
        'pagePath': 'ef-detailed-g',
        'navName': 'EF/Detailed G',
        'relationships': [
            {'field': 'EF GWP', 'table': 'EF GWP', 'nameField': 'Name'},
            {'field': 'GHG TYPE', 'table': 'GHG TYPE', 'nameField': 'Name'},
            {'field': 'Std Emission factors', 'table': 'Std Emission factors', 'nameField': 'Name'},
        ],
    },
    {
        'name': 'Scope',
        'tableName': 'Scope',
        'entityName': 'Scope',
        'entityNamePlural': 'Scopes',
        'routePath': 'scope',
        'pagePath': 'scope',
        'navName': 'Scope',
        'relationships': [],
    },
    {
        'name': 'scope & categorisation',
        'tableName': 'scope & categorisation',
        'entityName': 'Scope & Categorisation',
        'entityNamePlural': 'Scope & Categorisations',
        'routePath': 'scope-categorisation',
        'pagePath': 'scope-categorisation',
        'navName': 'Scope & Categorisation',
        'relationships': [
            {'field': 'Scope', 'table': 'Scope', 'nameField': 'Name'},
        ],
    },
    {
        'name': 'Unit',
        'tableName': 'Unit',
        'entityName': 'Unit',
        'entityNamePlural': 'Units',
        'routePath': 'unit',
        'pagePath': 'unit',
        'navName': 'Unit',
        'relationships': [],
    },
    {
        'name': 'Unit Conversion',
        'tableName': 'Unit Conversion',
        'entityName': 'Unit Conversion',
        'entityNamePlural': 'Unit Conversions',
        'routePath': 'unit-conversion',
        'pagePath': 'unit-conversion',
        'navName': 'Unit Conversion',
        'relationships': [
            {'field': 'Activity Density', 'table': 'Activity Density', 'nameField': 'Name'},
        ],
    },
    {
        'name': 'Standard ECM catalog',
        'tableName': 'Standard ECM catalog',
        'entityName': 'Standard ECM Catalog',
        'entityNamePlural': 'Standard ECM Catalogs',
        'routePath': 'standard-ecm-catalog',
        'pagePath': 'standard-ecm-catalog',
        'navName': 'Standard ECM Catalog',
        'relationships': [
            {'field': 'Standard ECM Classification', 'table': 'Standard ECM Classification', 'nameField': 'Name'},
        ],
    },
    {
        'name': 'Standard ECM Classification',
        'tableName': 'Standard ECM Classification',
        'entityName': 'Standard ECM Classification',
        'entityNamePlural': 'Standard ECM Classifications',
        'routePath': 'standard-ecm-classification',
        'pagePath': 'standard-ecm-classification',
        'navName': 'Standard ECM Classification',
        'relationships': [
            {'field': 'Standard ECM catalog', 'table': 'Standard ECM catalog', 'nameField': 'Name'},
        ],
    },
]

def to_camel_case(s):
    s = re.sub(r'[^a-zA-Z0-9\s]', '', s)
    words = s.split()
    return words[0].lower() + ''.join(word.capitalize() for word in words[1:])

def to_pascal_case(s):
    camel = to_camel_case(s)
    return camel[0].upper() + camel[1:] if camel else ''

def to_kebab_case(s):
    s = re.sub(r'[^a-zA-Z0-9\s]', '', s)
    return '-'.join(word.lower() for word in s.split())

print(f"📋 Will generate files for {len(TABLES)} tables")
print("   Note: This script shows what will be generated. Actual file generation")
print("   will be done manually to ensure proper relationship handling.\n")

for table in TABLES:
    camel = to_camel_case(table['name'])
    pascal = to_pascal_case(table['name'])
    kebab = table['routePath']
    
    print(f"✅ {table['name']}:")
    print(f"   - Types: {pascal}.ts")
    print(f"   - Service: {pascal}AirtableService.ts")
    print(f"   - Controller: {pascal}Controller.ts")
    print(f"   - Routes: {camel}Routes.ts")
    print(f"   - API Client: {camel}.ts")
    print(f"   - Config: {camel}Config.tsx")
    print(f"   - Page: {kebab}/page.tsx")
    print(f"   - Layout: {kebab}/layout.tsx")
    if table['relationships']:
        print(f"   - Relationships: {len(table['relationships'])}")
    print()

