'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { XMarkIcon } from './icons'
import { developerApi, type AirtableBase, type AirtableTable, type CreateTableRequest } from '@/lib/api/developer'

interface TableCreationDialogProps {
  isOpen: boolean
  onClose: () => void
  targetSection?: string | null
}

type Step = 'source' | 'base' | 'table' | 'confirm' | 'progress'

export default function TableCreationDialog({ isOpen, onClose, targetSection }: TableCreationDialogProps) {
  const [currentStep, setCurrentStep] = useState<Step>('source')
  const [selectedSource, setSelectedSource] = useState<'airtable' | null>(null)
  const [bases, setBases] = useState<AirtableBase[]>([])
  const [selectedBase, setSelectedBase] = useState<AirtableBase | null>(null)
  const [tables, setTables] = useState<AirtableTable[]>([])
  const [selectedTable, setSelectedTable] = useState<AirtableTable | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobProgress, setJobProgress] = useState<{ progress: number; currentStep?: string } | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setMounted(true)
    return () => {
      setMounted(false)
      // Cleanup polling on unmount
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('source')
      setSelectedSource(null)
      setSelectedBase(null)
      setSelectedTable(null)
      setError(null)
      setJobId(null)
      setJobProgress(null)
      setLoading(false)
      // Clear polling when dialog closes
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [isOpen])

  // Load bases when source is selected
  useEffect(() => {
    if (selectedSource === 'airtable' && currentStep === 'base' && bases.length === 0) {
      loadBases()
    }
  }, [selectedSource, currentStep])

  // Load tables when base is selected
  useEffect(() => {
    if (selectedBase && currentStep === 'table' && tables.length === 0) {
      loadTables(selectedBase.id)
    }
  }, [selectedBase, currentStep])

  const loadBases = async () => {
    setLoading(true)
    setError(null)
    try {
      const basesList = await developerApi.listBases()
      setBases(basesList)
    } catch (err: any) {
      setError(err.message || 'Failed to load Airtable bases')
    } finally {
      setLoading(false)
    }
  }

  const loadTables = async (baseId: string) => {
    setLoading(true)
    setError(null)
    try {
      const tablesList = await developerApi.listTables(baseId)
      setTables(tablesList)
    } catch (err: any) {
      setError(err.message || 'Failed to load tables')
    } finally {
      setLoading(false)
    }
  }

  const handleSourceSelect = (source: 'airtable') => {
    setSelectedSource(source)
    setCurrentStep('base')
  }

  const handleBaseSelect = (base: AirtableBase) => {
    setSelectedBase(base)
    setCurrentStep('table')
  }

  const handleTableSelect = (table: AirtableTable) => {
    setSelectedTable(table)
    setCurrentStep('confirm')
  }

  const handleCreate = async () => {
    if (!selectedBase || !selectedTable) return

    setLoading(true)
    setError(null)
    setCurrentStep('progress')

    try {
      const request: CreateTableRequest = {
        source: 'airtable',
        baseId: selectedBase.id,
        tableId: selectedTable.id,
        tableName: selectedTable.name, // Include table name from frontend
        targetSection: targetSection || undefined,
      }

      const job = await developerApi.createTable(request)
      setJobId(job.id)
      setJobProgress({ progress: job.progress, currentStep: job.currentStep })
      
      // Start polling for job status
      startJobPolling(job.id)
    } catch (err: any) {
      setError(err.message || 'Failed to create table')
      setLoading(false)
      setCurrentStep('confirm')
    }
  }

  const startJobPolling = (id: string) => {
    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    let pollCount = 0
    const MAX_POLLS = 300 // Maximum 5 minutes (300 seconds)
    const startTime = Date.now()
    const MAX_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds

    pollingIntervalRef.current = setInterval(async () => {
      try {
        pollCount++
        const elapsed = Date.now() - startTime

        // Safety check: stop polling if we've exceeded max duration or polls
        if (pollCount > MAX_POLLS || elapsed > MAX_DURATION) {
          console.warn(`Polling timeout after ${pollCount} polls (${Math.round(elapsed / 1000)}s)`)
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
          setLoading(false)
          setError('Table creation timed out. Please check the server logs for details.')
          setCurrentStep('confirm')
          return
        }

        const job = await developerApi.getJobStatus(id)
        setJobProgress({ progress: job.progress, currentStep: job.currentStep })

        if (job.status === 'completed') {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
          setLoading(false)
          // Show success message with details
          const tableName = job.result?.tableName || selectedTable?.name || 'the table'
          const tablePath = job.result?.tablePath || 'N/A'
          // Show success and close after a moment
          setTimeout(() => {
            alert(`✅ Table created successfully!\n\nTable: ${tableName}\nPath: ${tablePath}\n\nPlease restart your server to use the new table.`)
            onClose()
            // TODO: Show success notification
            // TODO: Refresh navigation to show new table
          }, 1000)
        } else if (job.status === 'failed') {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
          setLoading(false)
          setError(job.error || 'Table creation failed')
          setCurrentStep('confirm')
        }
        // If status is 'pending' or 'in-progress', continue polling
      } catch (err: any) {
        console.error('Error polling job status:', err)
        pollCount++
        
        // If job not found (404), it might have been completed and cleaned up
        // or server was restarted - verify if files were actually created
        if (err.message && err.message.includes('Job not found')) {
          console.warn('Job not found - may have been completed or server restarted')
          // Give it a few more tries in case it's a temporary issue
          if (pollCount > 3) {
            // After 3 attempts, verify if files were created by checking the API
            if (selectedTable && selectedBase) {
              try {
                // Verify files were actually created
                const verification = await developerApi.verifyTableFiles(selectedTable.name)
                
                if (pollingIntervalRef.current) {
                  clearInterval(pollingIntervalRef.current)
                  pollingIntervalRef.current = null
                }
                setLoading(false)
                
                if (verification.allCreated) {
                  // All files created - show success
                  setError(null)
                  setCurrentStep('confirm')
                  setTimeout(() => {
                    alert(`✅ Table created successfully!\n\nTable: ${selectedTable.name}\n\nAll files verified:\n- Backend service: ✅\n- Frontend API: ✅\n- Route handler: ✅\n- Template config: ✅\n\nPlease restart your server to use the new table.`)
                    onClose()
                  }, 100)
                } else {
                  // Some files missing
                  const missing = Object.entries(verification.filesCreated)
                    .filter(([_, exists]) => !exists)
                    .map(([name]) => name)
                    .join(', ')
                  setError(`Table creation may have partially completed. Missing files: ${missing || 'unknown'}. Please check server logs.`)
                  setCurrentStep('confirm')
                }
                return
              } catch (verifyError: any) {
                console.error('Error verifying files:', verifyError)
                // If verification fails, continue to show error message
              }
            }
            
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current)
              pollingIntervalRef.current = null
            }
            setLoading(false)
            setError('Job status unavailable. The table may have been created successfully, but the job record was lost (possibly due to server restart). Please check if the files were created and restart your server.')
            setCurrentStep('confirm')
            return
          }
        } else {
          // Stop polling after too many consecutive errors (for other errors)
          if (pollCount > 10) {
            console.error('Too many polling errors, stopping')
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current)
              pollingIntervalRef.current = null
            }
            setLoading(false)
            setError('Failed to check job status. Please check the server logs.')
            setCurrentStep('confirm')
            return
          }
        }
        // Continue polling on error (might be temporary) for first few errors
      }
    }, 1000) // Poll every second
  }

  if (!isOpen || !mounted) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900 bg-opacity-30 z-50"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">
                Create Table from Airtable
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                {targetSection && `Target section: ${targetSection}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 transition-colors"
              aria-label="Close"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Step 1: Select Source */}
            {currentStep === 'source' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Select Data Source
                </h3>
                <button
                  onClick={() => handleSourceSelect('airtable')}
                  className="w-full p-6 border-2 border-neutral-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-neutral-900">Airtable</h4>
                      <p className="text-sm text-neutral-500 mt-1">
                        Import tables from your Airtable workspace
                      </p>
                    </div>
                    <span className="text-green-600">→</span>
                  </div>
                </button>
                {/* Placeholder for future sources */}
                <div className="w-full p-6 border-2 border-neutral-200 rounded-lg opacity-50 cursor-not-allowed">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-neutral-400">PostgreSQL</h4>
                      <p className="text-sm text-neutral-400 mt-1">
                        Coming soon
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Select Base/App */}
            {currentStep === 'base' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => setCurrentStep('source')}
                    className="text-sm text-neutral-500 hover:text-neutral-700"
                  >
                    ← Back
                  </button>
                  <span className="text-neutral-300">|</span>
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Select App (Space)
                  </h3>
                </div>
                {loading ? (
                  <div className="text-center py-8 text-neutral-500">
                    Loading apps...
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {bases.map((base) => (
                      <button
                        key={base.id}
                        onClick={() => handleBaseSelect(base)}
                        className="w-full p-4 border border-neutral-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left"
                      >
                        <div className="font-medium text-neutral-900">{base.name}</div>
                        <div className="text-xs text-neutral-500 mt-1">ID: {base.id}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Select Table */}
            {currentStep === 'table' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => setCurrentStep('base')}
                    className="text-sm text-neutral-500 hover:text-neutral-700"
                  >
                    ← Back
                  </button>
                  <span className="text-neutral-300">|</span>
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Select Table
                  </h3>
                  {selectedBase && (
                    <span className="text-sm text-neutral-500">
                      from {selectedBase.name}
                    </span>
                  )}
                </div>
                {loading ? (
                  <div className="text-center py-8 text-neutral-500">
                    Loading tables...
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {tables.map((table) => (
                      <button
                        key={table.id}
                        onClick={() => handleTableSelect(table)}
                        className="w-full p-4 border border-neutral-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left"
                      >
                        <div className="font-medium text-neutral-900">{table.name}</div>
                        <div className="text-xs text-neutral-500 mt-1">ID: {table.id}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Confirm */}
            {currentStep === 'confirm' && selectedBase && selectedTable && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => setCurrentStep('table')}
                    className="text-sm text-neutral-500 hover:text-neutral-700"
                  >
                    ← Back
                  </button>
                  <span className="text-neutral-300">|</span>
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Confirm Table Creation
                  </h3>
                </div>
                <div className="p-4 bg-neutral-50 rounded-lg space-y-3">
                  <div>
                    <span className="text-sm font-medium text-neutral-700">Source:</span>
                    <span className="ml-2 text-sm text-neutral-900">Airtable</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-neutral-700">App:</span>
                    <span className="ml-2 text-sm text-neutral-900">{selectedBase.name}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-neutral-700">Table:</span>
                    <span className="ml-2 text-sm text-neutral-900">{selectedTable.name}</span>
                  </div>
                  {targetSection && (
                    <div>
                      <span className="text-sm font-medium text-neutral-700">Target Section:</span>
                      <span className="ml-2 text-sm text-neutral-900">{targetSection}</span>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    This will create a new table in Another RA based on the selected Airtable table. 
                    The process may take a few moments.
                  </p>
                </div>
              </div>
            )}

            {/* Step 5: Progress */}
            {currentStep === 'progress' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Creating Table...
                </h3>
                {jobProgress && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-neutral-700">
                          {jobProgress.currentStep || 'Processing...'}
                        </span>
                        <span className="text-sm text-neutral-500">
                          {jobProgress.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${jobProgress.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    {jobProgress.progress === 100 && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                          ✅ Table created successfully! Closing dialog...
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {!jobProgress && (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    <p className="mt-4 text-neutral-500">
                      Starting table creation...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-neutral-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            {currentStep === 'confirm' && (
              <button
                onClick={handleCreate}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Table
              </button>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

