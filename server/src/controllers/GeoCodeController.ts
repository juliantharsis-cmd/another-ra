import { Request, Response } from 'express'
import { GeoCodeAirtableService } from '../services/GeoCodeAirtableService'

export class GeoCodeController {
  private service: GeoCodeAirtableService | null = null

  private getService(): GeoCodeAirtableService {
    if (!this.service) {
      this.service = new GeoCodeAirtableService()
    }
    return this.service
  }

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
      console.error('Error in GeoCodeController.getAll:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch geo Code',
      })
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const record = await this.getService().getById(id)

      if (!record) {
        res.status(404).json({
          success: false,
          error: 'GeoCode record not found',
        })
        return
      }

      res.json({
        success: true,
        data: record,
      })
    } catch (error: any) {
      console.error('Error in GeoCodeController.getById:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch GeoCode',
      })
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const dto = req.body
      const record = await this.getService().create(dto)

      res.status(201).json({
        success: true,
        data: record,
      })
    } catch (error: any) {
      console.error('Error in GeoCodeController.create:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create GeoCode',
      })
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const dto = req.body
      const record = await this.getService().update(id, dto)

      res.json({
        success: true,
        data: record,
      })
    } catch (error: any) {
      console.error('Error in GeoCodeController.update:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update GeoCode',
      })
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      await this.getService().delete(id)

      res.json({
        success: true,
        message: 'GeoCode record deleted successfully',
      })
    } catch (error: any) {
      console.error('Error in GeoCodeController.delete:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete GeoCode',
      })
    }
  }
}
