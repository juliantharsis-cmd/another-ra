/**
 * EF GWP (Emission Factor Global Warming Potential) Types
 */

export interface EFGWP {
  id: string
  factor_name: string // Name (formula field)
  ars_version?: string // ARS Version
  status: 'Active' | 'Inactive'
  gwp_value: number // GWP factor
  ef_co2e?: string // EF CO2e
  notes?: string
  // Relationship to GHG Type
  greenHouseGas?: string | string[] // Airtable record ID(s) - can be single or multiple
  greenHouseGasName?: string | string[] // Resolved name(s) for display
  // Relationship to Protocol
  protocol?: string | string[] // Airtable record ID(s)
  protocolName?: string | string[] // Resolved name(s) for display
  // Relationship to EF/Detailed G
  efDetailedG?: string | string[] // Airtable record ID(s)
  efDetailedGName?: string | string[] // Resolved name(s) for display
  // Legacy fields (for backward compatibility)
  unit?: string // Not in Airtable, kept for compatibility
  source?: string // Legacy - use protocol instead
  created_at?: string
  updated_at?: string
  createdBy?: string
  lastModifiedBy?: string
}

export interface CreateEFGWPDto {
  factor_name?: string // Name (formula - may be auto-generated)
  ars_version?: string
  status?: 'Active' | 'Inactive'
  gwp_value: number // GWP factor
  ef_co2e?: string // EF CO2e
  notes?: string
  greenHouseGas?: string | string[] // Airtable record ID(s)
  protocol?: string | string[] // Airtable record ID(s)
  efDetailedG?: string | string[] // Airtable record ID(s)
  // Legacy fields
  unit?: string
  source?: string
}

export interface UpdateEFGWPDto {
  factor_name?: string // Name (formula - may be read-only)
  ars_version?: string
  status?: 'Active' | 'Inactive'
  gwp_value?: number // GWP factor
  ef_co2e?: string // EF CO2e
  notes?: string
  greenHouseGas?: string | string[] // Airtable record ID(s)
  protocol?: string | string[] // Airtable record ID(s)
  efDetailedG?: string | string[] // Airtable record ID(s)
  // Legacy fields
  unit?: string
  source?: string
}

// Type aliases for backward compatibility (deprecated)
export type EmissionFactor = EFGWP
export type CreateEmissionFactorDto = CreateEFGWPDto
export type UpdateEmissionFactorDto = UpdateEFGWPDto

