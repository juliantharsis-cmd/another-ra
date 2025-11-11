import { Router } from 'express'
import { StandardEmissionFactorController } from '../controllers/StandardEmissionFactorController'

const router = Router()
const controller = new StandardEmissionFactorController()

// GET /api/standard-emission-factors - Get all with pagination, filtering, sorting
router.get('/', (req, res) => controller.getAll(req, res))

// GET /api/standard-emission-factors/:id - Get single record
router.get('/:id', (req, res) => controller.getById(req, res))

// POST /api/standard-emission-factors - Create new record
router.post('/', (req, res) => controller.create(req, res))

// PUT /api/standard-emission-factors/:id - Update record
router.put('/:id', (req, res) => controller.update(req, res))

// DELETE /api/standard-emission-factors/:id - Delete record
router.delete('/:id', (req, res) => controller.delete(req, res))

// GET /api/standard-emission-factors/filters/values - Get filter values
router.get('/filters/values', (req, res) => controller.getFilterValues(req, res))

export default router

