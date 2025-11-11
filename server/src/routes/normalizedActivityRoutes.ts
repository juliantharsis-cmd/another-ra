import { Router } from 'express'
import { NormalizedActivityController } from '../controllers/NormalizedActivityController'

const router = Router()
const controller = new NormalizedActivityController()

router.get('/', (req, res) => controller.getAll(req, res))
router.get('/:id', (req, res) => controller.getById(req, res))
router.post('/', (req, res) => controller.create(req, res))
router.put('/:id', (req, res) => controller.update(req, res))
router.delete('/:id', (req, res) => controller.delete(req, res))
router.get('/filters/values', (req, res) => controller.getFilterValues(req, res))

export default router

