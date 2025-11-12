/**
 * AI Agent Profile API Routes
 * 
 * REST API endpoints for managing user AI Agent Profiles
 */

import { Router, Request, Response } from 'express'
import { AIAgentProfileService } from '../services/AIAgentProfileService'

const router = Router()

// Lazy-load service to avoid errors if Airtable is not configured
let serviceInstance: AIAgentProfileService | null = null

function getService(): AIAgentProfileService | null {
  try {
    if (!serviceInstance) {
      serviceInstance = new AIAgentProfileService()
    }
    return serviceInstance
  } catch (error) {
    console.error('AIAgentProfileService not available:', error)
    return null
  }
}

/**
 * GET /api/ai-agent-profile/:userId
 * Get AI Agent Profile for a user
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const service = getService()
    if (!service) {
      return res.status(503).json({
        success: false,
        error: 'AI Agent Profile service is not available. Please check Airtable configuration.',
      })
    }

    const { userId } = req.params

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      })
    }

    const profile = await service.getProfile(userId)

    res.json({
      success: true,
      data: profile,
    })
  } catch (error) {
    console.error('Error fetching AI Agent Profile:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    })
  }
})

/**
 * POST /api/ai-agent-profile/:userId
 * Save AI Agent Profile for a user
 */
router.post('/:userId', async (req: Request, res: Response) => {
  try {
    const service = getService()
    if (!service) {
      return res.status(503).json({
        success: false,
        error: 'AI Agent Profile service is not available. Please check Airtable configuration.',
      })
    }

    const { userId } = req.params
    const profile = req.body

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      })
    }

    await service.saveProfile(userId, profile)

    res.json({
      success: true,
      message: 'AI Agent Profile saved successfully',
    })
  } catch (error) {
    console.error('Error saving AI Agent Profile:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    })
  }
})

/**
 * DELETE /api/ai-agent-profile/:userId
 * Delete AI Agent Profile for a user (revert to defaults)
 */
router.delete('/:userId', async (req: Request, res: Response) => {
  try {
    const service = getService()
    if (!service) {
      return res.status(503).json({
        success: false,
        error: 'AI Agent Profile service is not available. Please check Airtable configuration.',
      })
    }

    const { userId } = req.params

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      })
    }

    await service.deleteProfile(userId)

    res.json({
      success: true,
      message: 'AI Agent Profile deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting AI Agent Profile:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    })
  }
})

export default router

