import { Company, CreateCompanyDto, UpdateCompanyDto } from '../types/Company'
import { IDatabase, QueryOptions, PaginatedResult } from '../database/interfaces/IDatabase'
import { DatabaseFactory } from '../database/DatabaseFactory'

/**
 * Company Repository
 * 
 * High-level data access layer for companies.
 * Uses the database abstraction layer to interact with any database backend.
 * 
 * The repository provides a clean interface for business logic,
 * while the database adapter handles the specific database implementation.
 */
export class CompanyRepository {
  private database: IDatabase

  constructor() {
    // Ensure environment is loaded before getting database
    // This is a safety check in case Repository is imported before dotenv.config()
    if (!process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN && !process.env.AIRTABLE_API_KEY) {
      console.warn('⚠️  WARNING: Airtable credentials not found when initializing CompanyRepository')
      console.warn('   Make sure .env file is loaded before importing CompanyRepository')
    }
    
    this.database = DatabaseFactory.getDatabase()
    console.log(`📦 CompanyRepository initialized with: ${this.database.getName()}`)
  }

  /**
   * Get all companies with optional query options
   */
  async findAll(options?: QueryOptions): Promise<Company[]> {
    try {
      return await this.database.findAllCompanies(options)
    } catch (error) {
      console.error('Error in CompanyRepository.findAll:', error)
      throw error
    }
  }

  /**
   * Get companies with pagination
   */
  async findPaginated(options?: QueryOptions): Promise<PaginatedResult<Company>> {
    try {
      return await this.database.findCompaniesPaginated(options)
    } catch (error) {
      console.error('Error in CompanyRepository.findPaginated:', error)
      throw error
    }
  }

  /**
   * Get a company by ID
   */
  async findById(id: string): Promise<Company | null> {
    try {
      return await this.database.findCompanyById(id)
    } catch (error) {
      console.error('Error in CompanyRepository.findById:', error)
      return null
    }
  }

  /**
   * Create a new company
   */
  async create(dto: CreateCompanyDto, userId: string = 'System'): Promise<Company> {
    try {
      return await this.database.createCompany(dto, userId)
    } catch (error) {
      console.error('Error in CompanyRepository.create:', error)
      throw error
    }
  }

  /**
   * Update an existing company
   */
  async update(id: string, dto: UpdateCompanyDto, userId: string = 'System'): Promise<Company | null> {
    try {
      return await this.database.updateCompany(id, dto, userId)
    } catch (error) {
      console.error('Error in CompanyRepository.update:', error)
      return null
    }
  }

  /**
   * Delete a company
   */
  async delete(id: string): Promise<boolean> {
    try {
      return await this.database.deleteCompany(id)
    } catch (error) {
      console.error('Error in CompanyRepository.delete:', error)
      return false
    }
  }

  /**
   * Check if a company exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      return await this.database.companyExists(id)
    } catch (error) {
      console.error('Error in CompanyRepository.exists:', error)
      return false
    }
  }

  /**
   * Count companies with optional filters
   */
  async count(filters?: Record<string, any>): Promise<number> {
    try {
      return await this.database.countCompanies(filters)
    } catch (error) {
      console.error('Error in CompanyRepository.count:', error)
      return 0
    }
  }

  /**
   * Get database health status
   */
  async healthCheck(): Promise<boolean> {
    try {
      return await this.database.healthCheck()
    } catch (error) {
      console.error('Error in CompanyRepository.healthCheck:', error)
      return false
    }
  }

  /**
   * Get distinct values for a field (for filter dropdowns)
   */
  async getDistinctFieldValues(fieldName: string, limit?: number): Promise<string[]> {
    try {
      return await this.database.getDistinctFieldValues(fieldName, limit)
    } catch (error) {
      console.error('Error in CompanyRepository.getDistinctFieldValues:', error)
      return []
    }
  }
}

// Singleton instance
export const companyRepository = new CompanyRepository()

