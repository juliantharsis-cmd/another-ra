/**
 * Normalized Activity Types
 */

export interface NormalizedActivity {
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

export interface CreateNormalizedActivityDto {
  Name?: string
  Description?: string
  Status?: 'Active' | 'Inactive'
  Notes?: string
}

export interface UpdateNormalizedActivityDto {
  Name?: string
  Description?: string
  Status?: 'Active' | 'Inactive'
  Notes?: string
}

