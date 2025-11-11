import { Request, Response } from 'express'
import { IndustryClassificationRepository } from '../data/IndustryClassificationRepository'
import { CreateIndustryClassificationDto, UpdateIndustryClassificationDto } from '../types/IndustryClassification'

const repository = new IndustryClassificationRepository()

/**
 * Industry Classification Controller
 * Handles all HTTP requests for Industry Classification
 */
export class IndustryClassificationController {
  /**
   * GET /api/industry-classification
   * Get all or paginated Industry Classification records
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const paginated = req.query.paginated === 'true'
      
      if (paginated) {
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 25
        const offset = (page - 1) * limit
        const sortBy = req.query.sortBy as string | undefined
        const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'asc'
        const search = req.query.search as string | undefined
        
        // Parse filters from query parameters
        const filters: Record<string, any> = {}
        Object.keys(req.query).forEach(key => {
          if (!['page', 'limit', 'sortBy', 'sortOrder', 'search', 'paginated'].includes(key)) {
            const value = req.query[key]
            if (value !== undefined && value !== null && value !== '') {
              // Handle array values (multiple query params with same key)
              if (Array.isArray(value)) {
                filters[key] = value
              } else {
                filters[key] = value
              }
            }
          }
        })

        const result = await repository.findPaginated({
          offset,
          limit,
          sortBy,
          sortOrder,
          filters: Object.keys(filters).length > 0 ? filters : undefined,
          search,
        })

        res.json({
          success: true,
          data: result.data,
          pagination: result.pagination,
        })
      } else {
        const industryClassifications = await repository.findAll()
        res.json({
          success: true,
          data: industryClassifications,
          count: industryClassifications.length,
        })
      }
    } catch (error: any) {
      console.error('Error in IndustryClassificationController.getAll:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch Industry Classification records',
      })
    }
  }

  /**
   * GET /api/industry-classification/:id
   * Get a single Industry Classification by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const industryClassification = await repository.findById(id)

      if (!industryClassification) {
        res.status(404).json({
          success: false,
          message: `Industry Classification with ID ${id} not found`,
        })
        return
      }

      res.json({
        success: true,
        data: industryClassification,
      })
    } catch (error: any) {
      console.error('Error in IndustryClassificationController.getById:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch Industry Classification',
      })
    }
  }

  /**
   * POST /api/industry-classification
   * Create a new Industry Classification
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateIndustryClassificationDto = req.body
      const industryClassification = await repository.create(dto)

      res.status(201).json({
        success: true,
        data: industryClassification,
      })
    } catch (error: any) {
      console.error('Error in IndustryClassificationController.create:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create Industry Classification',
      })
    }
  }

  /**
   * PUT /api/industry-classification/:id
   * Update an existing Industry Classification
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const dto: UpdateIndustryClassificationDto = req.body
      const industryClassification = await repository.update(id, dto)

      if (!industryClassification) {
        res.status(404).json({
          success: false,
          message: `Industry Classification with ID ${id} not found`,
        })
        return
      }

      res.json({
        success: true,
        data: industryClassification,
      })
    } catch (error: any) {
      console.error('Error in IndustryClassificationController.update:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update Industry Classification',
      })
    }
  }

  /**
   * DELETE /api/industry-classification/:id
   * Delete an Industry Classification
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      await repository.delete(id)

      res.json({
        success: true,
        message: 'Industry Classification deleted successfully',
      })
    } catch (error: any) {
      console.error('Error in IndustryClassificationController.delete:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete Industry Classification',
      })
    }
  }

  /**
   * GET /api/industry-classification/filters/values
   * Get distinct values for a filter field
   */
  async getFilterValues(req: Request, res: Response): Promise<void> {
    try {
      const field = req.query.field as string
      const limit = parseInt(req.query.limit as string) || 100

      if (!field) {
        res.status(400).json({
          success: false,
          error: 'Field parameter is required',
        })
        return
      }

      const values = await repository.getDistinctValues(field, limit)

      res.json({
        success: true,
        data: values,
      })
    } catch (error: any) {
      console.error('Error in IndustryClassificationController.getFilterValues:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch filter values',
      })
    }
  }

  /**
   * POST /api/industry-classification/upload
   * Upload a file and return Airtable attachment object
   * Note: Airtable requires a publicly accessible URL for attachments.
   * This endpoint accepts the file and returns a temporary attachment object.
   * In production, you should upload to S3/Cloudinary/etc first, then provide the URL to Airtable.
   */
  async uploadFile(req: Request, res: Response): Promise<void> {
    try {
      // Check if file was uploaded (multer stores it in req.file)
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No file provided',
        })
        return
      }

      const file = req.file

      // For now, create a temporary attachment object
      // Airtable needs a URL, but we can't provide one without external storage
      // So we'll create an object that the frontend can use for preview
      // When saving, we'll need to handle this specially
      
      // Generate a unique ID for the attachment
      const attachmentId = `att_${Date.now()}_${Math.random().toString(36).substring(7)}`
      
      // Create attachment object in Airtable format
      // Note: This is a temporary solution - in production, upload to storage first
      const attachment = {
        id: attachmentId,
        url: `data:${file.mimetype || 'application/octet-stream'};base64,${file.buffer.toString('base64')}`,
        filename: file.originalname || 'uploaded-file',
        size: file.size,
        type: file.mimetype || 'application/octet-stream',
        // Mark as temporary - needs to be uploaded to storage before saving to Airtable
        _isTemporary: true,
        _buffer: file.buffer.toString('base64'), // Store base64 for now
      }

      console.log(`📎 File uploaded: ${file.originalname} (${file.size} bytes, ${file.mimetype})`)

      res.json({
        success: true,
        data: attachment,
      })
    } catch (error: any) {
      console.error('Error in IndustryClassificationController.uploadFile:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to upload file',
      })
    }
  }
}

export const industryClassificationController = new IndustryClassificationController()

