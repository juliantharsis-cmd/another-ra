import { IndustryClassification, CreateIndustryClassificationDto, UpdateIndustryClassificationDto } from '../types/IndustryClassification'
import { getIndustryClassificationAirtableService } from '../services/IndustryClassificationAirtableService'
import { getIndustryClassificationPostgreSQLService } from '../services/IndustryClassificationPostgreSQLService'

interface QueryOptions {
  offset?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, any>
  search?: string
}

interface PaginatedResult<T> {
  data: T[]
  pagination: {
    total: number
    offset: number
    limit: number
    hasMore: boolean
  }
}

/**
 * Industry Classification Repository
 * 
 * Data access layer for Industry Classification entities.
 * Uses repository pattern to abstract the underlying database service.
 */
export class IndustryClassificationRepository {
  private getService() {
    const databaseType = process.env.DATABASE_TYPE || 'airtable'
    
    if (databaseType === 'postgresql') {
      return getIndustryClassificationPostgreSQLService()
    }
    
    return getIndustryClassificationAirtableService()
  }

  /**
   * Get all Industry Classification records
   */
  async findAll(options?: QueryOptions): Promise<IndustryClassification[]> {
    try {
      const service = this.getService()
      return await service.findAll()
    } catch (error: any) {
      console.error('Error in IndustryClassificationRepository.findAll:', error)
      throw error
    }
  }

  /**
   * Get paginated Industry Classification records
   */
  async findPaginated(options?: QueryOptions): Promise<PaginatedResult<IndustryClassification>> {
    try {
      const service = this.getService()
      const offset = options?.offset || 0
      const limit = options?.limit || 25
      const result = await service.findPaginated(
        offset,
        limit,
        options?.sortBy,
        options?.sortOrder || 'asc',
        options?.filters,
        options?.search
      )

      return {
        data: result.records,
        pagination: {
          total: result.total,
          offset,
          limit,
          hasMore: offset + limit < result.total,
        },
      }
    } catch (error: any) {
      console.error('Error in IndustryClassificationRepository.findPaginated:', error)
      throw error
    }
  }

  /**
   * Get a single Industry Classification record by ID
   */
  async findById(id: string): Promise<IndustryClassification | null> {
    try {
      const service = this.getService()
      return await service.findById(id)
    } catch (error: any) {
      console.error('Error in IndustryClassificationRepository.findById:', error)
      throw error
    }
  }

  /**
   * Create a new Industry Classification record
   */
  async create(dto: CreateIndustryClassificationDto, userId: string = 'System'): Promise<IndustryClassification> {
    try {
      const service = this.getService()
      return await service.create(dto)
    } catch (error: any) {
      console.error('Error in IndustryClassificationRepository.create:', error)
      throw error
    }
  }

  /**
   * Update an existing Industry Classification record
   */
  async update(id: string, dto: UpdateIndustryClassificationDto, userId: string = 'System'): Promise<IndustryClassification | null> {
    try {
      const service = this.getService()
      return await service.update(id, dto)
    } catch (error: any) {
      console.error('Error in IndustryClassificationRepository.update:', error)
      throw error
    }
  }

  /**
   * Delete an Industry Classification record
   */
  async delete(id: string): Promise<void> {
    try {
      const service = this.getService()
      await service.delete(id)
    } catch (error: any) {
      console.error('Error in IndustryClassificationRepository.delete:', error)
      throw error
    }
  }

  /**
   * Get distinct values for a field (for filters)
   */
  async getDistinctValues(field: string, limit: number = 100): Promise<string[]> {
    try {
      const service = this.getService()
      return await service.getDistinctValues(field, limit)
    } catch (error: any) {
      console.error(`Error in IndustryClassificationRepository.getDistinctValues for field ${field}:`, error)
      return []
    }
  }
}

