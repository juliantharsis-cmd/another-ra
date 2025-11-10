import { ApplicationList, CreateApplicationListDto, UpdateApplicationListDto } from '../types/ApplicationList'
import { getApplicationListAirtableService } from '../services/ApplicationListAirtableService'
import { QueryOptions, PaginatedResult } from '../database/interfaces/IDatabase'

/**
 * Application List Repository
 * 
 * Data access layer for Application List entities.
 * Currently uses Airtable, but can be swapped for PostgreSQL later.
 */
export class ApplicationListRepository {
  /**
   * Get all Application List records
   */
  async findAll(options?: QueryOptions): Promise<ApplicationList[]> {
    try {
      if (options?.limit || options?.offset) {
        const result = await this.findPaginated(options)
        return result.data
      }
      const service = getApplicationListAirtableService()
      return await service.findAll()
    } catch (error) {
      console.error('Error in ApplicationListRepository.findAll:', error)
      throw error
    }
  }

  /**
   * Get paginated Application List records
   */
  async findPaginated(options?: QueryOptions): Promise<PaginatedResult<ApplicationList>> {
    try {
      const limit = options?.limit || 50
      const offset = options?.offset || 0
      const service = getApplicationListAirtableService()
      
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
        total: result.total,
        limit,
        offset,
        hasMore: offset + limit < result.total,
      }
    } catch (error) {
      console.error('Error in ApplicationListRepository.findPaginated:', error)
      throw error
    }
  }

  /**
   * Get a single Application List record by ID
   */
  async findById(id: string): Promise<ApplicationList | null> {
    try {
      const service = getApplicationListAirtableService()
      return await service.findById(id)
    } catch (error) {
      console.error('Error in ApplicationListRepository.findById:', error)
      throw error
    }
  }

  /**
   * Create a new Application List record
   */
  async create(dto: CreateApplicationListDto, userId: string = 'System'): Promise<ApplicationList> {
    try {
      const service = getApplicationListAirtableService()
      return await service.create(dto)
    } catch (error) {
      console.error('Error in ApplicationListRepository.create:', error)
      throw error
    }
  }

  /**
   * Update an existing Application List record
   */
  async update(id: string, dto: UpdateApplicationListDto, userId: string = 'System'): Promise<ApplicationList | null> {
    try {
      const service = getApplicationListAirtableService()
      return await service.update(id, dto)
    } catch (error) {
      console.error('Error in ApplicationListRepository.update:', error)
      throw error
    }
  }

  /**
   * Delete a Application List record
   */
  async delete(id: string): Promise<boolean> {
    try {
      const service = getApplicationListAirtableService()
      return await service.delete(id)
    } catch (error) {
      console.error('Error in ApplicationListRepository.delete:', error)
      throw error
    }
  }

  /**
   * Get distinct values for a field (for filter dropdowns)
   */
  async getDistinctFieldValues(fieldName: string, limit: number = 1000): Promise<string[]> {
    try {
      const service = getApplicationListAirtableService()
      return await service.getDistinctValues(fieldName, limit)
    } catch (error) {
      console.error('Error in ApplicationListRepository.getDistinctFieldValues:', error)
      return []
    }
  }
}

// Export singleton instance
export const applicationListRepository = new ApplicationListRepository()

