/**
 * Helper script to generate table implementation files
 * This is a template generator - actual implementations will be created manually
 */

// Table configurations
const TABLES = [
  {
    name: 'Normalized Activities',
    tableName: 'Normalized Activities',
    entityName: 'Normalized Activity',
    entityNamePlural: 'Normalized Activities',
    routePath: 'normalized-activities',
    pagePath: 'normalized-activities',
    navName: 'Normalized Activities',
  },
  {
    name: 'EF/Detailed G',
    tableName: 'EF/Detailed G',
    entityName: 'EF/Detailed G',
    entityNamePlural: 'EF/Detailed G',
    routePath: 'ef-detailed-g',
    pagePath: 'ef-detailed-g',
    navName: 'EF/Detailed G',
  },
  {
    name: 'Scope',
    tableName: 'Scope',
    entityName: 'Scope',
    entityNamePlural: 'Scopes',
    routePath: 'scope',
    pagePath: 'scope',
    navName: 'Scope',
  },
  {
    name: 'scope & categorisation',
    tableName: 'scope & categorisation',
    entityName: 'Scope & Categorisation',
    entityNamePlural: 'Scope & Categorisations',
    routePath: 'scope-categorisation',
    pagePath: 'scope-categorisation',
    navName: 'Scope & Categorisation',
  },
  {
    name: 'Unit',
    tableName: 'Unit',
    entityName: 'Unit',
    entityNamePlural: 'Units',
    routePath: 'unit',
    pagePath: 'unit',
    navName: 'Unit',
  },
  {
    name: 'Unit Conversion',
    tableName: 'Unit Conversion',
    entityName: 'Unit Conversion',
    entityNamePlural: 'Unit Conversions',
    routePath: 'unit-conversion',
    pagePath: 'unit-conversion',
    navName: 'Unit Conversion',
  },
  {
    name: 'Standard ECM catalog',
    tableName: 'Standard ECM catalog',
    entityName: 'Standard ECM Catalog',
    entityNamePlural: 'Standard ECM Catalogs',
    routePath: 'standard-ecm-catalog',
    pagePath: 'standard-ecm-catalog',
    navName: 'Standard ECM Catalog',
  },
  {
    name: 'Standard ECM Classification',
    tableName: 'Standard ECM Classification',
    entityName: 'Standard ECM Classification',
    entityNamePlural: 'Standard ECM Classifications',
    routePath: 'standard-ecm-classification',
    pagePath: 'standard-ecm-classification',
    navName: 'Standard ECM Classification',
  },
]

export { TABLES }

