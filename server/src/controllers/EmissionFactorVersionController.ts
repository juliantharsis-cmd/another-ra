import { Request, Response } from 'express'
import { emissionFactorVersionRepository } from '../data/EmissionFactorVersionRepository'
import { CreateEmissionFactorVersionDto, UpdateEmissionFactorVersionDto } from '../types/EmissionFactorVersion'
import { QueryOptions } from '../database/interfaces/IDatabase'

export class EmissionFactorVersionController {
  /**
   * GET /emission-factor-version
   * Retrieve all Emission Factor Version records with optional query parameters
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
        const result = await emissionFactorVersionRepository.findPaginated(options)
        
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
        const allRecords = await emissionFactorVersionRepository.findAll(options)
        res.json({
          success: true,
          data: allRecords,
          count: allRecords.length,
        })
      }
    } catch (error) {
      console.error('Error in EmissionFactorVersionController.getAll:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * GET /emission-factor-version/:id
   * Get a single Emission Factor Version record by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const emissionFactorVersion = await emissionFactorVersionRepository.findById(id)

      if (!emissionFactorVersion) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Emission Factor Version record not found',
        })
        return
      }

      res.json({
        success: true,
        data: emissionFactorVersion,
      })
    } catch (error) {
      console.error('Error in EmissionFactorVersionController.getById:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * POST /emission-factor-version
   * Create a new Emission Factor Version record
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateEmissionFactorVersionDto = req.body
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

      const emissionFactorVersion = await emissionFactorVersionRepository.create(dto, userId)

      res.status(201).json({
        success: true,
        data: emissionFactorVersion,
      })
    } catch (error) {
      console.error('Error in EmissionFactorVersionController.create:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * PUT /emission-factor-version/:id
   * Update an existing Emission Factor Version record
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const dto: UpdateEmissionFactorVersionDto = req.body
      const userId = (req.headers['x-user-id'] as string) || 'System'

      const emissionFactorVersion = await emissionFactorVersionRepository.update(id, dto, userId)

      if (!emissionFactorVersion) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Emission Factor Version record not found',
        })
        return
      }

      res.json({
        success: true,
        data: emissionFactorVersion,
      })
    } catch (error) {
      console.error('Error in EmissionFactorVersionController.update:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * DELETE /emission-factor-version/:id
   * Delete a Emission Factor Version record
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const deleted = await emissionFactorVersionRepository.delete(id)

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Emission Factor Version record not found',
        })
        return
      }

      res.json({
        success: true,
        message: 'Emission Factor Version record deleted successfully',
      })
    } catch (error) {
      console.error('Error in EmissionFactorVersionController.delete:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * GET /emission-factor-version/filters/values
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
      const values = await emissionFactorVersionRepository.getDistinctFieldValues(field, limitNum)

      res.json({
        success: true,
        data: values,
      })
    } catch (error) {
      console.error('Error in EmissionFactorVersionController.getFilterValues:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}

// Export singleton instance
export const emissionFactorVersionController = new EmissionFactorVersionController()

