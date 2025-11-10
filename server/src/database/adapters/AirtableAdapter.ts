import { IDatabase, QueryOptions, PaginatedResult } from '../interfaces/IDatabase'
import { Company, CreateCompanyDto, UpdateCompanyDto } from '../../types/Company'
import { AirtableService } from '../../services/AirtableService'

/**
 * Airtable Database Adapter
 * 
 * Implements IDatabase interface using Airtable as the data source.
 * This adapter wraps the AirtableService and provides a database-agnostic interface.
 */
export class AirtableAdapter implements IDatabase {
  private airtableService: AirtableService

  constructor() {
    this.airtableService = new AirtableService()
  }

  getName(): string {
    return 'Airtable'
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Try to fetch one record to verify connection
      const companies = await this.airtableService.findAll()
      return companies.length >= 0 // Connection works if we can query
    } catch (error) {
      console.error('Airtable health check failed:', error)
      return false
    }
  }

  async findAllCompanies(options?: QueryOptions): Promise<Company[]> {
    try {
      console.log('📊 AirtableAdapter: Fetching companies from Airtable...')
      console.log(`   Token present: ${!!process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN}`)
      let companies = await this.airtableService.findAll()
      console.log(`✅ AirtableAdapter: Successfully fetched ${companies.length} companies from Airtable`)
      
      if (companies.length === 0) {
        console.warn('⚠️  AirtableAdapter: No companies returned from Airtable')
      } else {
        console.log(`📋 Sample company ID: ${companies[0]?.id}`)
        if (!companies[0]?.id?.startsWith('rec')) {
          console.warn('⚠️  WARNING: Company IDs do not start with "rec" - might not be Airtable data!')
        }
      }

      // Apply search filter if provided
      if (options?.search) {
        const searchLower = options.search.toLowerCase()
        companies = companies.filter(company =>
          company.companyName.toLowerCase().includes(searchLower) ||
          company.isinCode.toLowerCase().includes(searchLower) ||
          company.primarySector.toLowerCase().includes(searchLower) ||
          company.primaryActivity.toLowerCase().includes(searchLower) ||
          company.primaryIndustry.toLowerCase().includes(searchLower)
        )
      }

      // Apply filters
      if (options?.filters) {
        companies = companies.filter(company => {
          return Object.entries(options.filters!).every(([key, value]) => {
            const companyValue = (company as any)[key]
            return companyValue === value || 
                   (typeof companyValue === 'string' && companyValue.toLowerCase().includes(String(value).toLowerCase()))
          })
        })
      }

      // Apply sorting with natural/alphanumerical sort
      if (options?.sortBy) {
        const sortField = options.sortBy as keyof Company
        const sortOrder = options.sortOrder || 'asc'
        
        // Use natural sort for proper alphanumerical ordering (A1, A2, A10 instead of A1, A10, A2)
        const { naturalSort } = require('../utils/naturalSort')
        
        companies.sort((a, b) => {
          const aValue = a[sortField]
          const bValue = b[sortField]
          return naturalSort(aValue, bValue, sortOrder)
        })
      }

      // Apply pagination
      if (options?.offset !== undefined || options?.limit !== undefined) {
        const offset = options.offset || 0
        const limit = options.limit || companies.length
        companies = companies.slice(offset, offset + limit)
      }

      return companies
    } catch (error) {
      console.error('Error in AirtableAdapter.findAllCompanies:', error)
      throw error
    }
  }

  async findCompaniesPaginated(options?: QueryOptions): Promise<PaginatedResult<Company>> {
    const limit = options?.limit || 50
    const offset = options?.offset || 0

    // Use optimized pagination from AirtableService for large datasets
    // This fetches only the requested page instead of all records
    // Filters are now applied server-side via Airtable filterByFormula
    try {
      console.log(`📊 AirtableAdapter: Using optimized pagination with server-side filtering (offset=${offset}, limit=${limit})`)
      if (options?.filters) {
        console.log(`   Filters:`, options.filters)
      }
      if (options?.search) {
        console.log(`   Search:`, options.search)
      }
      
      const result = await this.airtableService.findPaginated(
        offset,
        limit,
        options?.sortBy,
        options?.sortOrder || 'asc',
        options?.filters, // Pass filters to service for server-side filtering
        options?.search   // Pass search to service for server-side filtering
      )

      // Map Airtable records to Company objects
      const companies = result.records.map(record => {
        try {
          return this.airtableService.mapAirtableToCompany(record)
        } catch (mapError) {
          console.error('Error mapping record:', record.id, mapError)
          return null
        }
      }).filter(company => company !== null) as Company[]

      // Filters and search are now applied server-side, so no client-side filtering needed
      // This ensures filters work across all records, not just the current page

      return {
        data: companies,
        total: result.total, // Total count reflects filtered results
        limit,
        offset,
        hasMore: offset + limit < result.total,
      }
    } catch (error) {
      console.error('Error in optimized pagination, falling back to full fetch:', error)
      // Fallback to old method if optimized pagination fails
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
  }

  async findCompanyById(id: string): Promise<Company | null> {
    try {
      return await this.airtableService.findById(id)
    } catch (error) {
      console.error('Error in AirtableAdapter.findCompanyById:', error)
      return null
    }
  }

  async createCompany(dto: CreateCompanyDto, userId: string = 'System'): Promise<Company> {
    try {
      return await this.airtableService.create({
        ...dto,
        createdBy: userId,
        lastModifiedBy: userId,
      })
    } catch (error) {
      console.error('Error in AirtableAdapter.createCompany:', error)
      throw error
    }
  }

  async updateCompany(id: string, dto: UpdateCompanyDto, userId: string = 'System'): Promise<Company | null> {
    try {
      console.log(`📝 AirtableAdapter: Updating company ${id}`)
      console.log(`   DTO fields:`, Object.keys(dto).join(', '))
      
      // Don't pass lastModifiedBy to Airtable - it's not a field in the table
      // Airtable tracks this automatically
      const updateData = { ...dto }
      delete (updateData as any).lastModifiedBy
      delete (updateData as any).createdBy
      
      const result = await this.airtableService.update(id, updateData)
      console.log(`✅ AirtableAdapter: Update successful`)
      return result
    } catch (error) {
      console.error('❌ Error in AirtableAdapter.updateCompany:', error)
      console.error('   Error details:', error instanceof Error ? error.message : error)
      throw error // Re-throw to let controller handle it properly
    }
  }

  async deleteCompany(id: string): Promise<boolean> {
    try {
      return await this.airtableService.delete(id)
    } catch (error) {
      console.error('Error in AirtableAdapter.deleteCompany:', error)
      return false
    }
  }

  async companyExists(id: string): Promise<boolean> {
    try {
      return await this.airtableService.exists(id)
    } catch (error) {
      console.error('Error in AirtableAdapter.companyExists:', error)
      return false
    }
  }

  async countCompanies(filters?: Record<string, any>): Promise<number> {
    try {
      const companies = await this.findAllCompanies({ filters })
      return companies.length
    } catch (error) {
      console.error('Error in AirtableAdapter.countCompanies:', error)
      return 0
    }
  }

  async getDistinctFieldValues(fieldName: string, limit: number = 1000): Promise<string[]> {
    try {
      return await this.airtableService.getDistinctValues(fieldName, limit)
    } catch (error) {
      console.error('Error in AirtableAdapter.getDistinctFieldValues:', error)
      return []
    }
  }
}

