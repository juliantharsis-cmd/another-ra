import { Request, Response } from 'express'
import { FieldMappingService } from '../services/FieldMappingService'

// Lazy initialization to ensure environment variables are loaded
let fieldMappingServiceInstance: FieldMappingService | null = null

function getFieldMappingService(): FieldMappingService {
  if (!fieldMappingServiceInstance) {
    fieldMappingServiceInstance = new FieldMappingService()
  }
  return fieldMappingServiceInstance
}

export class FieldMappingController {
  /**
   * GET /api/tables/:tableId/field-mapping
   * Get field ID mapping for a table
   */
  async getFieldMapping(req: Request, res: Response): Promise<void> {
    try {
      const { tableId } = req.params

      if (!tableId) {
        res.status(400).json({ error: 'Table ID is required' })
        return
      }

      const mapping = await getFieldMappingService().getFieldMapping(tableId)

      if (!mapping) {
        res.status(404).json({ error: 'Field mapping not found' })
        return
      }

      res.json(mapping)
    } catch (error: any) {
      console.error('Error fetching field mapping:', error)
      res.status(500).json({ 
        error: 'Failed to fetch field mapping',
        message: error.message 
      })
    }
  }

  /**
   * POST /api/tables/:tableId/field-mapping
   * Create or update field ID mapping for a table
   */
  async createOrUpdateFieldMapping(req: Request, res: Response): Promise<void> {
    try {
      const { tableId } = req.params
      const { baseId, airtableTableId, fields } = req.body

      if (!tableId) {
        res.status(400).json({ error: 'Table ID is required' })
        return
      }

      if (!fields || !Array.isArray(fields)) {
        res.status(400).json({ error: 'Fields array is required' })
        return
      }

      const mapping = await getFieldMappingService().createOrUpdateFieldMapping(
        tableId,
        {
          baseId,
          airtableTableId,
          fields,
        }
      )

      res.json(mapping)
    } catch (error: any) {
      console.error('Error creating/updating field mapping:', error)
      res.status(500).json({ 
        error: 'Failed to create/update field mapping',
        message: error.message 
      })
    }
  }
}

export const fieldMappingController = new FieldMappingController()

