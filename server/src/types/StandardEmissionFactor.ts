/**
 * Standard Emission Factor Types
 */

export interface StandardEmissionFactor {
  id: string
  Name?: string
  Description?: string
  Status?: 'Active' | 'Inactive'
  'Emission Factor Version'?: string | string[] // Record ID(s)
  'Emission Factor Version Name'?: string | string[] // Resolved name(s)
  'Emission Factor Set'?: string | string[] // Record ID(s)
  'Emission Factor Set Name'?: string | string[] // Resolved name(s)
  'GHG TYPE'?: string | string[] // Record ID(s)
  'GHG TYPE Name'?: string | string[] // Resolved name(s)
  'EF GWP'?: string | string[] // Record ID(s)
  'EF GWP Name'?: string | string[] // Resolved name(s)
  'EF/Detailed G'?: string | string[] // Record ID(s)
  'EF/Detailed G Name'?: string | string[] // Resolved name(s)
  Notes?: string
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  lastModifiedBy?: string
}

export interface CreateStandardEmissionFactorDto {
  Name?: string
  Description?: string
  Status?: 'Active' | 'Inactive'
  'Emission Factor Version'?: string | string[]
  'Emission Factor Set'?: string | string[]
  'GHG TYPE'?: string | string[]
  'EF GWP'?: string | string[]
  'EF/Detailed G'?: string | string[]
  Notes?: string
}

export interface UpdateStandardEmissionFactorDto {
  Name?: string
  Description?: string
  Status?: 'Active' | 'Inactive'
  'Emission Factor Version'?: string | string[]
  'Emission Factor Set'?: string | string[]
  'GHG TYPE'?: string | string[]
  'EF GWP'?: string | string[]
  'EF/Detailed G'?: string | string[]
  Notes?: string
}

