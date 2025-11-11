/**
 * Scope Types
 */

export interface Scope {
  id: string
  Name?: string
  Description?: string
  Status?: 'Active' | 'Inactive'
  Notes?: string
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  lastModifiedBy?: string
}

export interface CreateScopeDto {
  Name?: string
  Description?: string
  Status?: 'Active' | 'Inactive'
  Notes?: string
}

export interface UpdateScopeDto {
  Name?: string
  Description?: string
  Status?: 'Active' | 'Inactive'
  Notes?: string
}

