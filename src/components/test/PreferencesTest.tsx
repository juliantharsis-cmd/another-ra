/**
 * Preferences Test Component
 * 
 * Test component for frontend preferences system
 * Use this to verify the React hooks work correctly
 */

'use client'

import { useState } from 'react'
import { usePreference, usePreferences } from '@/hooks/usePreferences'
import { preferencesApi } from '@/lib/api/preferences'

export default function PreferencesTest() {
  const [testResult, setTestResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  // Test hook for single preference
  const { value: columnWidths, update: updateColumnWidths, loading: loadingWidths } = usePreference<Record<string, number>>(
    'columnWidths',
    'table',
    'companies'
  )

  // Test hook for all preferences
  const { preferences, loading: loadingAll, refresh } = usePreferences('table', 'companies')

  const runTests = async () => {
    setLoading(true)
    setTestResult('Running tests...\n\n')

    try {
      // Test 1: Set preference via API
      setTestResult(prev => prev + '1️⃣ Setting preference via API...\n')
      await preferencesApi.set(
        'columnWidths',
        { name: 200, status: 100, notes: 150 },
        'json',
        { namespace: 'table', tableId: 'companies' }
      )
      setTestResult(prev => prev + '   ✅ Preference set\n\n')

      // Test 2: Get preference via API
      setTestResult(prev => prev + '2️⃣ Getting preference via API...\n')
      const retrieved = await preferencesApi.get('columnWidths', 'table', undefined, 'companies')
      if (retrieved) {
        setTestResult(prev => prev + `   ✅ Preference retrieved: ${JSON.stringify(retrieved.value)}\n\n`)
      } else {
        setTestResult(prev => prev + '   ❌ Preference not found\n\n')
      }

      // Test 3: Update preference via hook
      setTestResult(prev => prev + '3️⃣ Updating preference via hook...\n')
      await updateColumnWidths({ name: 250, status: 120, notes: 150 })
      setTestResult(prev => prev + '   ✅ Preference updated via hook\n\n')

      // Test 4: Get all preferences
      setTestResult(prev => prev + '4️⃣ Getting all preferences...\n')
      const allPrefs = await preferencesApi.getAll(undefined, { namespace: 'table', tableId: 'companies' })
      setTestResult(prev => prev + `   ✅ Retrieved ${allPrefs.length} preference(s)\n\n`)

      // Test 5: Set different types
      setTestResult(prev => prev + '5️⃣ Testing different value types...\n')
      await preferencesApi.set('theme', 'dark', 'string', { namespace: 'ui' })
      await preferencesApi.set('pageSize', 50, 'number', { namespace: 'ui' })
      await preferencesApi.set('notificationsEnabled', true, 'boolean', { namespace: 'ui' })
      setTestResult(prev => prev + '   ✅ All types set successfully\n\n')

      // Test 6: Refresh hook data
      setTestResult(prev => prev + '6️⃣ Refreshing preferences hook...\n')
      await refresh()
      setTestResult(prev => prev + `   ✅ Hook refreshed, ${preferences.length} preference(s) loaded\n\n`)

      setTestResult(prev => prev + '✅ All tests passed!\n')
    } catch (error) {
      setTestResult(prev => prev + `\n❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`)
      console.error('Test error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Preferences System Test</h1>

      <div className="mb-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Single Preference Hook</h2>
          <div className="bg-neutral-50 p-4 rounded">
            <p className="text-sm text-neutral-600 mb-2">Column Widths (table/companies):</p>
            {loadingWidths ? (
              <p className="text-sm">Loading...</p>
            ) : (
              <pre className="text-sm bg-white p-2 rounded border">
                {JSON.stringify(columnWidths, null, 2)}
              </pre>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">All Preferences Hook</h2>
          <div className="bg-neutral-50 p-4 rounded">
            <p className="text-sm text-neutral-600 mb-2">Table preferences (companies):</p>
            {loadingAll ? (
              <p className="text-sm">Loading...</p>
            ) : (
              <div>
                <p className="text-sm mb-2">Count: {preferences.length}</p>
                <pre className="text-sm bg-white p-2 rounded border max-h-40 overflow-auto">
                  {JSON.stringify(preferences, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={runTests}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Running Tests...' : 'Run Tests'}
        </button>
      </div>

      {testResult && (
        <div className="bg-neutral-900 text-green-400 p-4 rounded font-mono text-sm whitespace-pre-wrap max-h-96 overflow-auto">
          {testResult}
        </div>
      )}
    </div>
  )
}

