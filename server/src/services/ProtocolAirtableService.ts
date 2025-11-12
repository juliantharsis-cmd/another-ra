import Airtable from 'airtable'
import { RelationshipResolver } from './RelationshipResolver'

/**
 * Protocol Airtable Service
 * 
 * Auto-generated service for Protocol table
 */
export class ProtocolAirtableService {
  private base: Airtable.Base
  private tableName: string
  private relationshipResolver: RelationshipResolver

  constructor() {
    const apiKey = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || 
                   process.env.AIRTABLE_API_KEY
    
    if (!apiKey) {
      throw new Error('Airtable API token is required')
    }
    
    const baseId = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID || 
                   'appGtLbKhmNkkTLVL'
    
    this.tableName = 'Protocol'
    
    Airtable.configure({ apiKey })
    this.base = Airtable.base(baseId)
    this.relationshipResolver = new RelationshipResolver(baseId, apiKey)
  }

  // TODO: Implement getAll, getById, create, update, delete methods
  // This is a template - customize based on your needs
}
