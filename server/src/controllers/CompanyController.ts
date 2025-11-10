import { Request, Response } from 'express'
// Lazy import to ensure env vars are loaded first
let companyRepository: any = null
const getCompanyRepository = async () => {
  if (!companyRepository) {
    const repo = await import('../data/CompanyRepository')
    companyRepository = repo.companyRepository
  }
  return companyRepository
}
import { CreateCompanyDto, UpdateCompanyDto } from '../types/Company'
import { QueryOptions } from '../database/interfaces/IDatabase'

export class CompanyController {
  /**
   * GET /companies
   * Retrieve all companies with optional query parameters
   * 
   * Query Parameters:
   * - limit: number of records to return
   * - offset: number of records to skip
   * - sortBy: field to sort by
   * - sortOrder: 'asc' or 'desc'
   * - search: full-text search across company fields
   * - status: filter by status
   * - primaryIndustry: filter by industry
   * - paginated: if true, returns paginated result
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const repo = await getCompanyRepository()
      const {
        limit,
        offset,
        sortBy,
        sortOrder,
        search,
        status,
        primaryIndustry,
        primaryActivity,
        paginated,
      } = req.query

      // Build query options
      const options: QueryOptions = {
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc' | undefined,
        search: search as string,
        filters: {},
      }

      // Add filters
      if (status) {
        options.filters!['status'] = status
      }
      if (primaryIndustry) {
        options.filters!['primaryIndustry'] = primaryIndustry
      }
      if (primaryActivity) {
        options.filters!['primaryActivity'] = primaryActivity
      }

      // Return paginated result if requested
      if (paginated === 'true' || limit || offset) {
        const result = await repo.findPaginated(options)
        res.json({
          success: true,
          data: result.data,
          pagination: {
            total: result.total,
            limit: result.limit,
            offset: result.offset,
            hasMore: result.hasMore,
          },
        })
      } else {
        const companies = await repo.findAll(options)
        res.json({
          success: true,
          data: companies,
          count: companies.length,
        })
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve companies',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * GET /companies/:id
   * Retrieve a single company by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const repo = await getCompanyRepository()
      const { id } = req.params
      const company = await repo.findById(id)

      if (!company) {
        res.status(404).json({
          success: false,
          error: 'Company not found',
        })
        return
      }

      res.json({
        success: true,
        data: company,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve company',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * POST /companies
   * Create a new company
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateCompanyDto = req.body

      // Validation
      if (!dto.isinCode || !dto.companyName || !dto.status) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
          required: ['isinCode', 'companyName', 'status'],
        })
        return
      }

      // Get user from request (in real app, from auth token)
      const userId = (req.headers['x-user-id'] as string) || 'System'

      const repo = await getCompanyRepository()
      const company = await repo.create(dto, userId)

      res.status(201).json({
        success: true,
        data: company,
        message: 'Company created successfully',
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create company',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * PUT /companies/:id
   * Update an existing company
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const repo = await getCompanyRepository()
      const { id } = req.params
      const dto: UpdateCompanyDto = req.body

      console.log(`🔄 Updating company with ID: ${id}`)
      console.log(`   Request body:`, JSON.stringify(dto, null, 2))
      
      // Get user from request (in real app, from auth token)
      const userId = (req.headers['x-user-id'] as string) || 'System'

      // Try to update directly - the update method will return null if not found
      const company = await repo.update(id, dto, userId)

      if (!company) {
        // Check if company exists to provide better error message
        const exists = await repo.exists(id)
        if (!exists) {
          res.status(404).json({
            success: false,
            error: 'Company not found',
            message: `No company found with ID: ${id}`,
          })
          return
        } else {
          // Company exists but update failed for another reason
          res.status(500).json({
            success: false,
            error: 'Failed to update company',
            message: 'Update operation failed - check server logs for details',
          })
          return
        }
      }

      res.json({
        success: true,
        data: company,
        message: 'Company updated successfully',
      })
    } catch (error) {
      console.error('❌ Error in CompanyController.update:', error)
      console.error('   Error type:', error instanceof Error ? error.constructor.name : typeof error)
      console.error('   Error message:', error instanceof Error ? error.message : String(error))
      if (error instanceof Error && error.stack) {
        console.error('   Error stack:', error.stack)
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to update company',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined,
      })
    }
  }

  /**
   * DELETE /companies/:id
   * Delete a company
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const repo = await getCompanyRepository()
      const { id } = req.params

      const deleted = await repo.delete(id)

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Company not found',
        })
        return
      }

      res.json({
        success: true,
        message: 'Company deleted successfully',
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete company',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * GET /companies/filters/values
   * Get distinct values for filter fields
   * 
   * Query Parameters:
   * - field: field name (status, primaryIndustry, primaryActivity, primarySector)
   * - limit: max number of values to return (default: 1000)
   */
  async getFilterValues(req: Request, res: Response): Promise<void> {
    try {
      const repo = await getCompanyRepository()
      const { field, limit } = req.query

      if (!field || typeof field !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Field parameter is required',
          message: 'Please specify a field name (status, primaryIndustry, primaryActivity, primarySector)',
        })
        return
      }

