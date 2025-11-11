import express from 'express'
import multer from 'multer'
import { industryClassificationController } from '../controllers/IndustryClassificationController'

const router = express.Router()

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
})

// GET /api/industry-classification - Get all or paginated Industry Classification records
router.get('/', (req, res) => industryClassificationController.getAll(req, res))

// GET /api/industry-classification/filters/values - Get distinct values for filter fields
router.get('/filters/values', (req, res) => industryClassificationController.getFilterValues(req, res))

// POST /api/industry-classification/upload - Upload a file
router.post('/upload', upload.single('file'), (req, res) => industryClassificationController.uploadFile(req, res))

// GET /api/industry-classification/:id - Get a single Industry Classification by ID
router.get('/:id', (req, res) => industryClassificationController.getById(req, res))

// POST /api/industry-classification - Create a new Industry Classification
router.post('/', (req, res) => industryClassificationController.create(req, res))

// PUT /api/industry-classification/:id - Update an existing Industry Classification
router.put('/:id', (req, res) => industryClassificationController.update(req, res))

// DELETE /api/industry-classification/:id - Delete an Industry Classification
router.delete('/:id', (req, res) => industryClassificationController.delete(req, res))

export default router

