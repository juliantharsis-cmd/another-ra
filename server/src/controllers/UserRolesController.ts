import { Request, Response } from 'express'
import { UserRolesRepository } from '../data/UserRolesRepository'
import { CreateUserRoleDto, UpdateUserRoleDto } from '../types/UserRole'

const repository = new UserRolesRepository()

/**
 * User Roles Controller
 * Handles all HTTP requests for User Roles
 */
export class UserRolesController {
  /**
   * GET /api/user-roles
   * Get all or paginated User Roles records
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, search, sortBy, sortOrder, paginated } = req.query
      
      // Parse filters from query parameters
      const filters: Record<string, any> = {}
      Object.keys(req.query).forEach(key => {
        if (!['page', 'limit', 'search', 'sortBy', 'sortOrder', 'paginated'].includes(key)) {
          const value = req.query[key]
          if (value !== undefined && value !== null && value !== '') {
            // Handle array values (multiple query params with same name)
            if (Array.isArray(value)) {
              filters[key] = value
            } else if (typeof value === 'string' && value.includes(',')) {
              filters[key] = value.split(',')
            } else {
              filters[key] = value
            }
          }
        }
      })

      if (paginated === 'true' || page || limit) {
        const pageNum = page ? parseInt(page as string) : 1
        const limitNum = limit ? parseInt(limit as string) : 50
        const offset = (pageNum - 1) * limitNum

        const result = await repository.findPaginated({
          offset,
          limit: limitNum,
          search: search as string,
          sortBy: sortBy as string,
          sortOrder: (sortOrder as 'asc' | 'desc') || 'asc',
          filters: Object.keys(filters).length > 0 ? filters : undefined,
        })

        res.json({
          success: true,
          data: result.data,
          pagination: {
            total: result.total,
            page: pageNum,
            limit: limitNum,
            offset: result.offset,
            hasMore: result.hasMore,
          },
        })
      } else {
        const userRoles = await repository.findAll({
          search: search as string,
          sortBy: sortBy as string,
          sortOrder: (sortOrder as 'asc' | 'desc') || 'asc',
          filters: Object.keys(filters).length > 0 ? filters : undefined,
        })

        res.json({
          success: true,
          data: userRoles,
          count: userRoles.length,
        })
      }
    } catch (error: any) {
      console.error('Error in UserRolesController.getAll:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * GET /api/user-roles/:id
   * Get a single User Role by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const userRole = await repository.findById(id)

      if (!userRole) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: `User Role with ID ${id} not found`,
        })
        return
      }

      res.json({
        success: true,
        data: userRole,
      })
    } catch (error: any) {
      console.error('Error in UserRolesController.getById:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * POST /api/user-roles
   * Create a new User Role
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateUserRoleDto = req.body
      const userRole = await repository.create(dto)

      res.status(201).json({
        success: true,
        data: userRole,
      })
    } catch (error: any) {
      console.error('Error in UserRolesController.create:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * PUT /api/user-roles/:id
   * Update an existing User Role
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const dto: UpdateUserRoleDto = req.body
      const userRole = await repository.update(id, dto)

      if (!userRole) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: `User Role with ID ${id} not found`,
        })
        return
      }

      res.json({
        success: true,
        data: userRole,
      })
    } catch (error: any) {
      console.error('Error in UserRolesController.update:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * DELETE /api/user-roles/:id
   * Delete a User Role
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      await repository.delete(id)

      res.json({
        success: true,
        message: 'User Role deleted successfully',
      })
    } catch (error: any) {
      console.error('Error in UserRolesController.delete:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * GET /api/user-roles/filters/values
   * Get distinct values for filter fields
   */
  async getFilterValues(req: Request, res: Response): Promise<void> {
    try {
      const { field, limit } = req.query
      
      if (!field || typeof field !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Bad request',
          message: 'Field parameter is required',
        })
        return
      }

      const limitNum = limit ? parseInt(limit as string) : 100
      const values = await repository.getDistinctValues(field, limitNum)

      res.json({
        success: true,
        data: values,
      })
    } catch (error: any) {
      console.error('Error in UserRolesController.getFilterValues:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}

export const userRolesController = new UserRolesController()
