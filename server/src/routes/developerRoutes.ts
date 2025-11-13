/**
 * Developer Routes
 * 
 * API endpoints for developer tools, including table creation workflow
 */

import { Router, Request, Response } from 'express'
import { DeveloperService } from '../services/DeveloperService'

const router = Router()
let developerService: DeveloperService | null = null

function getDeveloperService(): DeveloperService {
  if (!developerService) {
    developerService = new DeveloperService()
  }
  return developerService
}

/**
 * GET /api/developer/tables/bases
 * List all accessible Airtable bases/apps
 */
router.get('/tables/bases', async (req: Request, res: Response) => {
  try {
    const service = getDeveloperService()
    const bases = await service.listBases()
    res.json({ bases })
  } catch (error: any) {
    console.error('Error listing bases:', error)
    res.status(500).json({
      error: error.message || 'Failed to list bases',
    })
  }
})

/**
 * GET /api/developer/tables/bases/:baseId/tables
 * List all tables in a specific Airtable base/app
 */
router.get('/tables/bases/:baseId/tables', async (req: Request, res: Response) => {
  try {
    const { baseId } = req.params
    const service = getDeveloperService()
    const tables = await service.listTables(baseId)
    res.json({ tables })
  } catch (error: any) {
    console.error('Error listing tables:', error)
    res.status(500).json({
      error: error.message || 'Failed to list tables',
    })
  }
})

/**
 * GET /api/developer/tables/bases/:baseId/tables/:tableId/schema
 * Get table schema from Airtable
 */
router.get('/tables/bases/:baseId/tables/:tableId/schema', async (req: Request, res: Response) => {
  try {
    const { baseId, tableId } = req.params
    const service = getDeveloperService()
    const schema = await service.getTableSchema(baseId, tableId)
    res.json(schema)
  } catch (error: any) {
    console.error('Error fetching table schema:', error)
    res.status(500).json({
      error: error.message || 'Failed to fetch table schema',
    })
  }
})

/**
 * POST /api/developer/tables/create
 * Create a table from Airtable (async job)
 */
router.post('/tables/create', async (req: Request, res: Response) => {
  try {
    const { source, baseId, tableId, targetSection } = req.body

    if (!source || !baseId || !tableId) {
      return res.status(400).json({
        error: 'Missing required fields: source, baseId, and tableId are required',
      })
    }

    if (source !== 'airtable') {
      return res.status(400).json({
        error: 'Only "airtable" source is currently supported',
      })
    }

    const service = getDeveloperService()
    const job = await service.createTable({
      source,
      baseId,
      tableId,
      targetSection,
    })

    res.json(job)
  } catch (error: any) {
    console.error('Error creating table:', error)
    res.status(500).json({
      error: error.message || 'Failed to create table',
    })
  }
})

/**
 * GET /api/developer/tables/verify/:tableName
 * Verify if table files were created (useful when job record is lost)
 */
router.get('/tables/verify/:tableName', async (req: Request, res: Response) => {
  try {
    const { tableName } = req.params
    const fs = require('fs')
    const path = require('path')
    
    // Convert table name to file names
    const toPascalCase = (str: string) => str.replace(/[^a-zA-Z0-9]/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('')
    const toCamelCase = (str: string) => {
      const pascal = toPascalCase(str)
      return pascal.charAt(0).toLowerCase() + pascal.slice(1)
    }
    
    const serviceFileName = `${toPascalCase(tableName)}AirtableService.ts`
    const apiFileName = `${toCamelCase(tableName)}.ts`
    const routeFileName = `${toCamelCase(tableName)}Routes.ts`
    const configFileName = `${toCamelCase(tableName)}Config.tsx`
    
    const projectRoot = path.resolve(__dirname, '../..')
    const servicePath = path.join(__dirname, '../services', serviceFileName)
    const apiPath = path.join(projectRoot, 'src', 'lib', 'api', apiFileName)
    // Route path: from server/src/routes to server/src/routes (same directory)
    const routePath = path.resolve(__dirname, routeFileName)
    const configPath = path.join(projectRoot, 'src', 'components', 'templates', 'configs', configFileName)
    
    const filesCreated = {
      service: fs.existsSync(servicePath),
      api: fs.existsSync(apiPath),
      route: fs.existsSync(routePath),
      config: fs.existsSync(configPath),
    }
    
    const allCreated = filesCreated.service && filesCreated.api && filesCreated.route && filesCreated.config
    
    res.json({
      success: true,
      tableName,
      filesCreated,
      allCreated,
      paths: {
        service: servicePath,
        api: apiPath,
        route: routePath,
        config: configPath,
      },
    })
  } catch (error: any) {
    console.error('Error verifying table files:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify table files',
    })
  }
})

/**
 * GET /api/developer/tables/jobs/:jobId
 * Get job status
 */
router.get('/tables/jobs/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params
    const service = getDeveloperService()
    const job = await service.getJobStatus(jobId)
    
    if (!job) {
      // Return a structured response that indicates the job is gone
      // This could be due to server restart or cleanup
      return res.status(404).json({
        error: 'Job not found. It may have been completed, cleaned up, or the server was restarted.',
        status: 'not-found',
        jobId,
      })
    }
    
    res.json(job)
  } catch (error: any) {
    console.error('Error fetching job status:', error)
    res.status(500).json({
      error: error.message || 'Failed to fetch job status',
      status: 'error',
    })
  }
})

/**
 * POST /api/developer/tables/jobs/:jobId/finalize
 * Finalize table creation (Phase 2)
 */
router.post('/tables/jobs/:jobId/finalize', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params
    const { addSidebarEntry } = req.body
    
    const service = getDeveloperService()
    await service.finalizeTable(jobId, addSidebarEntry === true)
    
    // Get updated job status
    const job = await service.getJobStatus(jobId)
    res.json(job)
  } catch (error: any) {
    console.error('Error finalizing table creation:', error)
    res.status(500).json({
      error: error.message || 'Failed to finalize table creation',
    })
  }
})

/**
 * POST /api/developer/tables/jobs/:jobId/cancel
 * Cancel table creation and remove generated files
 */
router.post('/tables/jobs/:jobId/cancel', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params
    
    const service = getDeveloperService()
    await service.cancelTableCreation(jobId)
    
    // Get updated job status
    const job = await service.getJobStatus(jobId)
    res.json(job)
  } catch (error: any) {
    console.error('Error cancelling table creation:', error)
    res.status(500).json({
      error: error.message || 'Failed to cancel table creation',
    })
  }
})

export default router

