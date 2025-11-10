import { GHGType, CreateGHGTypeDto, UpdateGHGTypeDto } from '../types/GHGType'
import { getGHGTypeAirtableService } from '../services/GHGTypeAirtableService'
import { QueryOptions, PaginatedResult } from '../database/interfaces/IDatabase'

/**
 * GHG Type Repository
 * 
 * Data access layer for GHG Type entities.
 * Currently uses Airtable, but can be swapped for PostgreSQL later.
 */
export class GHGTypeRepository {
  /**
   * Get all GHG Type records
   */
  async findAll(options?: QueryOptions): Promise<GHGType[]> {
    try {
      if (options?.limit || options?.offset) {
        const result = await this.findPaginated(options)
        return result.data
      }
      const service = getGHGTypeAirtableService()
      return await service.findAll()
    } catch (error) {
      console.error('Error in GHGTypeRepository.findAll:', error)
      throw error
    }
  }

  /**
   * Get paginated GHG Type records
   */
  async findPaginated(options?: QueryOptions): Promise<PaginatedResult<GHGType>> {
    try {
      const limit = options?.limit || 50
      const offset = options?.offset || 0
      const service = getGHGTypeAirtableService()
      
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
      console.error('Error in GHGTypeRepository.findPaginated:', error)
      throw error
    }
  }

  /**
   * Get a single GHG Type record by ID
   */
  async findById(id: string): Promise<GHGType | null> {
    try {
      const service = getGHGTypeAirtableService()
      return await service.findById(id)
    } catch (error) {
      console.error('Error in GHGTypeRepository.findById:', error)
      throw error
    }
  }

  /**
   * Create a new GHG Type record
   */
  async create(dto: CreateGHGTypeDto, userId: string = 'System'): Promise<GHGType> {
    try {
      const service = getGHGTypeAirtableService()
      return await service.create(dto)
    } catch (error) {
      console.error('Error in GHGTypeRepository.create:', error)
      throw error
    }
  }

  /**
   * Update an existing GHG Type record
   */
  async update(id: string, dto: UpdateGHGTypeDto, userId: string = 'System'): Promise<GHGType | null> {
    try {
      const service = getGHGTypeAirtableService()
      return await service.update(id, dto)
    } catch (error) {
      console.error('Error in GHGTypeRepository.update:', error)
      throw error
    }
  }

  /**
   * Delete a GHG Type record
   */
  async delete(id: string): Promise<boolean> {
    try {
      const service = getGHGTypeAirtableService()
      return await service.delete(id)
    } catch (error) {
      console.error('Error in GHGTypeRepository.delete:', error)
      throw error
    }
  }

  /**
   * Get distinct values for a field (for filter dropdowns)
   */
  async getDistinctFieldValues(fieldName: string, limit: number = 1000): Promise<string[]> {
    try {
      const service = getGHGTypeAirtableService()
      return await service.getDistinctValues(fieldName, limit)
    } catch (error) {
      console.error('Error in GHGTypeRepository.getDistinctFieldValues:', error)
      return []
    }
  }
}

// Export singleton instance
export const ghgTypeRepository = new GHGTypeRepository()

