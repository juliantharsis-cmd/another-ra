import { Router, Request, Response } from 'express'
import { DivisionsAirtableService } from '../services/DivisionsAirtableService'

const router = Router()
let serviceInstance: DivisionsAirtableService | null = null

function getService(): DivisionsAirtableService | null {
  if (!serviceInstance) {
    try {
      serviceInstance = new DivisionsAirtableService()
    } catch (error) {
      console.warn('DivisionsAirtableService not available:', error)
      return null
    }
  }
  return serviceInstance
}

// TODO: Add routes (GET, POST, PUT, DELETE)

export default router
