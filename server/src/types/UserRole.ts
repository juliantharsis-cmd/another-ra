/**
 * User Role Entity
 */

export interface UserRole {
  id: string
  Name?: string
  Description?: string
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  lastModifiedBy?: string
  [key: string]: any // Allow additional fields from Airtable
}

export interface CreateUserRoleDto {
  Name: string
  Description?: string
  [key: string]: any
}

export interface UpdateUserRoleDto {
  Name?: string
  Description?: string
  [key: string]: any
}

