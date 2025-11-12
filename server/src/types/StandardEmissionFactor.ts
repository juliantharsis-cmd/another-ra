/**
 * Standard Emission Factor Types
 */

export interface StandardEmissionFactor {
  id: string
  Name?: string
  Status?: 'Active' | 'Inactive' | string
  'Emission Factors Dataset'?: string | string[] // Record ID(s)
  'Emission Factors Dataset Name'?: string | string[] // Resolved name(s)
  'Emission Factor (CO2e)'?: number
  'Type of EF'?: string
  'GHG Unit (CO2e)'?: string | string[] // Record ID(s)
  'GHG Unit (CO2e) Name'?: string | string[] // Resolved name(s)
  Created?: string
  'Last Modified'?: string
  'Industry Classification & Emission Factors'?: string | string[] // Record ID(s)
  'Industry Classification & Emission Factors Name'?: string | string[] // Resolved name(s)
  Version?: string | string[] // Record ID(s)
  'Version Name'?: string | string[] // Resolved name(s)
  'Publication Date'?: string
  'Normalized activity'?: string | string[] // Record ID(s)
  'Normalized activity Name'?: string | string[] // Resolved name(s)
  'Ref.IC'?: string | string[]
  'Industry Classification'?: string | string[] // Record ID(s)
  'Industry Classification Name'?: string | string[] // Resolved name(s)
  'Source UOM'?: string | string[] // Record ID(s)
  'Source UOM Name'?: string | string[] // Resolved name(s)
  Scope?: string | string[] // Record ID(s)
  'Scope Name'?: string | string[] // Resolved name(s)
  'Availability '?: string
  'code (from Industry Classification  🏭)'?: string // Lookup field
  'Name copy'?: string
  ID?: number
  'Activity Default UOM'?: string | string[] // Record ID(s)
  'Activity Default UOM Name'?: string | string[] // Resolved name(s)
  'EF/Detailed G'?: string | string[] // Record ID(s)
  'EF/Detailed G Name'?: string | string[] // Resolved name(s)
  'Dimension (from Source UOM)'?: string // Lookup field
  'Status (from Version)'?: string // Lookup field
  // Optional fields that may not exist in all bases
  Description?: string
  Notes?: string
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  lastModifiedBy?: string
}

export interface CreateStandardEmissionFactorDto {
  Name?: string
  Status?: 'Active' | 'Inactive' | string
  'Emission Factors Dataset'?: string | string[]
  'Emission Factor (CO2e)'?: number
  'Type of EF'?: string
  'GHG Unit (CO2e)'?: string | string[]
  'Industry Classification & Emission Factors'?: string | string[]
  Version?: string | string[]
  'Publication Date'?: string
  'Normalized activity'?: string | string[]
  'Ref.IC'?: string | string[]
  'Industry Classification'?: string | string[]
  'Source UOM'?: string | string[]
  Scope?: string | string[]
  'Availability '?: string
  'Name copy'?: string
  ID?: number
  'Activity Default UOM'?: string | string[]
  'EF/Detailed G'?: string | string[]
  // Optional fields
  Description?: string
  Notes?: string
}

export interface UpdateStandardEmissionFactorDto {
  Name?: string
  Status?: 'Active' | 'Inactive' | string
  'Emission Factors Dataset'?: string | string[]
  'Emission Factor (CO2e)'?: number
  'Type of EF'?: string
  'GHG Unit (CO2e)'?: string | string[]
  'Industry Classification & Emission Factors'?: string | string[]
  Version?: string | string[]
  'Publication Date'?: string
  'Normalized activity'?: string | string[]
  'Ref.IC'?: string | string[]
  'Industry Classification'?: string | string[]
  'Source UOM'?: string | string[]
  Scope?: string | string[]
  'Availability '?: string
  'Name copy'?: string
  ID?: number
  'Activity Default UOM'?: string | string[]
  'EF/Detailed G'?: string | string[]
  // Optional fields
  Description?: string
  Notes?: string
}

