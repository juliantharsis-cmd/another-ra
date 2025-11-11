import { Router } from 'express'
import { StandardECMClassificationController } from '../controllers/StandardECMClassificationController'

const router = Router()
const controller = new StandardECMClassificationController()

router.get('/', (req, res) => controller.getAll(req, res))
router.get('/:id', (req, res) => controller.getById(req, res))
router.post('/', (req, res) => controller.create(req, res))
router.put('/:id', (req, res) => controller.update(req, res))
router.delete('/:id', (req, res) => controller.delete(req, res))
router.get('/filters/values', (req, res) => controller.getFilterValues(req, res))

export default router

