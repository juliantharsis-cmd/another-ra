import { Request, Response } from 'express'
import { userTableRepository } from '../data/UserTableRepository'
import { CreateUserTableDto, UpdateUserTableDto } from '../types/UserTable'
import { QueryOptions } from '../database/interfaces/IDatabase'

export class UserTableController {
  /**
   * GET /users
   * Retrieve all user table records with optional query parameters
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const {
        limit,
        offset,
        sortBy,
        sortOrder,
        search,
        status,
        category,
        paginated,
      } = req.query

      // Build query options
      const options: QueryOptions = {
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc' | undefined,
        search: search as string,
        filters: {
          ...(status && { status: status as string }),
          ...(category && { category: category as string }),
        },
      }

      // If paginated flag is set or limit/offset provided, use pagination
      if (paginated === 'true' || limit || offset) {
        const result = await userTableRepository.findPaginated(options)
        
        res.json({
          success: true,
          data: result.data,
          pagination: {
            total: result.total,
            limit: result.limit,
            offset: result.offset,
            hasMore: result.hasMore,
          },
        })
      } else {
        // Return all records
        const allRecords = await userTableRepository.findAll(options)
        res.json({
          success: true,
          data: allRecords,
          count: allRecords.length,
        })
      }
    } catch (error) {
      console.error('Error in UserTableController.getAll:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * GET /users/:id
   * Get a single user table record by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      console.log(`\n🔍 [UserTableController.getById] Request received for user ID: ${id}`)
      const userTable = await userTableRepository.findById(id)
      console.log(`✅ [UserTableController.getById] User record found:`, userTable ? 'Yes' : 'No')

      if (!userTable) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'user table record not found',
        })
        return
      }

      res.json({
        success: true,
        data: userTable,
      })
    } catch (error) {
      console.error('Error in UserTableController.getById:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * POST /users
   * Create a new user table record
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateUserTableDto = req.body
      const userId = (req.headers['x-user-id'] as string) || 'System'

      // Validate required fields
      if (!dto.Name) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Name is required',
        })
        return
      }

      const userTable = await userTableRepository.create(dto, userId)

      res.status(201).json({
        success: true,
        data: userTable,
      })
    } catch (error) {
      console.error('Error in UserTableController.create:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * PUT /users/:id
   * Update an existing user table record
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const dto: UpdateUserTableDto = req.body
      const userId = (req.headers['x-user-id'] as string) || 'System'

      const userTable = await userTableRepository.update(id, dto, userId)

      if (!userTable) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'user table record not found',
        })
        return
      }

      res.json({
        success: true,
        data: userTable,
      })
    } catch (error) {
      console.error('Error in UserTableController.update:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * DELETE /users/:id
   * Delete a user table record
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const deleted = await userTableRepository.delete(id)

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'user table record not found',
        })
        return
      }

      res.json({
        success: true,
        message: 'user table record deleted successfully',
      })
    } catch (error) {
      console.error('Error in UserTableController.delete:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * GET /users/filters/values
   * Get distinct filter values for a field
   */
  async getFilterValues(req: Request, res: Response): Promise<void> {
    try {
      const { field, limit } = req.query

      if (!field || typeof field !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Field parameter is required',
        })
        return
      }

      const validFields = ['status', 'category']
      if (!validFields.includes(field)) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: `Field must be one of: ${validFields.join(', ')}`,
        })
        return
      }

      const limitNum = limit ? parseInt(limit as string) : 1000
      const values = await userTableRepository.getDistinctFieldValues(field, limitNum)

      res.json({
        success: true,
        data: values,
      })
    } catch (error) {
      console.error('Error in UserTableController.getFilterValues:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}

// Export singleton instance
export const userTableController = new UserTableController()

