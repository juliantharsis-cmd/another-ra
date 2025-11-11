/**
 * Standard ECM Catalog Types
 */

export interface StandardECMCatalog {
  id: string
  Name?: string
  Description?: string
  Status?: 'Active' | 'Inactive'
  'Standard ECM Classification'?: string | string[]
  'Standard ECM Classification Name'?: string | string[]
  Notes?: string
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  lastModifiedBy?: string
}

export interface CreateStandardECMCatalogDto {
  Name?: string
  Description?: string
  Status?: 'Active' | 'Inactive'
  'Standard ECM Classification'?: string | string[]
  Notes?: string
}

export interface UpdateStandardECMCatalogDto {
  Name?: string
  Description?: string
  Status?: 'Active' | 'Inactive'
  'Standard ECM Classification'?: string | string[]
  Notes?: string
}

