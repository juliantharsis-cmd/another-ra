    import Airtable from 'airtable'

// Initialize Airtable client
// Note: In production, store API key in environment variables
const getAirtableBase = (baseId: string) => {
  const apiKey = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY || 
                 process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || 
                 ''
  
  if (!apiKey) {
    throw new Error('Airtable API key is required. Set NEXT_PUBLIC_AIRTABLE_API_KEY or AIRTABLE_PERSONAL_ACCESS_TOKEN environment variable.')
  }
  
  Airtable.configure({ apiKey })
  return Airtable.base(baseId)
}

export interface AirtableConfig {
  systemConfigBaseId?: string
  adminBaseId?: string
  ghgEmissionBaseId?: string
}

export const getSystemConfigBase = (baseId?: string) => {
  const configBaseId = baseId || process.env.NEXT_PUBLIC_SYSTEM_CONFIG_BASE_ID || ''
  return getAirtableBase(configBaseId)
}

export const getAdminBase = (baseId?: string) => {
  const adminBaseId = baseId || process.env.NEXT_PUBLIC_ADMIN_BASE_ID || ''
  return getAirtableBase(adminBaseId)
}

export const getGHGEmissionBase = (baseId?: string) => {
  const ghgBaseId = baseId || process.env.NEXT_PUBLIC_GHG_EMISSION_BASE_ID || ''
  return getAirtableBase(ghgBaseId)
}

// Helper function to fetch records from a table
export async function fetchAirtableRecords(
  baseId: string,
  tableName: string,
  options?: {
    view?: string
    filterByFormula?: string
    maxRecords?: number
  }
) {
  try {
    const base = getAirtableBase(baseId)
    const records = await base(tableName)
      .select({
        view: options?.view,
        filterByFormula: options?.filterByFormula,
        maxRecords: options?.maxRecords || 100,
      })
      .all()
    
    return records.map(record => ({
      id: record.id,
      fields: record.fields,
    }))
  } catch (error) {
    console.error('Error fetching Airtable records:', error)
    throw error
  }
}

// Helper function to create a record
export async function createAirtableRecord(
  baseId: string,
  tableName: string,
  fields: Record<string, any>
) {
  try {
    const base = getAirtableBase(baseId)
    const record = await base(tableName).create(fields)
    return {
      id: record.id,
      fields: record.fields,
    }
  } catch (error) {
    console.error('Error creating Airtable record:', error)
    throw error
  }
}

// Helper function to update a record
export async function updateAirtableRecord(
  baseId: string,
  tableName: string,
  recordId: string,
  fields: Record<string, any>
) {
  try {
    const base = getAirtableBase(baseId)
    const record = await base(tableName).update(recordId, fields)
    return {
      id: record.id,
      fields: record.fields,
    }
  } catch (error) {
    console.error('Error updating Airtable record:', error)
    throw error
  }
}

