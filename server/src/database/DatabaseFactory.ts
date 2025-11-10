import { IDatabase } from './interfaces/IDatabase'
import { AirtableAdapter } from './adapters/AirtableAdapter'
import { PostgreSQLAdapter } from './adapters/PostgreSQLAdapter'
import { MockAdapter } from './adapters/MockAdapter'

/**
 * Database Factory
 * 
 * Creates and returns the appropriate database adapter based on environment configuration.
 * This allows easy switching between different database backends.
 * 
 * Environment Variables:
 * - DATABASE_TYPE: 'airtable' | 'postgresql' | 'mock' (default: 'airtable')
 * - For Airtable: AIRTABLE_PERSONAL_ACCESS_TOKEN, AIRTABLE_SYSTEM_CONFIG_BASE_ID
 * - For PostgreSQL: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
 */
export class DatabaseFactory {
  private static instance: IDatabase | null = null

  /**
   * Get the database instance (singleton pattern)
   */
  static getDatabase(): IDatabase {
    // Reset instance if environment variables changed (for development)
    // This ensures fresh initialization on restart
    if (this.instance) {
      // Check if we should reset (e.g., if env vars are different)
      const currentToken = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY
      if (!currentToken && this.instance.getName() === 'Airtable') {
        console.log('🔄 Resetting database instance due to missing credentials')
        this.instance = null
      }
    }

    if (this.instance) {
      return this.instance
    }

    const dbType = (process.env.DATABASE_TYPE || 'airtable').toLowerCase()

    switch (dbType) {
      case 'postgresql':
      case 'postgres':
        console.log('🗄️  Initializing PostgreSQL database adapter...')
        this.instance = new PostgreSQLAdapter()
        break

      case 'airtable':
        console.log('📊 Initializing Airtable database adapter...')
        // Check if Airtable credentials are available
        const hasAirtableCredentials = !!(
          process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || 
          process.env.AIRTABLE_API_KEY
        )
        
        if (hasAirtableCredentials) {
          console.log('✅ Airtable credentials found, using Airtable adapter')
          this.instance = new AirtableAdapter()
        } else {
          console.log('⚠️  Airtable credentials not found, falling back to mock data')
          console.log('   Set AIRTABLE_PERSONAL_ACCESS_TOKEN in .env file')
          this.instance = new MockAdapter()
        }
        break

      case 'mock':
      case 'memory':
        console.log('💾 Initializing Mock (in-memory) database adapter...')
        this.instance = new MockAdapter()
        break

      default:
        console.warn(`⚠️  Unknown database type "${dbType}", using mock adapter`)
        this.instance = new MockAdapter()
    }

    // Perform health check
    this.instance.healthCheck()
      .then(isHealthy => {
        if (isHealthy) {
          console.log(`✅ Database connection healthy (${this.instance!.getName()})`)
        } else {
          console.warn(`⚠️  Database health check failed (${this.instance!.getName()})`)
        }
      })
      .catch(error => {
        console.error(`❌ Database health check error:`, error)
      })

    return this.instance
  }

  /**
   * Reset the database instance (useful for testing)
   */
  static reset(): void {
    this.instance = null
  }
}

