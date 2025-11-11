/**
 * AI Model Registry API Routes
 * 
 * REST API endpoints for managing AI models in the registry
 */

import { Router, Request, Response } from 'express'
import { AIModelRegistryService, AIModel } from '../services/AIModelRegistryService'

const router = Router()

// Lazy-load service to avoid errors if Airtable is not configured
let serviceInstance: AIModelRegistryService | null = null

function getService(): AIModelRegistryService | null {
  try {
    if (!serviceInstance) {
      serviceInstance = new AIModelRegistryService()
    }
    return serviceInstance
  } catch (error) {
    console.error('AIModelRegistryService not available:', error)
    return null
  }
}

/**
 * GET /api/ai-model-registry/models
 * Get all models, optionally filtered by provider
 * 
 * Query params:
 * - providerId?: string (filter by provider)
 * - onlyAvailable?: boolean (default: true)
 */
router.get('/models', async (req: Request, res: Response) => {
  try {
    const service = getService()
    if (!service) {
      return res.status(503).json({
        success: false,
        error: 'AI Model Registry service is not available. Please check Airtable configuration.',
      })
    }

    const { providerId, onlyAvailable = 'true' } = req.query

    if (providerId && typeof providerId === 'string') {
      const models = await service.getModels(providerId, onlyAvailable === 'true')
      return res.json({
        success: true,
        data: Array.isArray(models) ? models : [],
      })
    }

    // Get all models from all providers
    const allProviders = ['openai', 'anthropic', 'google', 'custom']
    const allModels: AIModel[] = []
    
    for (const provider of allProviders) {
      try {
        const models = await service.getModels(provider, onlyAvailable === 'true')
        if (Array.isArray(models)) {
          allModels.push(...models)
        }
      } catch (error) {
        // Continue with other providers if one fails
        console.warn(`Error fetching models for ${provider}:`, error)
      }
    }

    return res.json({
      success: true,
      data: allModels,
    })
  } catch (error) {
    console.error('Error in GET /api/ai-model-registry/models:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    })
  }
})

/**
 * GET /api/ai-model-registry/models/:id
 * Get a single model by ID
 */
router.get('/models/:id', async (req: Request, res: Response) => {
  try {
    const service = getService()
    if (!service) {
      return res.status(503).json({
        success: false,
        error: 'AI Model Registry service is not available',
      })
    }

    const { id } = req.params
    const { providerId } = req.query

    if (!providerId || typeof providerId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'providerId query parameter is required',
      })
    }

    // Get all models for the provider and find the one with matching modelId
    const models = await service.getModels(providerId, false)
    const model = models.find(m => m.modelId === id || m.id === id)

    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Model not found',
      })
    }

    return res.json({
      success: true,
      data: model,
    })
  } catch (error) {
    console.error('Error in GET /api/ai-model-registry/models/:id:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    })
  }
})

/**
 * GET /api/ai-model-registry/recommended/:providerId
 * Get recommended model for a provider
 */
router.get('/recommended/:providerId', async (req: Request, res: Response) => {
  try {
    const service = getService()
    if (!service) {
      return res.status(503).json({
        success: false,
        error: 'AI Model Registry service is not available',
      })
    }

    const { providerId } = req.params
    const modelId = await service.getRecommendedModel(providerId)

    if (!modelId) {
      return res.status(404).json({
        success: false,
        error: 'No recommended model found for this provider',
      })
    }

    return res.json({
      success: true,
      data: { modelId },
    })
  } catch (error) {
    console.error('Error in GET /api/ai-model-registry/recommended/:providerId:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    })
  }
})

export default router

