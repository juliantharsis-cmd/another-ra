/**
 * Integration Marketplace API Routes
 * 
 * REST API endpoints for managing AI provider configurations
 */

import { Router, Request, Response } from 'express'
import { IntegrationMarketplaceService } from '../services/IntegrationMarketplaceService'

const router = Router()

// Lazy initialization - create service only when needed (after env vars are loaded)
let serviceInstance: IntegrationMarketplaceService | null = null

function getService(): IntegrationMarketplaceService {
  if (!serviceInstance) {
    serviceInstance = new IntegrationMarketplaceService()
  }
  return serviceInstance
}

/**
 * GET /api/integration-marketplace/providers
 * Get all enabled providers (for marketplace UI)
 */
router.get('/providers', async (req: Request, res: Response) => {
  try {
    const providers = await getService().getProviders()
    res.json({
      success: true,
      data: providers,
      count: providers.length,
    })
  } catch (error) {
    console.error('Error fetching providers:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch providers',
    })
  }
})

/**
 * GET /api/integration-marketplace/providers/all
 * Get all providers including disabled (for admin management)
 */
router.get('/providers/all', async (req: Request, res: Response) => {
  try {
    const providers = await getService().getAllProviders()
    res.json({
      success: true,
      data: providers,
      count: providers.length,
    })
  } catch (error) {
    console.error('Error fetching all providers:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch all providers',
    })
  }
})

/**
 * GET /api/integration-marketplace/providers/:id
 * Get single provider by ID
 */
router.get('/providers/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const provider = await getService().getProviderById(id)

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider not found',
      })
    }

    res.json({
      success: true,
      data: provider,
    })
  } catch (error) {
    console.error('Error fetching provider:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch provider',
    })
  }
})

/**
 * POST /api/integration-marketplace/providers
 * Create new provider
 */
router.post('/providers', async (req: Request, res: Response) => {
  try {
    const providerData = req.body

    // Validate required fields
    if (!providerData.name || !providerData.providerId) {
      return res.status(400).json({
        success: false,
        error: 'Name and Provider ID are required',
      })
    }

    const provider = await getService().createProvider(providerData)
    res.status(201).json({
      success: true,
      data: provider,
    })
  } catch (error) {
    console.error('Error creating provider:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create provider',
    })
  }
})

/**
 * PUT /api/integration-marketplace/providers/:id
 * Update existing provider
 */
router.put('/providers/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updates = req.body

    const provider = await getService().updateProvider(id, updates)
    res.json({
      success: true,
      data: provider,
    })
  } catch (error) {
    console.error('Error updating provider:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update provider',
    })
  }
})

/**
 * DELETE /api/integration-marketplace/providers/:id
 * Delete provider
 */
router.delete('/providers/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    await getService().deleteProvider(id)
    res.json({
      success: true,
      message: 'Provider deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting provider:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete provider',
    })
  }
})

export default router

