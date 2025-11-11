/**
 * Unit Conversion Types
 */

export interface UnitConversion {
  id: string
  Name?: string
  'Unit to convert'?: string
  'Normalized unit'?: string
  'Conversion factor'?: number
  Description?: string
  'Activity Density'?: string | string[]
  'Activity Density Name'?: string | string[]
  Status?: 'Active' | 'Inactive'
  Notes?: string
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  lastModifiedBy?: string
}

export interface CreateUnitConversionDto {
  Name?: string
  'Unit to convert'?: string
  'Normalized unit'?: string
  'Conversion factor'?: number
  Description?: string
  'Activity Density'?: string | string[]
  Status?: 'Active' | 'Inactive'
  Notes?: string
}

export interface UpdateUnitConversionDto {
  Name?: string
  'Unit to convert'?: string
  'Normalized unit'?: string
  'Conversion factor'?: number
  Description?: string
  'Activity Density'?: string | string[]
  Status?: 'Active' | 'Inactive'
  Notes?: string
}

