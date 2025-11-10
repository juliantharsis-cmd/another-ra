import { IDatabase, QueryOptions, PaginatedResult } from '../interfaces/IDatabase'
import { Company, CreateCompanyDto, UpdateCompanyDto } from '../../types/Company'
import { mockCompanies } from '../../data/mockData'

/**
 * Mock Database Adapter
 * 
 * Implements IDatabase interface using in-memory mock data.
 * Useful for development, testing, or as a fallback when other databases are unavailable.
 */
export class MockAdapter implements IDatabase {
  private companies: Company[]

  constructor() {
    // Create a mutable copy of mock data
    this.companies = [...mockCompanies]
  }

  getName(): string {
    return 'Mock (In-Memory)'
  }

  async healthCheck(): Promise<boolean> {
    return true // Mock data is always available
  }

  async findAllCompanies(options?: QueryOptions): Promise<Company[]> {
    let result = [...this.companies]

    // Apply search filter
    if (options?.search) {
      const searchLower = options.search.toLowerCase()
      result = result.filter(company =>
        company.companyName.toLowerCase().includes(searchLower) ||
        company.isinCode.toLowerCase().includes(searchLower) ||
        company.primarySector.toLowerCase().includes(searchLower) ||
        company.primaryActivity.toLowerCase().includes(searchLower) ||
        company.primaryIndustry.toLowerCase().includes(searchLower)
      )
    }

    // Apply filters
    if (options?.filters) {
      result = result.filter(company => {
        return Object.entries(options.filters!).every(([key, value]) => {
          const companyValue = (company as any)[key]
          return companyValue === value
        })
      })
    }

    // Apply sorting with natural/alphanumerical sort
    if (options?.sortBy) {
      const sortField = options.sortBy as keyof Company
      const sortOrder = options.sortOrder || 'asc'
      
      // Import natural sort utility
      const { naturalSort } = require('../utils/naturalSort')
      
      result.sort((a, b) => {
        const aValue = a[sortField]
        const bValue = b[sortField]
        return naturalSort(aValue, bValue, sortOrder)
      })
    }

    // Apply pagination
    if (options?.offset !== undefined || options?.limit !== undefined) {
      const offset = options.offset || 0
      const limit = options.limit || result.length
      result = result.slice(offset, offset + limit)
    }

    return result
  }

  async findCompaniesPaginated(options?: QueryOptions): Promise<PaginatedResult<Company>> {
    const limit = options?.limit || 50
    const offset = options?.offset || 0

    const allCompanies = await this.findAllCompanies({
      ...options,
      limit: undefined,
      offset: undefined,
    })

    const total = allCompanies.length
    const paginatedData = allCompanies.slice(offset, offset + limit)

    return {
      data: paginatedData,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    }
  }

  async findCompanyById(id: string): Promise<Company | null> {
    return this.companies.find(c => c.id === id) || null
  }

  async createCompany(dto: CreateCompanyDto, userId: string = 'System'): Promise<Company> {
    const now = new Date().toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

    const newCompany: Company = {
      id: `company-${Date.now()}`,
      isinCode: dto.isinCode,
      companyName: dto.companyName,
      name: dto.name || dto.companyName,
      status: dto.status,
      primarySector: dto.primarySector || '',
      primaryActivity: dto.primaryActivity || '',
      primaryIndustry: dto.primaryIndustry || '',
      notes: dto.notes || '',
      createdBy: userId,
      created: now,
      lastModifiedBy: userId,
      lastModified: now,
    }

    this.companies.push(newCompany)
    return newCompany
  }

  async updateCompany(id: string, dto: UpdateCompanyDto, userId: string = 'System'): Promise<Company | null> {
    const index = this.companies.findIndex(c => c.id === id)
    if (index === -1) {
      return null
    }

    const now = new Date().toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

    const updatedCompany: Company = {
      ...this.companies[index],
      ...dto,
      lastModifiedBy: userId,
      lastModified: now,
    }

    this.companies[index] = updatedCompany
    return updatedCompany
  }

  async deleteCompany(id: string): Promise<boolean> {
    const index = this.companies.findIndex(c => c.id === id)
    if (index === -1) {
      return false
    }

    this.companies.splice(index, 1)
    return true
  }

  async companyExists(id: string): Promise<boolean> {
    return this.companies.some(c => c.id === id)
  }

  async countCompanies(filters?: Record<string, any>): Promise<number> {
    const companies = await this.findAllCompanies({ filters })
    return companies.length
  }

  async getDistinctFieldValues(fieldName: string, limit: number = 1000): Promise<string[]> {
    const companies = await this.findAllCompanies()
    const values = new Set<string>()
    
    companies.forEach(company => {
      const value = (company as any)[fieldName]
      if (value && typeof value === 'string' && value.trim()) {
        values.add(value.trim())
      }
    })
    
    return Array.from(values).sort().slice(0, limit)
  }
}

