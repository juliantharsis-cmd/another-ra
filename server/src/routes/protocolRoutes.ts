import { Router, Request, Response } from 'express'
import { ProtocolAirtableService } from '../services/ProtocolAirtableService'

const router = Router()
let serviceInstance: ProtocolAirtableService | null = null

function getService(): ProtocolAirtableService | null {
  if (!serviceInstance) {
    try {
      serviceInstance = new ProtocolAirtableService()
    } catch (error) {
      console.warn('ProtocolAirtableService not available:', error)
      return null
    }
  }
  return serviceInstance
}

// TODO: Add routes (GET, POST, PUT, DELETE)

export default router
