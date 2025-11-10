import { Router } from 'express'
import { ghgTypeController } from '../controllers/GHGTypeController'

const router = Router()

// GET /api/ghg-types - Get all GHG Type records
router.get('/', (req, res) => ghgTypeController.getAll(req, res))

// GET /api/ghg-types/filters/values - Get distinct filter values
router.get('/filters/values', (req, res) => ghgTypeController.getFilterValues(req, res))

// GET /api/ghg-types/:id - Get a single GHG Type record
router.get('/:id', (req, res) => ghgTypeController.getById(req, res))

// POST /api/ghg-types - Create a new GHG Type record
router.post('/', (req, res) => ghgTypeController.create(req, res))

// PUT /api/ghg-types/:id - Update a GHG Type record
router.put('/:id', (req, res) => ghgTypeController.update(req, res))

// DELETE /api/ghg-types/:id - Delete a GHG Type record
router.delete('/:id', (req, res) => ghgTypeController.delete(req, res))

export default router

