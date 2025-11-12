import { Request, Response } from 'express'
import { ActivityDensityAirtableService, CreateActivityDensityDto, UpdateActivityDensityDto } from '../services/ActivityDensityAirtableService'

export class ActivityDensityController {
  private service: ActivityDensityAirtableService | null = null

  private getService(): ActivityDensityAirtableService {
    if (!this.service) {
      this.service = new ActivityDensityAirtableService()
    }
    return this.service
  }

  /**
   * GET /api/activity-density
   * Get all Activity Density records with pagination, filtering, and sorting
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined
      const sortBy = req.query.sortBy as string | undefined
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'asc'
      const search = req.query.search as string | undefined
      const status = req.query.status as string | undefined

      const result = await this.getService().getAll({
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
      console.error('Error in ActivityDensityController.getAll:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch Activity Density records',
      })
    }
  }

  /**
   * GET /api/activity-density/:id
   * Get a single Activity Density record by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const record = await this.getService().getById(id)

      if (!record) {
        res.status(404).json({
          success: false,
          error: 'Activity Density record not found',
        })
        return
      }

      res.json({
        success: true,
        data: record,
      })
    } catch (error: any) {
      console.error('Error in ActivityDensityController.getById:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch Activity Density record',
      })
    }
  }

  /**
   * POST /api/activity-density
   * Create a new Activity Density record
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateActivityDensityDto = req.body
      const record = await this.getService().create(dto)

      res.status(201).json({
        success: true,
        data: record,
      })
    } catch (error: any) {
      console.error('Error in ActivityDensityController.create:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create Activity Density record',
      })
    }
  }

  /**
   * PUT /api/activity-density/:id
   * Update an Activity Density record
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const dto: UpdateActivityDensityDto = req.body
      const record = await this.getService().update(id, dto)

      res.json({
        success: true,
        data: record,
      })
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message,
        })
        return
      }
      console.error('Error in ActivityDensityController.update:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update Activity Density record',
      })
    }
  }

  /**
   * DELETE /api/activity-density/:id
   * Delete an Activity Density record
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      await this.getService().delete(id)

      res.json({
        success: true,
        message: 'Activity Density record deleted successfully',
      })
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message,
        })
        return
      }
      console.error('Error in ActivityDensityController.delete:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete Activity Density record',
      })
    }
  }
}

