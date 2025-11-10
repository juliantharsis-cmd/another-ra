'use client'

import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { Company, CreateCompanyDto } from '@/lib/mockData'
import Notification from './Notification'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (companies: CreateCompanyDto[]) => Promise<{ success: number; failed: number; errors: string[] }>
}

interface ImportRow {
  rowNumber: number
  data: any
  errors: string[]
  isValid: boolean
}

const REQUIRED_COLUMNS = ['Company Name', 'ISIN Code']
const OPTIONAL_COLUMNS = ['Status', 'Primary Industry', 'Primary Sector', 'Primary Activity', 'Notes']

export default function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ImportRow[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {
      alert('Please select a CSV file')
      return
    }

    setFile(selectedFile)
    parseCSV(selectedFile)
  }

  const parseCSV = (file: File) => {
    setIsValidating(true)
    
    // First, read the file to detect delimiter
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        // Remove BOM if present
        const cleanText = text.replace(/^\uFEFF/, '')
        
        // Detect delimiter by checking first line
        const firstLine = cleanText.split('\n')[0] || cleanText.split('\r\n')[0] || ''
        let delimiter = ','
        if (firstLine.includes(';')) {
          delimiter = ';'
        } else if (firstLine.includes('\t')) {
          delimiter = '\t'
        }
        
        console.log('Detected delimiter:', delimiter)
        console.log('First line:', firstLine)
        
        // Parse with detected delimiter
        Papa.parse(cleanText, {
          header: true,
          skipEmptyLines: true,
          delimiter: delimiter,
          transformHeader: (header) => {
            // Normalize header names (trim whitespace, handle case)
            return header.trim()
          },
          complete: (results) => {
            console.log('Parsed results:', results)
            console.log('Headers found:', results.meta.fields)
            console.log('Data rows:', results.data.length)
            if (results.errors.length > 0) {
              console.warn('Parsing warnings:', results.errors)
            }
            validateData(results.data as any[])
          },
          error: (error) => {
            console.error('CSV parsing error:', error)
            setNotification({
              message: `Error parsing CSV: ${error.message}`,
              type: 'error',
            })
            setIsValidating(false)
          },
        })
      } catch (error) {
        console.error('Error processing file:', error)
        setNotification({
          message: `Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: 'error',
        })
        setIsValidating(false)
      }
    }
    
    reader.onerror = () => {
      setNotification({
        message: 'Error reading file. Please try again.',
        type: 'error',
      })
      setIsValidating(false)
    }
    
    reader.readAsText(file, 'UTF-8')
  }

  const validateData = (data: any[]) => {
    if (!data || data.length === 0) {
      setNotification({
        message: 'No data found in CSV file. Please check the file format.',
        type: 'error',
      })
      setIsValidating(false)
      return
    }

    console.log('Validating data, sample row:', data[0])
    console.log('Available keys in first row:', Object.keys(data[0] || {}))

    const validatedRows: ImportRow[] = data.map((row, index) => {
      const errors: string[] = []
      const rowNumber = index + 2 // +2 because CSV has header and is 1-indexed

      // Helper to get value with multiple possible key variations
      const getValue = (possibleKeys: string[]): string => {
        for (const key of possibleKeys) {
          const value = row[key]
          if (value !== undefined && value !== null && value !== '') {
            return String(value).trim()
          }
        }
        return ''
      }

      // Get values with flexible key matching
      const companyName = getValue(['Company Name', 'company name', 'CompanyName', 'companyName', 'Name', 'name'])
      const isinCode = getValue(['ISIN Code', 'isin code', 'ISINCode', 'isinCode', 'ISIN', 'isin'])
      const status = getValue(['Status', 'status'])
      const primaryIndustry = getValue(['Primary Industry', 'primary industry', 'PrimaryIndustry', 'primaryIndustry'])
      const primarySector = getValue(['Primary Sector', 'primary sector', 'PrimarySector', 'primarySector'])
      const primaryActivity = getValue(['Primary Activity', 'primary activity', 'PrimaryActivity', 'primaryActivity'])
      const notes = getValue(['Notes', 'notes', 'Note', 'note'])

      // Check required columns
      if (!companyName || companyName === '') {
        errors.push('Missing required field: Company Name')
      }
      if (!isinCode || isinCode === '') {
        errors.push('Missing required field: ISIN Code')
      }

      // Validate ISIN Code format (basic validation)
      if (isinCode && isinCode.length < 2) {
        errors.push('ISIN Code appears to be invalid (too short)')
      }

      // Validate Status if provided
      if (status && !['Active', 'Closed', 'active', 'closed'].includes(status)) {
        errors.push(`Invalid Status: ${status}. Must be "Active" or "Closed"`)
      }

      return {
        rowNumber,
        data: {
          companyName: companyName || '',
          isinCode: isinCode || '',
          status: (status || 'Active') as 'Active' | 'Closed',
          primaryIndustry: primaryIndustry || '',
          primarySector: primarySector || '',
          primaryActivity: primaryActivity || '',
          notes: notes || '',
        },
        errors,
        isValid: errors.length === 0,
      }
    })

    setParsedData(validatedRows)
    setIsValidating(false)
    setStep('preview')
  }

  const handleImport = async () => {
    const validRows = parsedData.filter((row) => row.isValid)
    if (validRows.length === 0) {
      setNotification({
        message: 'No valid rows to import. Please fix validation errors first.',
        type: 'error',
      })
      return
    }

    setStep('importing')
    setImportProgress(0)
    setImportErrors([])

    try {
      const companiesToImport: CreateCompanyDto[] = validRows.map((row) => ({
        companyName: row.data.companyName,
        isinCode: row.data.isinCode,
        status: row.data.status,
        primaryIndustry: row.data.primaryIndustry || undefined,
        primarySector: row.data.primarySector || undefined,
        primaryActivity: row.data.primaryActivity || undefined,
        notes: row.data.notes || undefined,
      }))

      // Import all at once (API handles batching)
      setImportProgress(50)
      console.log('Importing companies:', companiesToImport)
      const result = await onImport(companiesToImport)
      console.log('Import result:', result)
      setImportProgress(100)
      
      // Handle import results
      if (result.success > 0) {
        setNotification({
          message: `Successfully imported ${result.success} ${result.success === 1 ? 'company' : 'companies'}.`,
          type: 'success',
        })
      }
      
      if (result.failed > 0) {
        setImportErrors(result.errors || [])
        setNotification({
          message: `${result.failed} ${result.failed === 1 ? 'company failed' : 'companies failed'} to import. See details below.`,
          type: 'error',
        })
        // Stay on importing step to show errors, then move to preview
        setTimeout(() => {
          setStep('preview')
        }, 2000)
      } else {
        // All succeeded - close after showing success
        setTimeout(() => {
          handleReset()
          onClose()
        }, 2000)
      }
    } catch (error) {
      console.error('Import error:', error)
      setNotification({
        message: `Error importing companies: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
      })
      setStep('preview')
    }
  }

  const handleReset = () => {
    setFile(null)
    setParsedData([])
    setStep('upload')
    setImportProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const validCount = parsedData.filter((row) => row.isValid).length
  const invalidCount = parsedData.length - validCount

  return (
    <>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900">Import Companies from CSV</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="text-sm text-neutral-600">
                <p className="mb-2">Upload a CSV file with the following columns:</p>
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <p className="font-semibold mb-2 text-neutral-900">Required columns:</p>
                  <ul className="list-disc list-inside space-y-1 text-neutral-700 mb-4">
                    {REQUIRED_COLUMNS.map((col) => (
                      <li key={col}>{col}</li>
                    ))}
                  </ul>
                  <p className="font-semibold mb-2 text-neutral-900">Optional columns:</p>
                  <ul className="list-disc list-inside space-y-1 text-neutral-700">
                    {OPTIONAL_COLUMNS.map((col) => (
                      <li key={col}>{col}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer flex flex-col items-center space-y-4"
                >
                  <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div>
                    <span className="text-green-600 font-medium">Click to upload</span>
                    <span className="text-neutral-600"> or drag and drop</span>
                  </div>
                  <p className="text-xs text-neutral-500">CSV file only</p>
                </label>
                {file && (
                  <p className="mt-4 text-sm text-neutral-700">
                    Selected: <span className="font-medium">{file.name}</span>
                  </p>
                )}
              </div>

              {isValidating && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  <p className="mt-2 text-sm text-neutral-600">Validating CSV file...</p>
                </div>
              )}
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">Preview Import</h3>
                  <p className="text-sm text-neutral-600 mt-1">
                    {validCount} valid row{validCount !== 1 ? 's' : ''} • {invalidCount} error{invalidCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="text-sm text-neutral-600 hover:text-green-600 transition-colors"
                >
                  Upload different file
                </button>
              </div>

              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-[400px]">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-neutral-700">Row</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-neutral-700">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-neutral-700">Company Name</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-neutral-700">ISIN Code</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-neutral-700">Errors</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {parsedData.map((row) => (
                        <tr
                          key={row.rowNumber}
                          className={row.isValid ? 'bg-white' : 'bg-red-50'}
                        >
                          <td className="px-4 py-2 text-neutral-600">{row.rowNumber}</td>
                          <td className="px-4 py-2">
                            {row.isValid ? (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                                Valid
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                                Error
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-neutral-900">{row.data.companyName}</td>
                          <td className="px-4 py-2 text-neutral-600 font-mono text-xs">{row.data.isinCode}</td>
                          <td className="px-4 py-2">
                            {row.errors.length > 0 ? (
                              <ul className="text-xs text-red-600 space-y-1">
                                {row.errors.map((error, idx) => (
                                  <li key={idx}>• {error}</li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-xs text-neutral-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
              <p className="text-lg font-medium text-neutral-900 mb-2">Importing companies...</p>
              <p className="text-sm text-neutral-600 mb-4">
                {Math.round(importProgress)}% complete
              </p>
              <div className="w-full bg-neutral-200 rounded-full h-2 max-w-md mx-auto">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                ></div>
              </div>
              
              {/* Show import errors if any */}
              {importErrors.length > 0 && (
                <div className="mt-6 text-left max-w-2xl mx-auto">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-red-900 mb-2">
                      Import Errors ({importErrors.length})
                    </h4>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {importErrors.slice(0, 10).map((error, idx) => (
                        <p key={idx} className="text-xs text-red-700">
                          • {error}
                        </p>
                      ))}
                      {importErrors.length > 10 && (
                        <p className="text-xs text-red-600 italic">
                          ... and {importErrors.length - 10} more errors
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-neutral-200">
          <button
            onClick={step === 'preview' ? handleReset : onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            {step === 'preview' ? 'Cancel' : 'Close'}
          </button>
          {step === 'preview' && validCount > 0 && (
            <button
              onClick={handleImport}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              Import {validCount} {validCount === 1 ? 'Company' : 'Companies'}
            </button>
          )}
        </div>
      </div>
    </div>
    </>
  )
}

