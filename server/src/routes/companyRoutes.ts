import { Router } from 'express'
import { companyController } from '../controllers/CompanyController'

const router = Router()

// GET /api/companies - Get all companies
router.get('/', (req, res) => companyController.getAll(req, res))

// GET /api/companies/filters/values - Get distinct filter values
router.get('/filters/values', (req, res) => companyController.getFilterValues(req, res))

// POST /api/companies/import - Bulk import companies (MUST come before /:id route)
router.post('/import', (req, res) => companyController.bulkImport(req, res))

// GET /api/companies/:id - Get a single company
router.get('/:id', (req, res) => companyController.getById(req, res))

// POST /api/companies - Create a new company
router.post('/', (req, res) => companyController.create(req, res))

// PUT /api/companies/:id - Update a company
router.put('/:id', (req, res) => companyController.update(req, res))

// DELETE /api/companies/:id - Delete a company
router.delete('/:id', (req, res) => companyController.delete(req, res))

export default router

