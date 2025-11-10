import { Router } from 'express'
import { userController } from '../controllers/UserController'

const router = Router()

// GET /user/preferences - Get user preferences
router.get('/preferences', (req, res) => userController.getPreferences(req, res))

// PUT /user/preferences - Update user preferences
router.put('/preferences', (req, res) => userController.updatePreferences(req, res))

export default router

