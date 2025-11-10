import { Request, Response } from 'express'
import { getTableConfigurationAirtableService } from '../services/TableConfigurationAirtableService'
import { TableSchema, UpdateTableSchemaDto } from '../types/TableSchema'

export class TableConfigurationController {
  /**
   * GET /configurations/:tableName
   * Get table configuration
   */
  async getConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const { tableName } = req.params
      const service = getTableConfigurationAirtableService()
      
      const configuration = await service.getConfiguration(tableName)

      if (!configuration) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: `Configuration for table "${tableName}" not found. It will be created from Airtable schema when you configure the table.`,
        })
        return
      }

      res.json({
        success: true,
        data: configuration,
      })
    } catch (error) {
      console.error('Error in TableConfigurationController.getConfiguration:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: errorMessage,
      })
    }
  }

  /**
   * PUT /configurations/:tableName
   * Update table configuration
   */
  async updateConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const { tableName } = req.params
      const dto: UpdateTableSchemaDto = req.body
      const service = getTableConfigurationAirtableService()

      // Get existing configuration to preserve original field names
      const existing = await service.getConfiguration(tableName)
      
      // Merge with existing to preserve airtableFieldName
      if (existing && dto.fields) {
        dto.fields = dto.fields.map(field => {
          const existingField = existing.fields.find(f => f.name === ('name' in field ? field.name : ''))
          return {
            ...field,
            airtableFieldName: existingField?.airtableFieldName || ('name' in field ? field.name : ''),
          }
        })
      }

      const savedConfiguration = await service.saveConfiguration(tableName, dto)

      res.json({
        success: true,
        data: savedConfiguration,
        message: 'Table configuration updated successfully',
      })
    } catch (error) {
      console.error('Error in TableConfigurationController.updateConfiguration:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}

// Singleton instance
export const tableConfigurationController = new TableConfigurationController()

