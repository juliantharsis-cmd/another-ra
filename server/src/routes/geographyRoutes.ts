import { Router } from 'express'
import { geographyController } from '../controllers/GeographyController'

const router = Router()

// GET /api/geography - Get all geography records
router.get('/', (req, res) => geographyController.getAll(req, res))

// GET /api/geography/filters/values - Get distinct filter values
router.get('/filters/values', (req, res) => geographyController.getFilterValues(req, res))

// GET /api/geography/:id - Get a single geography record
router.get('/:id', (req, res) => geographyController.getById(req, res))

// POST /api/geography - Create a new geography record
router.post('/', (req, res) => geographyController.create(req, res))

// PUT /api/geography/:id - Update a geography record
router.put('/:id', (req, res) => geographyController.update(req, res))

// DELETE /api/geography/:id - Delete a geography record
router.delete('/:id', (req, res) => geographyController.delete(req, res))

export default router








