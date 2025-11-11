/**
 * Scope & Categorisation Types
 */

export interface ScopeCategorisation {
  id: string
  Name?: string
  Description?: string
  Status?: 'Active' | 'Inactive'
  Scope?: string | string[]
  ScopeName?: string | string[]
  Notes?: string
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  lastModifiedBy?: string
}

export interface CreateScopeCategorisationDto {
  Name?: string
  Description?: string
  Status?: 'Active' | 'Inactive'
  Scope?: string | string[]
  Notes?: string
}

export interface UpdateScopeCategorisationDto {
  Name?: string
  Description?: string
  Status?: 'Active' | 'Inactive'
  Scope?: string | string[]
  Notes?: string
}

