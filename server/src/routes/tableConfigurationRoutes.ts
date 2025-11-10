import { Router } from 'express'
import { tableConfigurationController } from '../controllers/TableConfigurationController'

const router = Router()

// GET /api/configurations/:tableName - Get table configuration
router.get('/:tableName', (req, res) => tableConfigurationController.getConfiguration(req, res))

// PUT /api/configurations/:tableName - Update table configuration
router.put('/:tableName', (req, res) => tableConfigurationController.updateConfiguration(req, res))

export default router

