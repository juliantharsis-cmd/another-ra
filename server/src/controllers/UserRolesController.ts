import { Request, Response } from 'express'
import Airtable from 'airtable'

/**
 * User Roles Controller
 * Simple controller to fetch User Roles from Airtable
 */
export class UserRolesController {
  private base: Airtable.Base | null = null
  private tableIdOrName: string | null = null

  /**
   * Initialize Airtable connection (lazy initialization)
   */
  private initialize(): void {
    if (this.base && this.tableIdOrName) {
      return // Already initialized
    }

    const apiKey = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || 
                   process.env.AIRTABLE_API_KEY
    
    if (!apiKey) {
      throw new Error('Airtable API token is required')
    }
    
    const baseId = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 
                   'appGtLbKhmNkkTLVL'
    
    // Get User Roles table ID or name (same logic as UserTableAirtableService)
    this.tableIdOrName = process.env.AIRTABLE_USER_ROLES_TABLE_ID || 
                         process.env.AIRTABLE_USER_ROLES_TABLE_NAME || 
                         'User Roles'
    
    Airtable.configure({ apiKey })
    this.base = Airtable.base(baseId)
  }

  /**
   * GET /api/user-roles
   * Get all User Roles records
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      // Initialize on first use (after env vars are loaded)
      this.initialize()
      
      if (!this.base || !this.tableIdOrName) {
        throw new Error('Failed to initialize Airtable connection')
      }

      const { limit, paginated } = req.query
      const maxRecords = limit ? parseInt(limit as string) : 1000

      console.log(`📥 Fetching User Roles from table: ${this.tableIdOrName}`)
      
      const records = await this.base(this.tableIdOrName)
        .select({
          maxRecords,
          sort: [{ field: 'Name', direction: 'asc' }],
        })
        .all()

      const userRoles = records.map(record => ({
        id: record.id,
        Name: record.fields['Name'] as string || record.id,
        name: record.fields['Name'] as string || record.id,
        ...record.fields,
      }))

      console.log(`✅ Fetched ${userRoles.length} User Roles records`)

      if (paginated === 'true') {
        res.json({
          success: true,
          data: userRoles,
          pagination: {
            total: userRoles.length,
            limit: maxRecords,
            offset: 0,
            hasMore: false,
          },
        })
      } else {
        res.json({
          success: true,
          data: userRoles,
          count: userRoles.length,
        })
      }
    } catch (error: any) {
      console.error('Error in UserRolesController.getAll:', error)
      
      if (error.error === 'NOT_AUTHORIZED' || error.statusCode === 403) {
        res.status(403).json({
          success: false,
          error: 'Not authorized',
          message: 'No permission to read from User Roles table',
        })
        return
      }
      
      if (error.error === 'NOT_FOUND' || error.statusCode === 404) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: `User Roles table "${this.tableIdOrName || 'User Roles'}" not found`,
        })
        return
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}

export const userRolesController = new UserRolesController()

