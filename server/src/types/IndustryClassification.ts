/**
 * Industry Classification & Emission Factors Entity
 */

export interface IndustryClassification {
  id: string
  Name?: string
  Description?: string
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  lastModifiedBy?: string
  [key: string]: any // Allow additional fields from Airtable
}

export interface CreateIndustryClassificationDto {
  Name: string
  Description?: string
  [key: string]: any
}

export interface UpdateIndustryClassificationDto {
  Name?: string
  Description?: string
  [key: string]: any
}

