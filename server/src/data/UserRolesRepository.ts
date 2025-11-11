import { UserRole, CreateUserRoleDto, UpdateUserRoleDto } from '../types/UserRole'
import { getUserRolesAirtableService } from '../services/UserRolesAirtableService'
import { getUserRolesPostgreSQLService } from '../services/UserRolesPostgreSQLService'
import { QueryOptions, PaginatedResult } from '../database/interfaces/IDatabase'

/**
 * User Roles Repository
 * 
 * Data access layer for User Roles entities.
 * Supports both Airtable and PostgreSQL (database-agnostic).
 * Switch between databases by setting DATABASE_TYPE environment variable.
 */
export class UserRolesRepository {
  private getService() {
    const databaseType = process.env.DATABASE_TYPE || 'airtable'
    
    if (databaseType === 'postgresql') {
      return getUserRolesPostgreSQLService()
    }
    
    // Default to Airtable
    return getUserRolesAirtableService()
  }
  /**
   * Get all User Roles records
   */
  async findAll(options?: QueryOptions): Promise<UserRole[]> {
    try {
      if (options?.limit || options?.offset) {
        const result = await this.findPaginated(options)
        return result.data
      }
      const service = this.getService()
      return await service.findAll()
    } catch (error) {
      console.error('Error in UserRolesRepository.findAll:', error)
      throw error
    }
  }

  /**
   * Get paginated User Roles records
   */
  async findPaginated(options?: QueryOptions): Promise<PaginatedResult<UserRole>> {
    try {
      const limit = options?.limit || 50
      const offset = options?.offset || 0
      const service = this.getService()
      
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
      console.error('Error in UserRolesRepository.findPaginated:', error)
      throw error
    }
  }

  /**
   * Get a single User Role record by ID
   */
  async findById(id: string): Promise<UserRole | null> {
    try {
      const service = this.getService()
      return await service.findById(id)
    } catch (error) {
      console.error('Error in UserRolesRepository.findById:', error)
      throw error
    }
  }

  /**
   * Create a new User Role record
   */
  async create(dto: CreateUserRoleDto, userId: string = 'System'): Promise<UserRole> {
    try {
      const service = this.getService()
      return await service.create(dto)
    } catch (error) {
      console.error('Error in UserRolesRepository.create:', error)
      throw error
    }
  }

  /**
   * Update an existing User Role record
   */
  async update(id: string, dto: UpdateUserRoleDto, userId: string = 'System'): Promise<UserRole | null> {
    try {
      const service = this.getService()
      return await service.update(id, dto)
    } catch (error) {
      console.error('Error in UserRolesRepository.update:', error)
      throw error
    }
  }

  /**
   * Delete a User Role record
   */
  async delete(id: string): Promise<void> {
    try {
      const service = this.getService()
      await service.delete(id)
    } catch (error) {
      console.error('Error in UserRolesRepository.delete:', error)
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
    } catch (error) {
      console.error(`Error in UserRolesRepository.getDistinctValues for field ${field}:`, error)
      return []
    }
  }
}

