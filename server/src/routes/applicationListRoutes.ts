import { Router } from 'express'
import { applicationListController } from '../controllers/ApplicationListController'

const router = Router()

// GET /api/application-list - Get all Application List records
router.get('/', (req, res) => applicationListController.getAll(req, res))

// GET /api/application-list/filters/values - Get distinct filter values
router.get('/filters/values', (req, res) => applicationListController.getFilterValues(req, res))

// GET /api/application-list/:id - Get a single Application List record
router.get('/:id', (req, res) => applicationListController.getById(req, res))

// POST /api/application-list - Create a new Application List record
router.post('/', (req, res) => applicationListController.create(req, res))

// PUT /api/application-list/:id - Update a Application List record
router.put('/:id', (req, res) => applicationListController.update(req, res))

// DELETE /api/application-list/:id - Delete a Application List record
router.delete('/:id', (req, res) => applicationListController.delete(req, res))

export default router

