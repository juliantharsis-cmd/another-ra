import { Router } from 'express'
import { KeywordsTagsController } from '../controllers/KeywordsTagsController'

const router = Router()
const controller = new KeywordsTagsController()

// GET /api/keywords-tags - Get all with pagination, filtering, sorting
router.get('/', (req, res) => controller.getAll(req, res))

// GET /api/keywords-tags/:id - Get single record
router.get('/:id', (req, res) => controller.getById(req, res))

// POST /api/keywords-tags - Create new record
router.post('/', (req, res) => controller.create(req, res))

// PUT /api/keywords-tags/:id - Update record
router.put('/:id', (req, res) => controller.update(req, res))

// DELETE /api/keywords-tags/:id - Delete record
router.delete('/:id', (req, res) => controller.delete(req, res))

export default router
