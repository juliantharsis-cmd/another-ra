import { Company, CreateCompanyDto, UpdateCompanyDto } from '../../types/Company'

/**
 * Query options for database operations
 */
export interface QueryOptions {
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, any>
  search?: string
}

/**
 * Database result with pagination metadata
 */
export interface PaginatedResult<T> {
  data: T[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

/**
 * Database Interface
 * 
 * This interface defines the contract for all database implementations.
 * Any database (Airtable, PostgreSQL, MongoDB, etc.) must implement this interface.
 * 
 * This allows the API to switch between databases without changing the business logic.
 */
export interface IDatabase {
  /**
   * Get the name of the database implementation
   */
  getName(): string

  /**
   * Check if the database connection is healthy
   */
  healthCheck(): Promise<boolean>

  /**
   * Find all companies with optional query options
   */
  findAllCompanies(options?: QueryOptions): Promise<Company[]>

  /**
   * Find companies with pagination
   */
  findCompaniesPaginated(options?: QueryOptions): Promise<PaginatedResult<Company>>

  /**
   * Find a single company by ID
   */
  findCompanyById(id: string): Promise<Company | null>

  /**
   * Create a new company
   */
  createCompany(dto: CreateCompanyDto, userId?: string): Promise<Company>

  /**
   * Update an existing company
   */
  updateCompany(id: string, dto: UpdateCompanyDto, userId?: string): Promise<Company | null>

  /**
   * Delete a company
   */
  deleteCompany(id: string): Promise<boolean>

  /**
   * Check if a company exists
   */
  companyExists(id: string): Promise<boolean>

  /**
   * Count total companies (for pagination)
   */
  countCompanies(filters?: Record<string, any>): Promise<number>
}

