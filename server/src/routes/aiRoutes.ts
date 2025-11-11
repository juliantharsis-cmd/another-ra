/**
 * AI API Routes
 * 
 * REST API endpoints for making AI requests (chat, completions, etc.)
 * Proxies requests to AI providers while keeping API keys secure on the backend
 */

import { Router, Request, Response } from 'express'
import { AIService, ChatCompletionRequest, TestConnectionRequest } from '../services/AIService'

const router = Router()
const aiService = new AIService()

/**
 * POST /api/ai/chat
 * Make a chat completion request
 * 
 * Body:
 * {
 *   providerId: string (e.g., 'anthropic', 'openai')
 *   apiKey: string
 *   baseUrl?: string
 *   model: string
 *   messages: Array<{role: 'user' | 'assistant' | 'system', content: string}>
 *   maxTokens?: number
 *   temperature?: number
 * }
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const {
      providerId,
      apiKey,
      baseUrl,
      model,
      messages,
      maxTokens,
      temperature,
    } = req.body

    // Validate required fields
    if (!providerId || !apiKey || !model || !messages) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: providerId, apiKey, model, and messages are required',
      })
    }

    // Validate messages format
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Messages must be a non-empty array',
      })
    }

    const request: ChatCompletionRequest = {
      providerId,
      apiKey,
      baseUrl,
      model,
      messages,
      maxTokens,
      temperature,
    }

    const response = await aiService.chat(request)

    if (response.success) {
      res.json(response)
    } else {
      res.status(500).json(response)
    }
  } catch (error) {
    console.error('Error in /api/ai/chat:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    })
  }
})

/**
 * GET /api/ai/models/:providerId
 * Discover available models for a provider
 * 
 * Query params:
 * - apiKey: string (required)
 * - baseUrl?: string
 */
router.get('/models/:providerId', async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params
    const { apiKey, baseUrl } = req.query

    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'API key is required as query parameter',
      })
    }

    const discovery = await aiService.discoverModels(providerId, apiKey, baseUrl as string | undefined)

    if (discovery.success) {
      res.json(discovery)
    } else {
      res.status(500).json(discovery)
    }
  } catch (error) {
    console.error('Error in /api/ai/models:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    })
  }
})

/**
 * POST /api/ai/test-connection
 * Test connection to an AI provider
 * 
 * Body:
 * {
 *   providerId: string
 *   apiKey: string
 *   baseUrl?: string
 *   model?: string
 * }
 */
router.post('/test-connection', async (req: Request, res: Response) => {
  try {
    const { providerId, apiKey, baseUrl, model } = req.body

    // Validate required fields
    if (!providerId || !apiKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: providerId and apiKey are required',
      })
    }

    const request: TestConnectionRequest = {
      providerId,
      apiKey,
      baseUrl,
      model,
    }

    const response = await aiService.testConnection(request)

    if (response.success) {
      res.json(response)
    } else {
      res.status(400).json(response)
    }
  } catch (error) {
    console.error('Error in /api/ai/test-connection:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    })
  }
})

export default router

