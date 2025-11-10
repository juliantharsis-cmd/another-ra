import { EFGWP, CreateEFGWPDto, UpdateEFGWPDto } from '../types/EFGWP'
import { getEFGWPAirtableService } from '../services/EFGWPAirtableService'
import { QueryOptions, PaginatedResult } from '../database/interfaces/IDatabase'

/**
 * EF GWP Repository
 * 
 * Data access layer for EF GWP entities.
 * Currently uses Airtable, but can be swapped for PostgreSQL later.
 */
export class EFGWPRepository {
  /**
   * Get all EF GWP records
   */
  async findAll(options?: QueryOptions): Promise<EFGWP[]> {
    try {
      if (options?.limit || options?.offset) {
        const result = await this.findPaginated(options)
        return result.data
      }
      const service = getEFGWPAirtableService()
      return await service.findAll()
    } catch (error) {
      console.error('Error in EFGWPRepository.findAll:', error)
      throw error
    }
  }

  /**
   * Get paginated EF GWP records
   */
  async findPaginated(options?: QueryOptions): Promise<PaginatedResult<EFGWP>> {
    try {
      const limit = options?.limit || 50
      const offset = options?.offset || 0
      const service = getEFGWPAirtableService()
      
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
      console.error('Error in EFGWPRepository.findPaginated:', error)
      throw error
    }
  }

  /**
   * Get a single EF GWP record by ID
   */
  async findById(id: string): Promise<EFGWP | null> {
    try {
      const service = getEFGWPAirtableService()
      return await service.findById(id)
    } catch (error) {
      console.error('Error in EFGWPRepository.findById:', error)
      throw error
    }
  }

  /**
   * Create a new EF GWP record
   */
  async create(dto: CreateEFGWPDto, userId: string = 'System'): Promise<EFGWP> {
    try {
      const service = getEFGWPAirtableService()
      return await service.create({
        ...dto,
        createdBy: userId,
        lastModifiedBy: userId,
      })
    } catch (error) {
      console.error('Error in EFGWPRepository.create:', error)
      throw error
    }
  }

  /**
   * Update an existing EF GWP record
   */
  async update(id: string, dto: UpdateEFGWPDto, userId: string = 'System'): Promise<EFGWP | null> {
    try {
      const updateData = { ...dto }
      delete (updateData as any).lastModifiedBy
      delete (updateData as any).createdBy
      
      const service = getEFGWPAirtableService()
      return await service.update(id, {
        ...updateData,
        lastModifiedBy: userId,
      })
    } catch (error) {
      console.error('Error in EFGWPRepository.update:', error)
      throw error
    }
  }

  /**
   * Delete an EF GWP record
   */
  async delete(id: string): Promise<boolean> {
    try {
      const service = getEFGWPAirtableService()
      return await service.delete(id)
    } catch (error) {
      console.error('Error in EFGWPRepository.delete:', error)
      throw error
    }
  }

  /**
   * Get distinct field values for filtering
   */
  async getDistinctFieldValues(fieldName: string, limit?: number): Promise<string[]> {
    try {
      const service = getEFGWPAirtableService()
      return await service.getDistinctValues(fieldName, limit)
    } catch (error) {
      console.error('Error in EFGWPRepository.getDistinctFieldValues:', error)
      return []
    }
  }
}

// Singleton instance
export const efGwpRepository = new EFGWPRepository()

// Export alias for backward compatibility (deprecated)
export const emissionFactorRepository = efGwpRepository
export const EmissionFactorRepository = EFGWPRepository

