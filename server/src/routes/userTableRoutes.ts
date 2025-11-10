import { Router } from 'express'
import { userTableController } from '../controllers/UserTableController'

const router = Router()

// GET /api/users/filters/values - Get distinct filter values (must come before /:id)
router.get('/filters/values', (req, res) => userTableController.getFilterValues(req, res))

// GET /api/users - Get all user table records
router.get('/', (req, res) => userTableController.getAll(req, res))

// GET /api/users/:id - Get a single user table record (must come last)
router.get('/:id', (req, res) => userTableController.getById(req, res))

// POST /api/users - Create a new user table record
router.post('/', (req, res) => userTableController.create(req, res))

// PUT /api/users/:id - Update a user table record
router.put('/:id', (req, res) => userTableController.update(req, res))

// DELETE /api/users/:id - Delete a user table record
router.delete('/:id', (req, res) => userTableController.delete(req, res))

export default router

