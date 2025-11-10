/**
 * user table Type Definitions
 * 
 * Defines the structure of user table records from Airtable
 */

export interface UserTable {
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

export interface CreateUserTableDto {
  Name?: string
  'Short code'?: string
  Description?: string
  Formula?: string
  Category?: string
  Status?: 'Active' | 'Inactive'
  Notes?: string
}

export interface UpdateUserTableDto {
  Name?: string
  'Short code'?: string
  Description?: string
  Formula?: string
  Category?: string
  Status?: 'Active' | 'Inactive'
  Notes?: string
}

