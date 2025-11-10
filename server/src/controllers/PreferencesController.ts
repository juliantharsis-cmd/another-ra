/**
 * Preferences Controller
 * 
 * HTTP API endpoints for user preferences
 */

import { Request, Response } from 'express'
import { getPreferencesService } from '../services/PreferencesService'
import {
  PreferenceFilter,
  SetPreferenceOptions,
  PreferenceRecord,
} from '../types/Preferences'

export class PreferencesController {
  /**
   * GET /api/preferences/:userId
   * Get all preferences for a user
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId || req.query.userId as string || req.headers['x-user-id'] as string

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required. Provide userId param, query param, or X-User-Id header.',
        })
        return
      }

      const filter: PreferenceFilter = {}
      if (req.query.namespace) {
        filter.namespace = req.query.namespace as any
      }
      if (req.query.tableId) {
        filter.tableId = req.query.tableId as string
      }
      if (req.query.scopeId) {
        filter.scopeId = req.query.scopeId as string
      }
      if (req.query.key) {
        filter.key = req.query.key as string
      }
      if (req.query.visibility) {
        filter.visibility = req.query.visibility as any
      }
      if (req.query.expired === 'true') {
        filter.expired = true
      }

      const service = getPreferencesService()
      const result = await service.getAll(userId, Object.keys(filter).length > 0 ? filter : undefined)

      res.json({
        success: true,
        data: result.records,
        total: result.total,
      })
    } catch (error) {
      console.error('Error getting preferences:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get preferences',
      })
    }
  }

  /**
   * GET /api/preferences/:userId/:namespace/:key
   * Get a single preference
   */
  async get(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId || req.headers['x-user-id'] as string
      const namespace = req.params.namespace as PreferenceRecord['namespace']
      const key = req.params.key
      const tableId = req.query.tableId as string | undefined
      const scopeId = req.query.scopeId as string | undefined

      if (!userId || !namespace || !key) {
        res.status(400).json({
          success: false,
          error: 'userId, namespace, and key are required',
        })
        return
      }

      const service = getPreferencesService()
      const preference = await service.get(userId, key, namespace, tableId, scopeId)

      if (!preference) {
        res.status(404).json({
          success: false,
          error: 'Preference not found',
        })
        return
      }

      res.json({
        success: true,
        data: preference,
      })
    } catch (error) {
      console.error('Error getting preference:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get preference',
      })
    }
  }

  /**
   * PUT /api/preferences/:userId/:namespace/:key
   * Set (create or update) a preference
   */
  async set(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId || req.body.userId || req.headers['x-user-id'] as string
      const namespace = (req.params.namespace || req.body.namespace) as PreferenceRecord['namespace']
      const key = req.params.key || req.body.key
      const { value, type, tableId, scopeId, visibility, expiresAt, ttl, overwrite } = req.body

      if (!userId || !namespace || !key || value === undefined || !type) {
        res.status(400).json({
          success: false,
          error: 'userId, namespace, key, value, and type are required',
        })
        return
      }

      const options: SetPreferenceOptions = {
        visibility,
        expiresAt,
        ttl,
        overwrite,
      }

      const service = getPreferencesService()
      const preference = await service.set(
        userId,
        key,
        value,
        type,
        {
          ...options,
          namespace,
          tableId,
          scopeId,
        }
      )

      res.json({
        success: true,
        data: preference,
      })
    } catch (error) {
      console.error('Error setting preference:', error)
      const statusCode = error instanceof Error && error.name === 'PreferenceValidationError' ? 400 : 500
      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set preference',
      })
    }
  }

  /**
   * DELETE /api/preferences/:userId/:namespace/:key
   * Delete a preference
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId || req.headers['x-user-id'] as string
      const namespace = req.params.namespace as PreferenceRecord['namespace']
      const key = req.params.key
      const tableId = req.query.tableId as string | undefined
      const scopeId = req.query.scopeId as string | undefined

      if (!userId || !namespace || !key) {
        res.status(400).json({
          success: false,
          error: 'userId, namespace, and key are required',
        })
        return
      }

      const service = getPreferencesService()
      const deleted = await service.delete(userId, key, namespace, tableId, scopeId)

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Preference not found',
        })
        return
      }

      res.json({
        success: true,
        message: 'Preference deleted successfully',
      })
    } catch (error) {
      console.error('Error deleting preference:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete preference',
      })
    }
  }

  /**
   * DELETE /api/preferences/:userId
   * Delete all preferences for a user (with optional filter)
   */
  async deleteAll(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId || req.headers['x-user-id'] as string

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required',
        })
        return
      }

      const filter: PreferenceFilter = {}
      if (req.query.namespace) {
        filter.namespace = req.query.namespace as any
      }
      if (req.query.tableId) {
        filter.tableId = req.query.tableId as string
      }
      if (req.query.scopeId) {
        filter.scopeId = req.query.scopeId as string
      }

      const service = getPreferencesService()
      const deleted = await service.deleteAll(userId, Object.keys(filter).length > 0 ? filter : undefined)

      res.json({
        success: true,
        message: `Deleted ${deleted} preference(s)`,
        deleted,
      })
    } catch (error) {
      console.error('Error deleting preferences:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete preferences',
      })
    }
  }
}

// Export singleton instance
export const preferencesController = new PreferencesController()

