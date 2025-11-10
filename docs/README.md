# Documentation Index

This directory contains all documentation for the Another Resource Advisor application.

## 📋 Product Requirements Documents (PRD)

See [docs/prd/](./prd/) for all Product Requirements Documents:
- Companies Table
- Geography Table
- Emission Factor GWP Table
- Table Configuration Mode
- User Preferences

## 📊 Performance Documentation

See [docs/performance/](./performance/) for performance analysis and optimization guides:
- Performance Review
- Performance Optimization Guide

## 🗄️ System Configuration Workspace

This section contains the extracted schema and data model documentation for the Airtable System Configuration workspace.

## Files

### 📋 Schema Documentation

1. **system-config-schema-summary.md**
   - Human-readable summary of all tables
   - Field descriptions and purposes
   - Key relationships overview
   - Quick reference guide

2. **system-config-relationships.md**
   - Visual relationship diagrams
   - Detailed relationship mappings
   - Data flow diagrams
   - Entity relationship overview

3. **system-config-schema.json**
   - Complete schema in JSON format
   - Machine-readable structure
   - Includes all tables, fields, and metadata
   - Suitable for programmatic use

4. **system-config-schema-full.json**
   - Full detailed schema with all field options
   - Includes choice values, formulas, and configurations
   - Complete metadata dump

## Base Information

- **Base ID:** `appGtLbKhmNkkTLVL`
- **Base Name:** System configuration space
- **Total Tables:** 20
- **Schema Version:** Extracted 2025-01-11

## Quick Start

1. Read **system-config-schema-summary.md** for an overview
2. Review **system-config-relationships.md** for understanding data relationships
3. Use **system-config-schema.json** for programmatic access

## Schema Structure

The System Configuration workspace contains:

- **Organizational Structure:** Company, Division
- **Emission Factors:** EF GWP, Std Emission factors, EF/Detailed G
- **GHG Management:** GHG TYPE, Protocol
- **Versioning:** Emission Factor Set, Emission Factor Version
- **Activity Tracking:** Commodity, Activity Density, Unit Conversion
- **Application Management:** Application list, Lifecycle stages

## Usage

### For Developers
- Import `system-config-schema.json` to understand the data model
- Use field IDs and table IDs for API integration
- Reference relationship mappings for data queries

### For Analysts
- Review table relationships in `system-config-relationships.md`
- Understand data flow and dependencies
- Identify key entities and their connections

### For Integration
- Use the schema JSON to generate TypeScript/Type definitions
- Map Airtable fields to application models
- Validate data structure against schema

## Extraction Script

The schema was extracted using:
```bash
npx tsx scripts/get_system_config_schema.ts
```

For JSON-only output:
```bash
npx tsx scripts/get_system_config_schema.ts --json-only
```

## Next Steps

- [ ] Generate TypeScript types from schema
- [ ] Create API integration layer
- [ ] Build data validation schemas
- [ ] Document business rules and constraints

