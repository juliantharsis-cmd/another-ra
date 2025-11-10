/**
 * Emission Factor Version Type Definitions
 * 
 * Defines the structure of Emission Factor Version records from Airtable
 */

export interface EmissionFactorVersion {
  id: string
  Name?: string
  'Short code'?: string
  Description?: string
  Formula?: string
  Category?: string
  Status?: 'Active' | 'Inactive'
  Notes?: string
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  lastModifiedBy?: string
}

export interface CreateEmissionFactorVersionDto {
  Name?: string
  'Short code'?: string
  Description?: string
  Formula?: string
  Category?: string
  Status?: 'Active' | 'Inactive'
  Notes?: string
}

export interface UpdateEmissionFactorVersionDto {
  Name?: string
  'Short code'?: string
  Description?: string
  Formula?: string
  Category?: string
  Status?: 'Active' | 'Inactive'
  Notes?: string
}

