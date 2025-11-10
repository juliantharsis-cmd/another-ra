import { Router } from 'express'
import { tableSchemaController } from '../controllers/TableSchemaController'
import { fieldMappingController } from '../controllers/FieldMappingController'

const router = Router()

// GET /api/tables/:tableId/schema - Get table schema
router.get('/:tableId/schema', (req, res) => tableSchemaController.getSchema(req, res))

// PUT /api/tables/:tableId/schema - Update table schema
router.put('/:tableId/schema', (req, res) => tableSchemaController.updateSchema(req, res))

// GET /api/tables/:tableId/field-mapping - Get field ID mapping
router.get('/:tableId/field-mapping', (req, res) => fieldMappingController.getFieldMapping(req, res))

// POST /api/tables/:tableId/field-mapping - Create or update field ID mapping
router.post('/:tableId/field-mapping', (req, res) => fieldMappingController.createOrUpdateFieldMapping(req, res))

export default router

