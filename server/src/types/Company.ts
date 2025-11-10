export interface Company {
  id: string
  isinCode: string
  companyName: string
  status: 'Active' | 'Closed'
  primarySector: string
  primaryActivity: string
  primaryIndustry: string
  notes?: string
  createdBy: string
  created: string
  lastModifiedBy: string
  lastModified: string
}

export interface CreateCompanyDto {
  isinCode: string
  companyName: string
  status: 'Active' | 'Closed'
  primarySector?: string
  primaryActivity?: string
  primaryIndustry?: string
  notes?: string
}

export interface UpdateCompanyDto {
  isinCode?: string
  companyName?: string
  status?: 'Active' | 'Closed'
  primarySector?: string
  primaryActivity?: string
  primaryIndustry?: string
  notes?: string
}

