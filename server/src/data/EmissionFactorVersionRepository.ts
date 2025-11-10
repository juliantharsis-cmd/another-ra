import { EmissionFactorVersion, CreateEmissionFactorVersionDto, UpdateEmissionFactorVersionDto } from '../types/EmissionFactorVersion'
import { getEmissionFactorVersionAirtableService } from '../services/EmissionFactorVersionAirtableService'
import { QueryOptions, PaginatedResult } from '../database/interfaces/IDatabase'

/**
 * Emission Factor Version Repository
 * 
 * Data access layer for Emission Factor Version entities.
 * Currently uses Airtable, but can be swapped for PostgreSQL later.
 */
export class EmissionFactorVersionRepository {
  /**
   * Get all Emission Factor Version records
   */
  async findAll(options?: QueryOptions): Promise<EmissionFactorVersion[]> {
    try {
      if (options?.limit || options?.offset) {
        const result = await this.findPaginated(options)
        return result.data
      }
      const service = getEmissionFactorVersionAirtableService()
      return await service.findAll()
    } catch (error) {
      console.error('Error in EmissionFactorVersionRepository.findAll:', error)
      throw error
    }
  }

  /**
   * Get paginated Emission Factor Version records
   */
  async findPaginated(options?: QueryOptions): Promise<PaginatedResult<EmissionFactorVersion>> {
    try {
      const limit = options?.limit || 50
      const offset = options?.offset || 0
      const service = getEmissionFactorVersionAirtableService()
      
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
      console.error('Error in EmissionFactorVersionRepository.findPaginated:', error)
      throw error
    }
  }

  /**
   * Get a single Emission Factor Version record by ID
   */
  async findById(id: string): Promise<EmissionFactorVersion | null> {
    try {
      const service = getEmissionFactorVersionAirtableService()
      return await service.findById(id)
    } catch (error) {
      console.error('Error in EmissionFactorVersionRepository.findById:', error)
      throw error
    }
  }

  /**
   * Create a new Emission Factor Version record
   */
  async create(dto: CreateEmissionFactorVersionDto, userId: string = 'System'): Promise<EmissionFactorVersion> {
    try {
      const service = getEmissionFactorVersionAirtableService()
      return await service.create(dto)
    } catch (error) {
      console.error('Error in EmissionFactorVersionRepository.create:', error)
      throw error
    }
  }

  /**
   * Update an existing Emission Factor Version record
   */
  async update(id: string, dto: UpdateEmissionFactorVersionDto, userId: string = 'System'): Promise<EmissionFactorVersion | null> {
    try {
      const service = getEmissionFactorVersionAirtableService()
      return await service.update(id, dto)
    } catch (error) {
      console.error('Error in EmissionFactorVersionRepository.update:', error)
      throw error
    }
  }

  /**
   * Delete a Emission Factor Version record
   */
  async delete(id: string): Promise<boolean> {
    try {
      const service = getEmissionFactorVersionAirtableService()
      return await service.delete(id)
    } catch (error) {
      console.error('Error in EmissionFactorVersionRepository.delete:', error)
      throw error
    }
  }

  /**
   * Get distinct values for a field (for filter dropdowns)
   */
  async getDistinctFieldValues(fieldName: string, limit: number = 1000): Promise<string[]> {
    try {
      const service = getEmissionFactorVersionAirtableService()
      return await service.getDistinctValues(fieldName, limit)
    } catch (error) {
      console.error('Error in EmissionFactorVersionRepository.getDistinctFieldValues:', error)
      return []
    }
  }
}

// Export singleton instance
export const emissionFactorVersionRepository = new EmissionFactorVersionRepository()

