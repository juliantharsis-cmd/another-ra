import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import companyRoutes from './routes/companyRoutes'
import geographyRoutes from './routes/geographyRoutes'
import userRoutes from './routes/userRoutes'
import efGwpRoutes from './routes/efGwpRoutes'
import ghgTypeRoutes from './routes/ghgTypeRoutes'
import tableSchemaRoutes from './routes/tableSchemaRoutes'
import tableConfigurationRoutes from './routes/tableConfigurationRoutes'
import emissionFactorVersionRoutes from './routes/emissionFactorVersionRoutes'
import preferencesRoutes from './routes/preferencesRoutes'
import applicationListRoutes from './routes/applicationListRoutes'
import userTableRoutes from './routes/userTableRoutes'
import userRolesRoutes from './routes/userRolesRoutes'

// Load environment variables FIRST, before any other imports
// Use explicit path to ensure .env is loaded from server directory
import { resolve } from 'path'
dotenv.config({ path: resolve(__dirname, '../.env') })
dotenv.config() // Also try default location

// Log database configuration for debugging
console.log('🔧 Environment Configuration:')
console.log(`  DATABASE_TYPE: ${process.env.DATABASE_TYPE || 'airtable (default)'}`)
console.log(`  PREFERENCES_ADAPTER: ${process.env.PREFERENCES_ADAPTER || 'airtable (default)'}`)
console.log(`  AIRTABLE_PERSONAL_ACCESS_TOKEN: ${process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN ? '✅ Set (' + process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN.substring(0, 20) + '...)' : '❌ Not set'}`)
console.log(`  AIRTABLE_SYSTEM_CONFIG_BASE_ID: ${process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 'Not set'}`)
console.log(`  AIRTABLE_COMPANY_TABLE_ID: ${process.env.AIRTABLE_COMPANY_TABLE_ID || 'Not set'}`)
console.log(`  .env file location: ${resolve(__dirname, '../.env')}`)
if (!process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN) {
  console.error('❌ WARNING: AIRTABLE_PERSONAL_ACCESS_TOKEN not found in environment!')
  console.error('   Make sure .env file exists in server/ directory')
}
console.log('')

const app: Express = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('✅ CORS: Allowing request with no origin')
      return callback(null, true)
    }
    
    console.log(`🔍 CORS: Checking origin: ${origin}`)
    
    // Allow localhost for local development
    if (origin === 'http://localhost:3000' || origin === 'http://127.0.0.1:3000') {
      console.log('✅ CORS: Allowing localhost origin')
      return callback(null, true)
    }
    
    // Allow GitHub Codespaces preview URLs (multiple formats)
    // Format 1: https://xxx-3000.preview.app.github.dev
    // Format 2: https://xxx.preview.app.github.dev
    // Format 3: https://*.github.dev (any GitHub dev domain)
    if (
      /^https:\/\/.*\.preview\.app\.github\.dev$/.test(origin) ||
      /^https:\/\/.*\.github\.dev$/.test(origin) ||
      /^https:\/\/.*\.app\.github\.dev$/.test(origin)
    ) {
      console.log('✅ CORS: Allowing GitHub Codespaces origin')
      return callback(null, true)
    }
    
    // Log rejected origins for debugging
    console.warn(`❌ CORS: Rejected origin: ${origin}`)
    console.warn(`   This origin doesn't match any allowed patterns.`)
    console.warn(`   Allowed patterns:`)
    console.warn(`   - http://localhost:3000`)
    console.warn(`   - https://*.preview.app.github.dev`)
    console.warn(`   - https://*.github.dev`)
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'Accept-Language', 'X-Timezone'],
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  // Log POST requests with body preview
  if (req.method === 'POST' && req.path.includes('/companies')) {
    console.log(`   Body preview:`, req.body ? JSON.stringify(req.body).substring(0, 200) : 'no body')
  }
  next()
})

// Root endpoint - redirect to health check
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Another RA API Server',
    status: 'ok',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      status: '/api/status',
      companies: '/api/companies',
      users: '/api/users',
    },
    note: 'This is the backend API. Access the frontend on port 3000.',
  })
})

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Another RA API',
  })
})

// Status endpoint - shows data source information
app.get('/api/status', async (req: Request, res: Response) => {
  const { companyRepository } = await import('./data/CompanyRepository')
  const { DatabaseFactory } = await import('./database/DatabaseFactory')
  
  const database = DatabaseFactory.getDatabase()
  const isHealthy = await companyRepository.healthCheck()
  
  res.json({
    status: isHealthy ? 'ok' : 'degraded',
    database: {
      type: process.env.DATABASE_TYPE || 'airtable',
      adapter: database.getName(),
      healthy: isHealthy,
    },
    airtable: {
      configured: !!(process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY),
      baseId: process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 'Not set',
      tableId: process.env.AIRTABLE_COMPANY_TABLE_ID || 'Not set',
    },
    postgresql: {
      configured: !!(
        process.env.DB_HOST &&
        process.env.DB_NAME &&
        process.env.DB_USER
      ),
    },
    timestamp: new Date().toISOString(),
  })
})

// API Routes
app.use('/api/companies', companyRoutes)
app.use('/api/geography', geographyRoutes)
app.use('/api/user', userRoutes)
app.use('/api/emission-factors', efGwpRoutes)
app.use('/api/ghg-types', ghgTypeRoutes)
app.use('/api/preferences', preferencesRoutes)
app.use('/api/tables', tableSchemaRoutes)
app.use('/api/configurations', tableConfigurationRoutes)
app.use('/api/emission-factor-version', emissionFactorVersionRoutes)
app.use('/api/application-list', applicationListRoutes)
app.use('/api/user-roles', userRolesRoutes)
app.use('/api/users', userTableRoutes)

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
  })
})

// Error handler
app.use((err: Error, req: Request, res: Response, next: express.NextFunction) => {
  console.error('❌ Unhandled Error:', err)
  console.error('   Error stack:', err.stack)
  console.error('   Request path:', req.path)
  console.error('   Request method:', req.method)
  console.error('   Request body:', JSON.stringify(req.body, null, 2))
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`)
  console.log(`📋 Health check: http://localhost:${PORT}/health`)
  console.log(`📊 Companies API: http://localhost:${PORT}/api/companies`)
})

