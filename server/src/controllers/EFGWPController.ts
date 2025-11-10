import { Request, Response } from 'express'
import { efGwpRepository } from '../data/EFGWPRepository'
import { CreateEFGWPDto, UpdateEFGWPDto } from '../types/EFGWP'
import { QueryOptions } from '../database/interfaces/IDatabase'

export class EFGWPController {
  /**
   * GET /emission-factors
   * Retrieve all EF GWP records with optional query parameters
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
        greenHouseGas,
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
          ...(greenHouseGas && { greenHouseGas: greenHouseGas as string }),
        },
      }

      // If paginated flag is set or limit/offset provided, use pagination
      if (paginated === 'true' || limit || offset) {
        const result = await efGwpRepository.findPaginated(options)
        
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
        const allRecords = await efGwpRepository.findAll(options)
        res.json({
          success: true,
          data: allRecords,
          count: allRecords.length,
        })
      }
    } catch (error) {
      console.error('Error in EFGWPController.getAll:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * GET /emission-factors/:id
   * Get a single EF GWP record by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const efGwp = await efGwpRepository.findById(id)

      if (!efGwp) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'EF GWP record not found',
        })
        return
      }

      res.json({
        success: true,
        data: efGwp,
      })
    } catch (error) {
      console.error('Error in EFGWPController.getById:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * POST /emission-factors
   * Create a new EF GWP record
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateEFGWPDto = req.body
      const userId = (req.headers['x-user-id'] as string) || 'System'
      
      const efGwp = await efGwpRepository.create(dto, userId)

      res.status(201).json({
        success: true,
        data: efGwp,
        message: 'EF GWP record created successfully',
      })
    } catch (error) {
      console.error('Error in EFGWPController.create:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * PATCH /emission-factors/:id
   * Update an existing EF GWP record
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const dto: UpdateEFGWPDto = req.body
      const userId = (req.headers['x-user-id'] as string) || 'System'
      
      const efGwp = await efGwpRepository.update(id, dto, userId)

      if (!efGwp) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'EF GWP record not found',
        })
        return
      }

      res.json({
        success: true,
        data: efGwp,
        message: 'EF GWP record updated successfully',
      })
    } catch (error) {
      console.error('Error in EFGWPController.update:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * DELETE /emission-factors/:id
   * Delete an EF GWP record
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const deleted = await efGwpRepository.delete(id)

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'EF GWP record not found',
        })
        return
      }

      res.json({
        success: true,
        message: 'EF GWP record deleted successfully',
      })
    } catch (error) {
      console.error('Error in EFGWPController.delete:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * GET /emission-factors/filters/values
   * Get distinct values for a filter field
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

      const limitNum = limit ? parseInt(limit as string) : 1000
      const values = await efGwpRepository.getDistinctFieldValues(field, limitNum)

      res.json({
        success: true,
        data: values,
      })
    } catch (error) {
      console.error('Error in EFGWPController.getFilterValues:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}

// Singleton instance
export const efGwpController = new EFGWPController()

// Export alias for backward compatibility (deprecated)
export const emissionFactorController = efGwpController
export const EmissionFactorController = EFGWPController

