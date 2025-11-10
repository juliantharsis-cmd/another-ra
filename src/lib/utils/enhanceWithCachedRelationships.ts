/**
 * Enhance data with cached relationship names
 * 
 * Fills in missing CompanyName, User Roles Name, etc. from frontend cache
 * to improve perceived performance and handle cases where backend resolution fails.
 */

import { RelationshipCache } from '../cache/relationshipCache'

/**
 * Enhance user records with cached relationship names
 * Generic function that works with any table type
 */
export function enhanceWithCachedRelationships<T extends { id: string; Company?: string | string[]; CompanyName?: string | string[] }>(users: T[]): T[] {
  return users.map(user => {
    const enhanced = { ...user }

    // Enhance Company names from cache
    if (user.Company && !user.CompanyName) {
      if (Array.isArray(user.Company)) {
        const cachedNames = user.Company
          .map(id => {
            if (typeof id === 'string' && id.startsWith('rec')) {
              return RelationshipCache.get('Companies', id)
            }
            return null
          })
          .filter((name): name is string => name !== null)
        
        if (cachedNames.length > 0) {
          enhanced.CompanyName = cachedNames.length === 1 ? cachedNames[0] : cachedNames
        }
      } else if (typeof user.Company === 'string' && user.Company.startsWith('rec')) {
        const cachedName = RelationshipCache.get('Companies', user.Company)
        if (cachedName) {
          enhanced.CompanyName = cachedName
        }
      }
    }

    // Cache CompanyName if we have it (for future use)
    if (user.CompanyName && user.Company) {
      if (Array.isArray(user.Company)) {
        const names = Array.isArray(user.CompanyName) ? user.CompanyName : [user.CompanyName]
        user.Company.forEach((id, index) => {
          if (typeof id === 'string' && id.startsWith('rec') && names[index]) {
            RelationshipCache.set('Companies', id, names[index])
          }
        })
      } else if (typeof user.Company === 'string' && user.Company.startsWith('rec')) {
        const name = Array.isArray(user.CompanyName) ? user.CompanyName[0] : user.CompanyName
        if (name) {
          RelationshipCache.set('Companies', user.Company, name)
        }
      }
    }

    // Similar enhancement for other relationships (User Roles, Organization Scope, Modules)
    // Add as needed...

    return enhanced
  })
}

