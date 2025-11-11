/**
 * Unit Types
 */

export interface Unit {
  id: string
  Name?: string
  Description?: string
  Status?: 'Active' | 'Inactive'
  Symbol?: string
  Notes?: string
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  lastModifiedBy?: string
}

export interface CreateUnitDto {
  Name?: string
  Description?: string
  Status?: 'Active' | 'Inactive'
  Symbol?: string
  Notes?: string
}

export interface UpdateUnitDto {
  Name?: string
  Description?: string
  Status?: 'Active' | 'Inactive'
  Symbol?: string
  Notes?: string
}