      const limitNum = limit ? parseInt(limit as string) : 1000
      const values = await repo.getDistinctFieldValues(field, limitNum)

      res.json({
        success: true,
        data: values,
        count: values.length,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve filter values',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * POST /companies/import
   * Bulk import companies from CSV data
   * 
   * Body: { companies: CreateCompanyDto[] }
   */
  async bulkImport(req: Request, res: Response): Promise<void> {
    try {
      console.log('🚀 BULK IMPORT REQUEST RECEIVED')
      console.log('   Method:', req.method)
      console.log('   Path:', req.path)
      console.log('   Body keys:', Object.keys(req.body || {}))
      console.log('   Companies count:', Array.isArray(req.body?.companies) ? req.body.companies.length : 'not an array')
      
      const repo = await getCompanyRepository()
      const { companies } = req.body
      
      console.log('   First company sample:', companies?.[0] ? JSON.stringify(companies[0], null, 2) : 'none')

      if (!Array.isArray(companies) || companies.length === 0) {
        console.error('❌ Invalid import request: companies is not an array or is empty')
        console.error('   Type:', typeof companies)
        console.error('   Value:', companies)
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'Companies array is required and must not be empty',
        })
        return
      }
      
      console.log(`📦 Starting bulk import of ${companies.length} companies`)

      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
      }

      // Import companies one by one (could be optimized with batch operations)
      for (let i = 0; i < companies.length; i++) {
        try {
          const company = companies[i]
          
          // Validate required fields
          if (!company.companyName || !company.isinCode) {
            results.failed++
            results.errors.push(`Row ${i + 1}: Missing required fields (companyName or isinCode)`)
            console.error(`Row ${i + 1} validation failed:`, { companyName: company.companyName, isinCode: company.isinCode })
            continue
          }

          // Normalize status (capitalize first letter)
          if (company.status) {
            company.status = company.status.charAt(0).toUpperCase() + company.status.slice(1).toLowerCase() as 'Active' | 'Closed'
            if (company.status !== 'Active' && company.status !== 'Closed') {
              company.status = 'Active' // Default to Active if invalid
            }
          } else {
            company.status = 'Active' // Default to Active if not provided
          }

          console.log(`Importing row ${i + 1}:`, { 
            companyName: company.companyName, 
            isinCode: company.isinCode,
            status: company.status 
          })

          // Create new company (duplicate detection can be added later)
          await repo.createCompany(company as CreateCompanyDto, 'System')
          results.success++
          console.log(`Successfully imported row ${i + 1}`)
        } catch (error) {
          results.failed++
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          results.errors.push(`Row ${i + 1}: ${errorMessage}`)
          console.error(`Row ${i + 1} import failed:`, error)
          if (error instanceof Error && error.stack) {
            console.error('Error stack:', error.stack)
          }
        }
      }

      res.json({
        success: true,
        data: results,
        message: `Imported ${results.success} companies. ${results.failed} failed.`,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to import companies',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}

export const companyController = new CompanyController()

