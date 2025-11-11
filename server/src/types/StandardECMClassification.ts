/**
 * Standard ECM Classification Types
 */

export interface StandardECMClassification {
  id: string
  Name?: string
  Description?: string
  Status?: 'Active' | 'Inactive'
  'Standard ECM catalog'?: string | string[]
  'Standard ECM catalog Name'?: string | string[]
  Notes?: string
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  lastModifiedBy?: string
}

export interface CreateStandardECMClassificationDto {
  Name?: string
  Description?: string
  Status?: 'Active' | 'Inactive'
  'Standard ECM catalog'?: string | string[]
  Notes?: string
}

export interface UpdateStandardECMClassificationDto {
  Name?: string
  Description?: string
  Status?: 'Active' | 'Inactive'
  'Standard ECM catalog'?: string | string[]
  Notes?: string
}

