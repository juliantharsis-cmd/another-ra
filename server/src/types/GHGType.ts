/**
 * GHG Type Type Definitions
 * 
 * Defines the structure of GHG Type records from Airtable
 */

export interface GHGType {
  id: string
  Name?: string
  'Short code'?: string
  Description?: string
  Formula?: string
  Category?: string
  Status?: 'Active' | 'Inactive'
  Notes?: string
  // Relationship to EF GWP (reverse relationship)
  efGwp?: string[] // Airtable record IDs of related EF GWP records
  efGwpCount?: number // Count of related EF GWP records
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  lastModifiedBy?: string
}

export interface CreateGHGTypeDto {
  Name?: string
  'Short code'?: string
  Description?: string
  Formula?: string
  Category?: string
  Status?: 'Active' | 'Inactive'
  Notes?: string
}

export interface UpdateGHGTypeDto {
  Name?: string
  'Short code'?: string
  Description?: string
  Formula?: string
  Category?: string
  Status?: 'Active' | 'Inactive'
  Notes?: string
}

