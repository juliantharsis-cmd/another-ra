import { Request, Response } from 'express'
import { applicationListRepository } from '../data/ApplicationListRepository'
import { CreateApplicationListDto, UpdateApplicationListDto } from '../types/ApplicationList'
import { QueryOptions } from '../database/interfaces/IDatabase'

export class ApplicationListController {
  /**
   * GET //api/application-list
   * Retrieve all Application List records with optional query parameters
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
        },
      }

      // If paginated flag is set or limit/offset provided, use pagination
      if (paginated === 'true' || limit || offset) {
        const result = await applicationListRepository.findPaginated(options)
        
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
        const allRecords = await applicationListRepository.findAll(options)
        res.json({
          success: true,
          data: allRecords,
          count: allRecords.length,
        })
      }
    } catch (error) {
      console.error('Error in ApplicationListController.getAll:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * GET //api/application-list/:id
   * Get a single Application List record by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const applicationList = await applicationListRepository.findById(id)

      if (!applicationList) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Application List record not found',
        })
        return
      }

      res.json({
        success: true,
        data: applicationList,
      })
    } catch (error) {
      console.error('Error in ApplicationListController.getById:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * POST //api/application-list
   * Create a new Application List record
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateApplicationListDto = req.body
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

      const applicationList = await applicationListRepository.create(dto, userId)

      res.status(201).json({
        success: true,
        data: applicationList,
      })
    } catch (error) {
      console.error('Error in ApplicationListController.create:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * PUT //api/application-list/:id
   * Update an existing Application List record
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const dto: UpdateApplicationListDto = req.body
      const userId = (req.headers['x-user-id'] as string) || 'System'

      const applicationList = await applicationListRepository.update(id, dto, userId)

      if (!applicationList) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Application List record not found',
        })
        return
      }

      res.json({
        success: true,
        data: applicationList,
      })
    } catch (error) {
      console.error('Error in ApplicationListController.update:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * DELETE //api/application-list/:id
   * Delete a Application List record
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const deleted = await applicationListRepository.delete(id)

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Application List record not found',
        })
        return
      }

      res.json({
        success: true,
        message: 'Application List record deleted successfully',
      })
    } catch (error) {
      console.error('Error in ApplicationListController.delete:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * GET //api/application-list/filters/values
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
      const values = await applicationListRepository.getDistinctFieldValues(field, limitNum)

      res.json({
        success: true,
        data: values,
      })
    } catch (error) {
      console.error('Error in ApplicationListController.getFilterValues:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}

// Export singleton instance
export const applicationListController = new ApplicationListController()

