import { Router, Request, Response } from 'express'
import { UserPreferenceAirtableService } from '../services/UserPreferenceAirtableService'

const router = Router()
let serviceInstance: UserPreferenceAirtableService | null = null

function getService(): UserPreferenceAirtableService | null {
  if (!serviceInstance) {
    try {
      serviceInstance = new UserPreferenceAirtableService()
    } catch (error) {
      console.warn('UserPreferenceAirtableService not available:', error)
      return null
    }
  }
  return serviceInstance
}

// TODO: Add routes (GET, POST, PUT, DELETE)

export default router
