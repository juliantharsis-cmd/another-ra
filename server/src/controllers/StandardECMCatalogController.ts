import { Request, Response } from 'express'
import { StandardECMCatalogAirtableService } from '../services/StandardECMCatalogAirtableService'
import { CreateStandardECMCatalogDto, UpdateStandardECMCatalogDto } from '../types/StandardECMCatalog'

export class StandardECMCatalogController {
  private service: StandardECMCatalogAirtableService | null = null

  private getService(): StandardECMCatalogAirtableService {
    if (!this.service) {
      this.service = new StandardECMCatalogAirtableService()
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
      console.error('Error in StandardECMCatalogController.getAll:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch Standard ECM Catalogs',
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
          error: 'Standard ECM Catalog not found',
        })
        return
      }

      res.json({
        success: true,
        data: record,
      })
    } catch (error: any) {
      console.error('Error in StandardECMCatalogController.getById:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch Standard ECM Catalog',
      })
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateStandardECMCatalogDto = req.body
      const record = await this.getService().create(dto)

      res.status(201).json({
        success: true,
        data: record,
      })
    } catch (error: any) {
      console.error('Error in StandardECMCatalogController.create:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create Standard ECM Catalog',
      })
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const dto: UpdateStandardECMCatalogDto = req.body
      const record = await this.getService().update(id, dto)

      res.json({
        success: true,
        data: record,
      })
    } catch (error: any) {
      console.error('Error in StandardECMCatalogController.update:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update Standard ECM Catalog',
      })
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      await this.getService().delete(id)

      res.json({
        success: true,
        message: 'Standard ECM Catalog deleted successfully',
      })
    } catch (error: any) {
      console.error('Error in StandardECMCatalogController.delete:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete Standard ECM Catalog',
      })
    }
  }

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

      const values = await this.getService().getFilterValues(field, limit)

      res.json({
        success: true,
        data: values,
      })
    } catch (error: any) {
      console.error('Error in StandardECMCatalogController.getFilterValues:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get filter values',
      })
    }
  }
}

