import { Request, Response } from 'express'
import { geographyRepository } from '../data/GeographyRepository'
import { CreateGeographyDto, UpdateGeographyDto } from '../types/Geography'
import { QueryOptions } from '../database/interfaces/IDatabase'

export class GeographyController {
  /**
   * GET /geography
   * Retrieve all geography records with optional query parameters
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
        country,
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
          ...(country && { country: country as string }),
        },
      }

      // If paginated flag is set or limit/offset provided, use pagination
      if (paginated === 'true' || limit || offset) {
        const result = await geographyRepository.findPaginated(options)
        
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
        const allRecords = await geographyRepository.findAll(options)
        res.json({
          success: true,
          data: allRecords,
          count: allRecords.length,
        })
      }
    } catch (error) {
      console.error('Error in GeographyController.getAll:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * GET /geography/:id
   * Get a single geography record by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const geography = await geographyRepository.findById(id)

      if (!geography) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Geography record not found',
        })
        return
      }

      res.json({
        success: true,
        data: geography,
      })
    } catch (error) {
      console.error('Error in GeographyController.getById:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * POST /geography
   * Create a new geography record
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateGeographyDto = req.body
      const userId = (req.headers['x-user-id'] as string) || 'System'

      // Validate required fields
      if (!dto.regionName || !dto.country) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Region Name and Country are required',
        })
        return
      }

      const geography = await geographyRepository.create(dto, userId)

      res.status(201).json({
        success: true,
        data: geography,
      })
    } catch (error) {
      console.error('Error in GeographyController.create:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * PUT /geography/:id
   * Update an existing geography record
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const dto: UpdateGeographyDto = req.body
      const userId = (req.headers['x-user-id'] as string) || 'System'

      const geography = await geographyRepository.update(id, dto, userId)

      if (!geography) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Geography record not found',
        })
        return
      }

      res.json({
        success: true,
        data: geography,
      })
    } catch (error) {
      console.error('Error in GeographyController.update:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * DELETE /geography/:id
   * Delete a geography record
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const deleted = await geographyRepository.delete(id)

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Geography record not found',
        })
        return
      }

      res.json({
        success: true,
        message: 'Geography record deleted successfully',
      })
    } catch (error) {
      console.error('Error in GeographyController.delete:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * GET /geography/filters/values
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

      const validFields = ['status', 'country']
      if (!validFields.includes(field)) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: `Field must be one of: ${validFields.join(', ')}`,
        })
        return
      }

      const limitNum = limit ? parseInt(limit as string) : 1000
      const values = await geographyRepository.getDistinctFieldValues(field, limitNum)

      res.json({
        success: true,
        data: values,
      })
    } catch (error) {
      console.error('Error in GeographyController.getFilterValues:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}

// Export singleton instance
export const geographyController = new GeographyController()








