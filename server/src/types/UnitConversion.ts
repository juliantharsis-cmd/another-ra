/**
 * Unit Conversion Types
 */

export interface UnitConversion {
  id: string
  Name?: string
  'Unit to convert'?: string | string[]
  'Unit to convert Name'?: string | string[]
  'Dimension (from Unit to convert)'?: string
  'Normalized unit'?: string | string[]
  'Normalized unit Name'?: string | string[]
  'Dimension (from Normalized unit)'?: string
  Value?: number
  'Conversion value'?: number
  Type?: string
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
  'Unit to convert'?: string | string[]
  'Dimension (from Unit to convert)'?: string | string[]
  'Normalized unit'?: string | string[]
  'Dimension (from Normalized unit)'?: string | string[]
  Value?: number
  'Conversion value'?: number
  Type?: string
  Description?: string
  'Activity Density'?: string | string[]
  Status?: 'Active' | 'Inactive'
  Notes?: string
}

export interface UpdateUnitConversionDto {
  Name?: string
  'Unit to convert'?: string | string[]
  'Dimension (from Unit to convert)'?: string | string[]
  'Normalized unit'?: string | string[]
  'Dimension (from Normalized unit)'?: string | string[]
  Value?: number
  'Conversion value'?: number
  Type?: string
  Description?: string
  'Activity Density'?: string | string[]
  Status?: 'Active' | 'Inactive'
  Notes?: string
}

