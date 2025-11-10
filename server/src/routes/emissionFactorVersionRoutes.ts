import { Router } from 'express'
import { emissionFactorVersionController } from '../controllers/EmissionFactorVersionController'

const router = Router()

// GET /api/emission-factor-version - Get all Emission Factor Version records
router.get('/', (req, res) => emissionFactorVersionController.getAll(req, res))

// GET /api/emission-factor-version/filters/values - Get distinct filter values
router.get('/filters/values', (req, res) => emissionFactorVersionController.getFilterValues(req, res))

// GET /api/emission-factor-version/:id - Get a single Emission Factor Version record
router.get('/:id', (req, res) => emissionFactorVersionController.getById(req, res))

// POST /api/emission-factor-version - Create a new Emission Factor Version record
router.post('/', (req, res) => emissionFactorVersionController.create(req, res))

// PUT /api/emission-factor-version/:id - Update a Emission Factor Version record
router.put('/:id', (req, res) => emissionFactorVersionController.update(req, res))

// DELETE /api/emission-factor-version/:id - Delete a Emission Factor Version record
router.delete('/:id', (req, res) => emissionFactorVersionController.delete(req, res))

export default router

