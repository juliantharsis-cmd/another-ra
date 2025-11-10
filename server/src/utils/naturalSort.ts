/**
 * Natural sort utility for alphanumerical sorting
 * Handles cases like: A1, A2, A10 (instead of A1, A10, A2)
 */

/**
 * Natural sort comparator function
 * Uses Intl.Collator for proper alphanumerical sorting
 */
export function naturalSort(a: any, b: any, order: 'asc' | 'desc' = 'asc'): number {
  // Handle null/undefined values
  if (a === null || a === undefined) return 1
  if (b === null || b === undefined) return -1
  if (a === b) return 0

  // Convert to strings for comparison
  const aStr = String(a)
  const bStr = String(b)

  // Use Intl.Collator with numeric option for natural sorting
  // This handles: A1, A2, A10 correctly (not A1, A10, A2)
  const collator = new Intl.Collator('en', {
    numeric: true,        // Enable numeric sorting (1, 2, 10 instead of 1, 10, 2)
    sensitivity: 'base',   // Case-insensitive comparison
    ignorePunctuation: false,
  })

  const comparison = collator.compare(aStr, bStr)
  return order === 'asc' ? comparison : -comparison
}

/**
 * Sort an array of objects by a field using natural sort
 */
export function sortByField<T>(
  array: T[],
  field: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] {
  return [...array].sort((a, b) => {
    const aValue = a[field]
    const bValue = b[field]
    return naturalSort(aValue, bValue, order)
  })
}

