import { Request, Response } from 'express'
import { KeywordsTagsAirtableService, CreateKeywordsTagsDto, UpdateKeywordsTagsDto } from '../services/KeywordsTagsAirtableService'

export class KeywordsTagsController {
  private service: KeywordsTagsAirtableService | null = null

  private getService(): KeywordsTagsAirtableService {
    if (!this.service) {
      this.service = new KeywordsTagsAirtableService()
    }
    return this.service
  }

  /**
   * GET /api/keywords-tags
   * Get all Keywords/Tags records with pagination, filtering, and sorting
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
      console.error('Error in KeywordsTagsController.getAll:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch Keywords/Tags records',
      })
    }
  }

  /**
   * GET /api/keywords-tags/:id
   * Get a single Keywords/Tags record by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const record = await this.getService().getById(id)

      if (!record) {
        res.status(404).json({
          success: false,
          error: 'Keywords/Tags record not found',
        })
        return
      }

      res.json({
        success: true,
        data: record,
      })
    } catch (error: any) {
      console.error('Error in KeywordsTagsController.getById:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch Keywords/Tags record',
      })
    }
  }

  /**
   * POST /api/keywords-tags
   * Create a new Keywords/Tags record
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateKeywordsTagsDto = req.body
      const record = await this.getService().create(dto)

      res.status(201).json({
        success: true,
        data: record,
      })
    } catch (error: any) {
      console.error('Error in KeywordsTagsController.create:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create Keywords/Tags record',
      })
    }
  }

  /**
   * PUT /api/keywords-tags/:id
   * Update a Keywords/Tags record
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const dto: UpdateKeywordsTagsDto = req.body
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
      console.error('Error in KeywordsTagsController.update:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update Keywords/Tags record',
      })
    }
  }

  /**
   * DELETE /api/keywords-tags/:id
   * Delete a Keywords/Tags record
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      await this.getService().delete(id)

      res.json({
        success: true,
        message: 'Keywords/Tags record deleted successfully',
      })
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message,
        })
        return
      }
      console.error('Error in KeywordsTagsController.delete:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete Keywords/Tags record',
      })
    }
  }
}

