import { Router } from 'express'
import { ActivityDensityController } from '../controllers/ActivityDensityController'

const router = Router()
const controller = new ActivityDensityController()

// GET /api/activity-density - Get all with pagination, filtering, sorting
router.get('/', (req, res) => controller.getAll(req, res))

// GET /api/activity-density/:id - Get single record
router.get('/:id', (req, res) => controller.getById(req, res))

// POST /api/activity-density - Create new record
router.post('/', (req, res) => controller.create(req, res))

// PUT /api/activity-density/:id - Update record
router.put('/:id', (req, res) => controller.update(req, res))

// DELETE /api/activity-density/:id - Delete record
router.delete('/:id', (req, res) => controller.delete(req, res))

export default router
