import { Router } from 'express'
import { efGwpController } from '../controllers/EFGWPController'

const router = Router()

// GET /api/emission-factors - Get all EF GWP records
router.get('/', (req, res) => efGwpController.getAll(req, res))

// GET /api/emission-factors/filters/values - Get distinct filter values
router.get('/filters/values', (req, res) => efGwpController.getFilterValues(req, res))

// GET /api/emission-factors/:id - Get a single EF GWP record
router.get('/:id', (req, res) => efGwpController.getById(req, res))

// POST /api/emission-factors - Create a new EF GWP record
router.post('/', (req, res) => efGwpController.create(req, res))

// PATCH /api/emission-factors/:id - Update an EF GWP record
router.patch('/:id', (req, res) => efGwpController.update(req, res))

// DELETE /api/emission-factors/:id - Delete an EF GWP record
router.delete('/:id', (req, res) => efGwpController.delete(req, res))

export default router

// Export alias for backward compatibility (deprecated)
export const emissionFactorRoutes = router

