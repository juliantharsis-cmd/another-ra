/**
 * Application List Type Definitions
 * 
 * Defines the structure of Application List records from Airtable
 * Only synchronizes: Name, Description, Attachment, Status, Order
 */

export interface ApplicationList {
  id: string
  Name?: string
  Description?: string
  Attachment?: any[] // Airtable attachment field
  Status?: 'Active' | 'Inactive'
  Order?: number // Order/sequence field
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  lastModifiedBy?: string
}

export interface CreateApplicationListDto {
  Name?: string
  Description?: string
  Attachment?: any[]
  Status?: 'Active' | 'Inactive'
  Order?: number
}

export interface UpdateApplicationListDto {
  Name?: string
  Description?: string
  Attachment?: any[]
  Status?: 'Active' | 'Inactive'
  Order?: number
}

