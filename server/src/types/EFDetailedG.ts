/**
 * EF/Detailed G Types
 */

export interface EFDetailedG {
  id: string
  Name?: string
  Description?: string
  Status?: 'Active' | 'Inactive'
  'EF GWP'?: string | string[]
  'EF GWP Name'?: string | string[]
  'GHG TYPE'?: string | string[]
  'GHG TYPE Name'?: string | string[]
  'Std Emission factors'?: string | string[]
  'Std Emission factors Name'?: string | string[]
  Notes?: string
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  lastModifiedBy?: string
}

export interface CreateEFDetailedGDto {
  Name?: string
  Description?: string
  Status?: 'Active' | 'Inactive'
  'EF GWP'?: string | string[]
  'GHG TYPE'?: string | string[]
  'Std Emission factors'?: string | string[]
  Notes?: string
}

export interface UpdateEFDetailedGDto {
  Name?: string
  Description?: string
  Status?: 'Active' | 'Inactive'
  'EF GWP'?: string | string[]
  'GHG TYPE'?: string | string[]
  'Std Emission factors'?: string | string[]
  Notes?: string
}

