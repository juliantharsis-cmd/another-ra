import { Router } from 'express'
import { userRolesController } from '../controllers/UserRolesController'

const router = Router()

// GET /api/user-roles - Get all User Roles records
router.get('/', (req, res) => userRolesController.getAll(req, res))

export default router




