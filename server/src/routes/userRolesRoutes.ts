import { Router } from 'express'
import { userRolesController } from '../controllers/UserRolesController'

const router = Router()

// GET /api/user-roles - Get all or paginated User Roles records
router.get('/', (req, res) => userRolesController.getAll(req, res))

// GET /api/user-roles/filters/values - Get distinct values for filter fields
router.get('/filters/values', (req, res) => userRolesController.getFilterValues(req, res))

// GET /api/user-roles/:id - Get a single User Role by ID
router.get('/:id', (req, res) => userRolesController.getById(req, res))

// POST /api/user-roles - Create a new User Role
router.post('/', (req, res) => userRolesController.create(req, res))

// PUT /api/user-roles/:id - Update an existing User Role
router.put('/:id', (req, res) => userRolesController.update(req, res))

// DELETE /api/user-roles/:id - Delete a User Role
router.delete('/:id', (req, res) => userRolesController.delete(req, res))

export default router




