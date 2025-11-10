/**
 * Preferences Routes
 */

import { Router } from 'express'
import { preferencesController } from '../controllers/PreferencesController'

const router = Router()

// GET /api/preferences/:userId - Get all preferences for a user
router.get('/:userId', (req, res) => preferencesController.getAll(req, res))

// GET /api/preferences/:userId/:namespace/:key - Get a single preference
router.get('/:userId/:namespace/:key', (req, res) => preferencesController.get(req, res))

// PUT /api/preferences/:userId/:namespace/:key - Set (create or update) a preference
router.put('/:userId/:namespace/:key', (req, res) => preferencesController.set(req, res))

// POST /api/preferences - Set a preference (alternative endpoint)
router.post('/', (req, res) => preferencesController.set(req, res))

// DELETE /api/preferences/:userId/:namespace/:key - Delete a preference
router.delete('/:userId/:namespace/:key', (req, res) => preferencesController.delete(req, res))

// DELETE /api/preferences/:userId - Delete all preferences for a user
router.delete('/:userId', (req, res) => preferencesController.deleteAll(req, res))

export default router

