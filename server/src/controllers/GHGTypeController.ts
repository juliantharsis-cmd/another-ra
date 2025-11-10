import { Request, Response } from 'express'
import { ghgTypeRepository } from '../data/GHGTypeRepository'
import { CreateGHGTypeDto, UpdateGHGTypeDto } from '../types/GHGType'
import { QueryOptions } from '../database/interfaces/IDatabase'

export class GHGTypeController {
  /**
   * GET /ghg-types
   * Retrieve all GHG Type records with optional query parameters
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
        const result = await ghgTypeRepository.findPaginated(options)
        
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
        const allRecords = await ghgTypeRepository.findAll(options)
        res.json({
          success: true,
          data: allRecords,
          count: allRecords.length,
        })
      }
    } catch (error) {
      console.error('Error in GHGTypeController.getAll:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * GET /ghg-types/:id
   * Get a single GHG Type record by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const ghgType = await ghgTypeRepository.findById(id)

      if (!ghgType) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'GHG Type record not found',
        })
        return
      }

      res.json({
        success: true,
        data: ghgType,
      })
    } catch (error) {
      console.error('Error in GHGTypeController.getById:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * POST /ghg-types
   * Create a new GHG Type record
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateGHGTypeDto = req.body
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

      const ghgType = await ghgTypeRepository.create(dto, userId)

      res.status(201).json({
        success: true,
        data: ghgType,
      })
    } catch (error) {
      console.error('Error in GHGTypeController.create:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * PUT /ghg-types/:id
   * Update an existing GHG Type record
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const dto: UpdateGHGTypeDto = req.body
      const userId = (req.headers['x-user-id'] as string) || 'System'

      const ghgType = await ghgTypeRepository.update(id, dto, userId)

      if (!ghgType) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'GHG Type record not found',
        })
        return
      }

      res.json({
        success: true,
        data: ghgType,
      })
    } catch (error) {
      console.error('Error in GHGTypeController.update:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * DELETE /ghg-types/:id
   * Delete a GHG Type record
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const deleted = await ghgTypeRepository.delete(id)

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'GHG Type record not found',
        })
        return
      }

      res.json({
        success: true,
        message: 'GHG Type record deleted successfully',
      })
    } catch (error) {
      console.error('Error in GHGTypeController.delete:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * GET /ghg-types/filters/values
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
      const values = await ghgTypeRepository.getDistinctFieldValues(field, limitNum)

      res.json({
        success: true,
        data: values,
      })
    } catch (error) {
      console.error('Error in GHGTypeController.getFilterValues:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}

// Export singleton instance
export const ghgTypeController = new GHGTypeController()

