import { UserTable, CreateUserTableDto, UpdateUserTableDto } from '../types/UserTable'
import { getUserTableAirtableService } from '../services/UserTableAirtableService'
import { QueryOptions, PaginatedResult } from '../database/interfaces/IDatabase'

/**
 * user table Repository
 * 
 * Data access layer for user table entities.
 * Currently uses Airtable, but can be swapped for PostgreSQL later.
 */
export class UserTableRepository {
  /**
   * Get all user table records
   */
  async findAll(options?: QueryOptions): Promise<UserTable[]> {
    try {
      if (options?.limit || options?.offset) {
        const result = await this.findPaginated(options)
        return result.data
      }
      const service = getUserTableAirtableService()
      return await service.findAll()
    } catch (error) {
      console.error('Error in UserTableRepository.findAll:', error)
      throw error
    }
  }

  /**
   * Get paginated user table records
   */
  async findPaginated(options?: QueryOptions): Promise<PaginatedResult<UserTable>> {
    try {
      const limit = options?.limit || 50
      const offset = options?.offset || 0
      const service = getUserTableAirtableService()
      
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
      console.error('Error in UserTableRepository.findPaginated:', error)
      throw error
    }
  }

  /**
   * Get a single user table record by ID
   */
  async findById(id: string): Promise<UserTable | null> {
    try {
      console.log(`\n🔍 [UserTableRepository.findById] Looking up user ID: ${id}`)
      const service = getUserTableAirtableService()
      const result = await service.findById(id)
      console.log(`✅ [UserTableRepository.findById] Result:`, result ? `Found (has ${Object.keys(result || {}).length} fields)` : 'Not found')
      return result
    } catch (error) {
      console.error('Error in UserTableRepository.findById:', error)
      throw error
    }
  }

  /**
   * Create a new user table record
   */
  async create(dto: CreateUserTableDto, userId: string = 'System'): Promise<UserTable> {
    try {
      const service = getUserTableAirtableService()
      return await service.create(dto)
    } catch (error) {
      console.error('Error in UserTableRepository.create:', error)
      throw error
    }
  }

  /**
   * Update an existing user table record
   */
  async update(id: string, dto: UpdateUserTableDto, userId: string = 'System'): Promise<UserTable | null> {
    try {
      const service = getUserTableAirtableService()
      return await service.update(id, dto)
    } catch (error) {
      console.error('Error in UserTableRepository.update:', error)
      throw error
    }
  }

  /**
   * Delete a user table record
   */
  async delete(id: string): Promise<boolean> {
    try {
      const service = getUserTableAirtableService()
      return await service.delete(id)
    } catch (error) {
      console.error('Error in UserTableRepository.delete:', error)
      throw error
    }
  }

  /**
   * Get distinct values for a field (for filter dropdowns)
   */
  async getDistinctFieldValues(fieldName: string, limit: number = 1000): Promise<string[]> {
    try {
      const service = getUserTableAirtableService()
      return await service.getDistinctValues(fieldName, limit)
    } catch (error) {
      console.error('Error in UserTableRepository.getDistinctFieldValues:', error)
      return []
    }
  }

  /**
   * Get linked record filter values (only values actually used in user table)
   * Returns format: "Name|ID"
   */
  async getLinkedRecordFilterValues(
    fieldName: 'Company' | 'User Roles' | 'Modules',
    limit: number = 1000
  ): Promise<string[]> {
    try {
      const service = getUserTableAirtableService()
      return await service.getLinkedRecordFilterValues(fieldName, limit)
    } catch (error) {
      console.error('Error in UserTableRepository.getLinkedRecordFilterValues:', error)
      return []
    }
  }
}

// Export singleton instance
export const userTableRepository = new UserTableRepository()

