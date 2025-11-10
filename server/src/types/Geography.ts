/**
 * Geography DTOs and Types
 */

export interface Geography {
  id: string
  regionName: string
  country: string
  status: 'Active' | 'Inactive'
  notes?: string
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  lastModifiedBy?: string
}

export interface CreateGeographyDto {
  regionName: string
  country: string
  status?: 'Active' | 'Inactive'
  notes?: string
}

export interface UpdateGeographyDto {
  regionName?: string
  country?: string
  status?: 'Active' | 'Inactive'
  notes?: string
}








