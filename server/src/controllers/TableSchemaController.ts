import { Request, Response } from 'express'
import { getTableSchemaAirtableService } from '../services/TableSchemaAirtableService'
import { TableSchema, UpdateTableSchemaDto } from '../types/TableSchema'

export class TableSchemaController {
  /**
   * GET /tables/:tableId/schema
   * Get table schema
   */
  async getSchema(req: Request, res: Response): Promise<void> {
    try {
      const { tableId } = req.params
      const service = getTableSchemaAirtableService()
      
      let schema = await service.getSchema(tableId)

      // If schema doesn't exist and Metadata API access failed, return 404
      // Frontend will create schema from current fields
      if (!schema) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Table schema not found. It will be created from current fields when you configure the table.',
          // Include helpful message about Metadata API permissions
          hint: 'If you want automatic schema sync from Airtable, ensure your Personal Access Token has the "schema.bases:read" scope.',
        })
        return
      }

      res.json({
        success: true,
        data: schema,
      })
    } catch (error) {
      console.error('Error in TableSchemaController.getSchema:', error)
      
      // Check if it's an authorization error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (errorMessage.includes('NOT_AUTHORIZED') || errorMessage.includes('401') || errorMessage.includes('403')) {
        res.status(403).json({
          success: false,
          error: 'Authorization failed',
          message: 'Airtable Metadata API access denied. Your Personal Access Token needs the "schema.bases:read" scope. Schema will be created from current fields instead.',
        })
        return
      }
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: errorMessage,
      })
    }
  }

  /**
   * PUT /tables/:tableId/schema
   * Update table schema
   */
  async updateSchema(req: Request, res: Response): Promise<void> {
    try {
      const { tableId } = req.params
      const dto: UpdateTableSchemaDto = req.body
      const service = getTableSchemaAirtableService()

      // Get existing schema or create new
      let schema = await service.getSchema(tableId)
      
      if (!schema) {
        // Create new schema
        schema = {
          tableId,
          tableName: dto.tableName || tableId,
          fields: (dto.fields || []).map((field, index) => ({
            id: `field-${Date.now()}-${index}`,
            name: 'name' in field ? field.name : '',
            type: 'type' in field ? field.type : 'singleLineText',
            format: field.format,
            required: field.required,
            unique: field.unique,
            description: field.description,
            order: 'order' in field ? field.order : index,
          })),
        }
      } else {
        // Update existing schema
        if (dto.tableName) {
          schema.tableName = dto.tableName
        }
        if (dto.fields) {
          schema.fields = dto.fields.map((field, index) => {
            const existingField = schema.fields.find(f => 
              'name' in field && f.name === field.name
            )
            return {
              id: existingField?.id || `field-${Date.now()}-${index}`,
              name: 'name' in field ? field.name : existingField?.name || '',
              type: 'type' in field ? field.type : existingField?.type || 'singleLineText',
              format: field.format ?? existingField?.format,
              required: field.required ?? existingField?.required ?? false,
              unique: field.unique ?? existingField?.unique ?? false,
              description: field.description ?? existingField?.description,
              order: 'order' in field ? field.order : existingField?.order ?? index,
            }
          })
        }
      }

      const savedSchema = await service.saveSchema(schema)

      res.json({
        success: true,
        data: savedSchema,
        message: 'Table schema updated successfully',
      })
    } catch (error) {
      console.error('Error in TableSchemaController.updateSchema:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}

// Singleton instance
export const tableSchemaController = new TableSchemaController()

