import { Geography, CreateGeographyDto, UpdateGeographyDto } from '../types/Geography'
import { getGeographyAirtableService } from '../services/GeographyAirtableService'
import { QueryOptions, PaginatedResult } from '../database/interfaces/IDatabase'

/**
 * Geography Repository
 * 
 * Data access layer for Geography entities.
 * Currently uses Airtable, but can be swapped for PostgreSQL later.
 */
export class GeographyRepository {
  /**
   * Get all geography records
   */
  async findAll(options?: QueryOptions): Promise<Geography[]> {
    try {
      if (options?.limit || options?.offset) {
        const result = await this.findPaginated(options)
        return result.data
      }
      const service = getGeographyAirtableService()
      return await service.findAll()
    } catch (error) {
      console.error('Error in GeographyRepository.findAll:', error)
      throw error
    }
  }

  /**
   * Get paginated geography records
   */
  async findPaginated(options?: QueryOptions): Promise<PaginatedResult<Geography>> {
    try {
      const limit = options?.limit || 50
      const offset = options?.offset || 0
      const service = getGeographyAirtableService()
      
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
      console.error('Error in GeographyRepository.findPaginated:', error)
      throw error
    }
  }

  /**
   * Get a single geography record by ID
   */
  async findById(id: string): Promise<Geography | null> {
    try {
      const service = getGeographyAirtableService()
      return await service.findById(id)
    } catch (error) {
      console.error('Error in GeographyRepository.findById:', error)
      throw error
    }
  }

  /**
   * Create a new geography record
   */
  async create(dto: CreateGeographyDto, userId: string = 'System'): Promise<Geography> {
    try {
      const service = getGeographyAirtableService()
      return await service.create({
        ...dto,
        createdBy: userId,
        lastModifiedBy: userId,
      })
    } catch (error) {
      console.error('Error in GeographyRepository.create:', error)
      throw error
    }
  }

  /**
   * Update an existing geography record
   */
  async update(id: string, dto: UpdateGeographyDto, userId: string = 'System'): Promise<Geography | null> {
    try {
      const updateData = { ...dto }
      delete (updateData as any).lastModifiedBy
      delete (updateData as any).createdBy
      
      const service = getGeographyAirtableService()
      return await service.update(id, {
        ...updateData,
        lastModifiedBy: userId,
      })
    } catch (error) {
      console.error('Error in GeographyRepository.update:', error)
      throw error
    }
  }

  /**
   * Delete a geography record
   */
  async delete(id: string): Promise<boolean> {
    try {
      const service = getGeographyAirtableService()
      return await service.delete(id)
    } catch (error) {
      console.error('Error in GeographyRepository.delete:', error)
      throw error
    }
  }

  /**
   * Get distinct field values for filtering
   */
  async getDistinctFieldValues(fieldName: string, limit?: number): Promise<string[]> {
    try {
      const service = getGeographyAirtableService()
      return await service.getDistinctValues(fieldName, limit)
    } catch (error) {
      console.error('Error in GeographyRepository.getDistinctFieldValues:', error)
      return []
    }
  }
}

// Singleton instance
export const geographyRepository = new GeographyRepository()

