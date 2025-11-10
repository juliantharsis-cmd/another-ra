import { Router } from 'express'
import { tableSchemaController } from '../controllers/TableSchemaController'

const router = Router()

// GET /api/tables/:tableId/schema - Get table schema
router.get('/:tableId/schema', (req, res) => tableSchemaController.getSchema(req, res))

// PUT /api/tables/:tableId/schema - Update table schema
router.put('/:tableId/schema', (req, res) => tableSchemaController.updateSchema(req, res))

export default router

