import { Request, Response } from 'express'
import { StandardEmissionFactorAirtableService } from '../services/StandardEmissionFactorAirtableService'
import { CreateStandardEmissionFactorDto, UpdateStandardEmissionFactorDto } from '../types/StandardEmissionFactor'

export class StandardEmissionFactorController {
  private service: StandardEmissionFactorAirtableService

  constructor() {
    this.service = new StandardEmissionFactorAirtableService()
  }

  /**
   * GET /api/standard-emission-factors
   * Get all Standard Emission Factors with pagination, filtering, and sorting
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined
      const sortBy = req.query.sortBy as string | undefined
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'asc'
      const search = req.query.search as string | undefined
      const status = req.query.status as string | undefined

      const result = await this.service.getAll({
        offset,
        limit,
        sortBy,
        sortOrder,
        search,
        status,
      })

      const pagination = limit !== undefined && offset !== undefined
        ? {
            total: result.total,
            limit,
            offset,
            hasMore: offset + limit < result.total,
          }
        : undefined

      res.json({
        success: true,
        data: result.data,
        pagination,
      })
    } catch (error: any) {
      console.error('Error in StandardEmissionFactorController.getAll:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch Standard Emission Factors',
      })
    }
  }

  /**
   * GET /api/standard-emission-factors/:id
   * Get a single Standard Emission Factor by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const record = await this.service.getById(id)

      if (!record) {
        res.status(404).json({
          success: false,
          error: 'Standard Emission Factor not found',
        })
        return
      }

      res.json({
        success: true,
        data: record,
      })
    } catch (error: any) {
      console.error('Error in StandardEmissionFactorController.getById:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch Standard Emission Factor',
      })
    }
  }

  /**
   * POST /api/standard-emission-factors
   * Create a new Standard Emission Factor
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateStandardEmissionFactorDto = req.body
      const record = await this.service.create(dto)

      res.status(201).json({
        success: true,
        data: record,
      })
    } catch (error: any) {
      console.error('Error in StandardEmissionFactorController.create:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create Standard Emission Factor',
      })
    }
  }

  /**
   * PUT /api/standard-emission-factors/:id
   * Update an existing Standard Emission Factor
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const dto: UpdateStandardEmissionFactorDto = req.body
      const record = await this.service.update(id, dto)

      res.json({
        success: true,
        data: record,
      })
    } catch (error: any) {
      console.error('Error in StandardEmissionFactorController.update:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update Standard Emission Factor',
      })
    }
  }

  /**
   * DELETE /api/standard-emission-factors/:id
   * Delete a Standard Emission Factor
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      await this.service.delete(id)

      res.json({
        success: true,
        message: 'Standard Emission Factor deleted successfully',
      })
    } catch (error: any) {
      console.error('Error in StandardEmissionFactorController.delete:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete Standard Emission Factor',
      })
    }
  }

  /**
   * GET /api/standard-emission-factors/filters/values
   * Get distinct values for a filter field
   */
  async getFilterValues(req: Request, res: Response): Promise<void> {
    try {
      const field = req.query.field as string
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 1000

      if (!field) {
        res.status(400).json({
          success: false,
          error: 'Field parameter is required',
        })
        return
      }

      const values = await this.service.getFilterValues(field, limit)

      res.json({
        success: true,
        data: values,
      })
    } catch (error: any) {
      console.error('Error in StandardEmissionFactorController.getFilterValues:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get filter values',
      })
    }
  }
}

