'use client'

import { useState, useEffect } from 'react'
import { TableSchema, TableField, FieldType, CreateTableFieldDto, UpdateTableSchemaDto } from '@/lib/api/tableConfiguration'
import { tableConfigurationApi } from '@/lib/api/tableConfiguration'

interface TableConfigurationPanelProps {
  tableId: string
  tableName: string
  currentFields: Array<{ key: string; label: string; type?: string }>
  onClose: () => void
  onSave: (schema: UpdateTableSchemaDto) => Promise<void>
}

const FIELD_TYPE_OPTIONS: { value: FieldType; label: string }[] = [
  { value: 'singleLineText', label: 'Single line text' },
  { value: 'longText', label: 'Long text' },
  { value: 'attachment', label: 'Attachment' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'multipleSelects', label: 'Multiple select' },
  { value: 'singleSelect', label: 'Single select' },
  { value: 'user', label: 'User' },
  { value: 'date', label: 'Date' },
  { value: 'phoneNumber', label: 'Phone number' },
  { value: 'email', label: 'Email' },
  { value: 'url', label: 'URL' },
  { value: 'number', label: 'Number' },
  { value: 'currency', label: 'Currency' },
  { value: 'percent', label: 'Percent' },
  { value: 'duration', label: 'Duration' },
  { value: 'rating', label: 'Rating' },
  { value: 'formula', label: 'Formula' },
  { value: 'multipleRecordLinks', label: 'Multiple record links' },
  { value: 'singleRecordLink', label: 'Single record link' },
  { value: 'createdTime', label: 'Created time' },
  { value: 'lastModifiedTime', label: 'Last modified time' },
  { value: 'createdBy', label: 'Created by' },
  { value: 'lastModifiedBy', label: 'Last modified by' },
]

export default function TableConfigurationPanel({
  tableId,
  tableName,
  currentFields,
  onClose,
  onSave,
}: TableConfigurationPanelProps) {
  const [schema, setSchema] = useState<TableSchema | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<{ synced: boolean; message?: string } | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [showExportImport, setShowExportImport] = useState(false)

  // Load configuration on mount
  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        setIsLoading(true)
        setError(null)
        // Use tableName for configuration API (it uses table name, not tableId)
        const loadedConfiguration = await tableConfigurationApi.getConfiguration(tableName)
        setSchema(loadedConfiguration)
      } catch (err) {
        // If configuration doesn't exist, create from current fields
        // The backend will create it from Airtable schema if available
        const defaultSchema: TableSchema = {
          tableId,
          tableName,
          fields: currentFields.map((field, index) => ({
            id: `field-${index}`,
            name: field.label || field.key,
            type: (field.type as FieldType) || 'singleLineText',
            order: index,
            required: false,
            unique: false,
            airtableFieldName: field.label || field.key, // Use current name as original
          })),
        }
        setSchema(defaultSchema)
      } finally {
        setIsLoading(false)
      }
    }

    loadConfiguration()
  }, [tableId, tableName, currentFields])

  // Validate field
  const validateField = (field: TableField, allFields: TableField[]): string | null => {
    if (!field.name || field.name.trim() === '') {
      return 'Field name is required'
    }

    // Check for duplicate names
    const duplicateCount = allFields.filter(f => f.name.trim().toLowerCase() === field.name.trim().toLowerCase()).length
    if (duplicateCount > 1) {
      return 'Field name must be unique'
    }

    // Validate format based on type
    if (field.type === 'currency' || field.type === 'number' || field.type === 'percent') {
      if (field.format?.precision !== undefined && (field.format.precision < 0 || field.format.precision > 10)) {
        return 'Precision must be between 0 and 10'
      }
    }

    if (field.type === 'singleSelect' || field.type === 'multipleSelects') {
      if (!field.format?.options || field.format.options.length === 0) {
        return 'Select fields must have at least one option'
      }
    }

    if (field.type === 'rating') {
      if (!field.format?.maxRating || field.format.maxRating < 1 || field.format.maxRating > 10) {
        return 'Rating max must be between 1 and 10'
      }
    }

    return null
  }

  // Validate all fields
  const validateAllFields = (): boolean => {
    if (!schema) return false

    const errors: Record<string, string> = {}
    schema.fields.forEach((field, index) => {
      const error = validateField(field, schema.fields)
      if (error) {
        errors[`field-${index}`] = error
      }
    })

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Update field
  const updateField = (index: number, updates: Partial<TableField>) => {
    if (!schema) return

    const updatedFields = [...schema.fields]
    updatedFields[index] = { ...updatedFields[index], ...updates }
    setSchema({ ...schema, fields: updatedFields })

    // Clear validation error for this field
    const errorKey = `field-${index}`
    if (validationErrors[errorKey]) {
      const newErrors = { ...validationErrors }
      delete newErrors[errorKey]
      setValidationErrors(newErrors)
    }
  }

  // Add new field
  const addField = () => {
    if (!schema) return

    const newField: TableField = {
      id: `field-${Date.now()}`,
      name: '',
      type: 'singleLineText',
      order: schema.fields.length,
      required: false,
      unique: false,
    }

    setSchema({
      ...schema,
      fields: [...schema.fields, newField],
    })
  }

  // Remove field
  const removeField = (index: number) => {
    if (!schema) return

    const updatedFields = schema.fields.filter((_, i) => i !== index)
    // Reorder fields
    updatedFields.forEach((field, i) => {
      field.order = i
    })

    setSchema({ ...schema, fields: updatedFields })
  }

  // Move field up
  const moveFieldUp = (index: number) => {
    if (!schema || index === 0) return

    const updatedFields = [...schema.fields]
    ;[updatedFields[index - 1], updatedFields[index]] = [updatedFields[index], updatedFields[index - 1]]
    updatedFields.forEach((field, i) => {
      field.order = i
    })

    setSchema({ ...schema, fields: updatedFields })
  }

  // Move field down
  const moveFieldDown = (index: number) => {
    if (!schema || index === schema.fields.length - 1) return

    const updatedFields = [...schema.fields]
    ;[updatedFields[index], updatedFields[index + 1]] = [updatedFields[index + 1], updatedFields[index]]
    updatedFields.forEach((field, i) => {
      field.order = i
    })

    setSchema({ ...schema, fields: updatedFields })
  }

  // Export schema to JSON
  const handleExport = () => {
    if (!schema) return

    const exportData = {
      tableId: schema.tableId,
      tableName: schema.tableName,
      fields: schema.fields.map(field => ({
        name: field.name,
        type: field.type,
        format: field.format,
        required: field.required,
        unique: field.unique,
        description: field.description,
        defaultValue: field.defaultValue,
        order: field.order,
      })),
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${tableId}-schema-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Import schema from JSON
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string)
        
        if (!importData.fields || !Array.isArray(importData.fields)) {
          setError('Invalid schema file format')
          return
        }

        const importedFields: TableField[] = importData.fields.map((field: any, index: number) => ({
          id: `field-${Date.now()}-${index}`,
          name: field.name || '',
          type: field.type || 'singleLineText',
          format: field.format,
          required: field.required ?? false,
          unique: field.unique ?? false,
          description: field.description,
          defaultValue: field.defaultValue,
          order: index,
        }))

        setSchema({
          tableId: schema?.tableId || tableId,
          tableName: importData.tableName || schema?.tableName || tableName,
          fields: importedFields,
        })
        setError(null)
        setShowExportImport(false)
      } catch (err) {
        setError('Failed to parse schema file. Please check the file format.')
      }
    }
    reader.readAsText(file)
    // Reset input
    event.target.value = ''
  }

  // Handle save
  const handleSave = async () => {
    if (!schema) return

    if (!validateAllFields()) {
      return
    }

    try {
      setIsSaving(true)
      setIsSyncing(true)
      setError(null)
      setSyncStatus(null)

      const updateDto: UpdateTableSchemaDto = {
        tableName: schema.tableName,
        fields: schema.fields.map(field => ({
          name: field.name,
          type: field.type,
          format: field.format,
          required: field.required,
          unique: field.unique,
          description: field.description,
          defaultValue: field.defaultValue,
          order: field.order,
          airtableFieldName: field.airtableFieldName || field.name, // Preserve original name
        })),
      }

      // Use configuration API directly
      await tableConfigurationApi.updateConfiguration(tableName, updateDto)
      
      // Also call onSave if provided (for backward compatibility)
      if (onSave) {
        await onSave(updateDto)
      }
      
      // Reload configuration to get updated data
      const updated = await tableConfigurationApi.getConfiguration(tableName)
      setSchema(updated)

      setSyncStatus({
        synced: true,
        message: 'Configuration saved successfully to Table Configuration table',
      })
      setTimeout(() => {
        setSyncStatus(null)
      }, 2000)
      
      // Close after a brief delay to show success message
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration')
      setSyncStatus({
        synced: false,
        message: 'Failed to save configuration. Please try again.',
      })
    } finally {
      setIsSaving(false)
      setIsSyncing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="text-sm text-neutral-600">Loading configuration...</div>
        </div>
      </div>
    )
  }

  if (!schema) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Configure Table</h2>
            <p className="text-sm text-neutral-600 mt-1">{tableName}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowExportImport(!showExportImport)}
              className="px-3 py-1.5 text-sm text-neutral-600 hover:text-green-600 border border-neutral-300 rounded-lg hover:border-green-500 transition-colors flex items-center space-x-1"
              aria-label="Export/Import"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span>Export/Import</span>
            </button>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Sync status message */}
        {syncStatus && (
          <div className={`mx-6 mt-4 p-3 border rounded-lg text-sm ${
            syncStatus.synced
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-yellow-50 border-yellow-200 text-yellow-700'
          }`}>
            <div className="flex items-center space-x-2">
              {syncStatus.synced ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              <span>{syncStatus.message}</span>
            </div>
          </div>
        )}

        {/* Export/Import Panel */}
        {showExportImport && (
          <div className="mx-6 mt-4 p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-neutral-900">Export/Import Schema</h3>
              <button
                onClick={() => setShowExportImport(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleExport}
                className="px-3 py-2 text-sm text-green-700 bg-green-50 border border-green-300 rounded-lg hover:bg-green-100 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export Schema</span>
              </button>
              <label className="px-3 py-2 text-sm text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors flex items-center space-x-2 cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Import Schema</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              Export your schema as JSON to backup or share. Import a JSON file to restore or apply a schema.
            </p>
          </div>
        )}

        {/* Configuration info */}
        <div className="mx-6 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>
              Configuration stored in <strong>"Table Configuration"</strong> table in Airtable
              {schema?.airtableTableName && (
                <span className="text-blue-600 ml-2">
                  (Source table: {schema.airtableTableName})
                </span>
              )}
            </span>
          </div>
          <p className="mt-2 text-xs text-blue-600">
            This configuration layer allows you to customize field names and types without modifying the original Airtable schema.
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {schema.fields.map((field, index) => (
              <div
                key={field.id}
                className="border border-neutral-200 rounded-lg p-4 bg-neutral-50 hover:bg-neutral-100 transition-colors"
              >
                <div className="flex items-start space-x-4">
                  {/* Drag handles */}
                  <div className="flex flex-col space-y-1 pt-2">
                    <button
                      onClick={() => moveFieldUp(index)}
                      disabled={index === 0}
                      className="text-neutral-400 hover:text-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Move up"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveFieldDown(index)}
                      disabled={index === schema.fields.length - 1}
                      className="text-neutral-400 hover:text-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Move down"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Field configuration */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Field Name */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Field Name (Custom)
                        {field.airtableFieldName && field.airtableFieldName !== field.name && (
                          <span className="ml-2 text-xs text-blue-600 font-normal">
                            Original: {field.airtableFieldName}
                          </span>
                        )}
                        {field.syncedWithAirtable && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Synced
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => updateField(index, { name: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg text-sm ${
                          validationErrors[`field-${index}`]
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                            : 'border-neutral-300 focus:border-green-500 focus:ring-green-500'
                        } focus:outline-none focus:ring-1`}
                        placeholder="Enter custom field name"
                      />
                      {field.airtableFieldName && (
                        <p className="mt-1 text-xs text-neutral-500">
                          Original Airtable field: <span className="font-medium">{field.airtableFieldName}</span>
                        </p>
                      )}
                      {validationErrors[`field-${index}`] && (
                        <p className="mt-1 text-xs text-red-600">{validationErrors[`field-${index}`]}</p>
                      )}
                    </div>

                    {/* Field Type */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Field Type</label>
                      <select
                        value={field.type}
                        onChange={(e) => updateField(index, { type: e.target.value as FieldType })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:border-green-500 focus:ring-green-500"
                      >
                        {FIELD_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Format options based on type */}
                    {(field.type === 'number' || field.type === 'currency' || field.type === 'percent') && (
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Precision</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={field.format?.precision ?? 2}
                          onChange={(e) =>
                            updateField(index, {
                              format: { ...field.format, precision: parseInt(e.target.value) || 0 },
                            })
                          }
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:border-green-500 focus:ring-green-500"
                        />
                      </div>
                    )}

                    {field.type === 'currency' && (
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Currency Symbol</label>
                        <input
                          type="text"
                          value={field.format?.symbol ?? '$'}
                          onChange={(e) =>
                            updateField(index, {
                              format: { ...field.format, symbol: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:border-green-500 focus:ring-green-500"
                          placeholder="$"
                        />
                      </div>
                    )}

                    {(field.type === 'singleSelect' || field.type === 'multipleSelects') && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Options (one per line)</label>
                        <textarea
                          value={field.format?.options?.join('\n') ?? ''}
                          onChange={(e) =>
                            updateField(index, {
                              format: {
                                ...field.format,
                                options: e.target.value.split('\n').filter((opt) => opt.trim() !== ''),
                              },
                            })
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:border-green-500 focus:ring-green-500"
                          placeholder="Option 1&#10;Option 2&#10;Option 3"
                        />
                      </div>
                    )}

                    {field.type === 'date' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">Date Format</label>
                          <select
                            value={field.format?.dateFormat ?? 'MM/DD/YYYY'}
                            onChange={(e) =>
                              updateField(index, {
                                format: { ...field.format, dateFormat: e.target.value as any },
                              })
                            }
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:border-green-500 focus:ring-green-500"
                          >
                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                            <option value="MMM DD, YYYY">MMM DD, YYYY</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">Time Format</label>
                          <select
                            value={field.format?.timeFormat ?? '12h'}
                            onChange={(e) =>
                              updateField(index, {
                                format: { ...field.format, timeFormat: e.target.value as any },
                              })
                            }
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:border-green-500 focus:ring-green-500"
                          >
                            <option value="12h">12-hour</option>
                            <option value="24h">24-hour</option>
                          </select>
                        </div>
                      </>
                    )}

                    {field.type === 'rating' && (
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Max Rating</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={field.format?.maxRating ?? 5}
                          onChange={(e) =>
                            updateField(index, {
                              format: { ...field.format, maxRating: parseInt(e.target.value) || 5 },
                            })
                          }
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:border-green-500 focus:ring-green-500"
                        />
                      </div>
                    )}

                    {/* Description */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                      <textarea
                        value={field.description || ''}
                        onChange={(e) => updateField(index, { description: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:border-green-500 focus:ring-green-500"
                        placeholder="Optional field description or help text"
                      />
                    </div>

                    {/* Default Value */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Default Value</label>
                      {field.type === 'checkbox' ? (
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={field.defaultValue === true}
                            onChange={(e) => updateField(index, { defaultValue: e.target.checked })}
                            className="w-4 h-4 text-green-600 border-neutral-300 rounded focus:ring-green-500"
                          />
                          <span className="text-sm text-neutral-600">Checked by default</span>
                        </label>
                      ) : field.type === 'number' || field.type === 'currency' || field.type === 'percent' || field.type === 'rating' ? (
                        <input
                          type="number"
                          value={field.defaultValue !== undefined ? String(field.defaultValue) : ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? undefined : (field.type === 'number' || field.type === 'currency' || field.type === 'percent' ? parseFloat(e.target.value) : parseInt(e.target.value))
                            updateField(index, { defaultValue: value })
                          }}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:border-green-500 focus:ring-green-500"
                          placeholder="Enter default value"
                        />
                      ) : (
                        <input
                          type="text"
                          value={field.defaultValue !== undefined ? String(field.defaultValue) : ''}
                          onChange={(e) => updateField(index, { defaultValue: e.target.value || undefined })}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:border-green-500 focus:ring-green-500"
                          placeholder="Enter default value"
                        />
                      )}
                      <p className="mt-1 text-xs text-neutral-500">
                        This value will be used when creating new records
                      </p>
                    </div>

                    {/* Required and Unique checkboxes */}
                    <div className="md:col-span-2 flex items-center space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={field.required ?? false}
                          onChange={(e) => updateField(index, { required: e.target.checked })}
                          className="w-4 h-4 text-green-600 border-neutral-300 rounded focus:ring-green-500"
                        />
                        <span className="text-sm text-neutral-700">Required</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={field.unique ?? false}
                          onChange={(e) => updateField(index, { unique: e.target.checked })}
                          className="w-4 h-4 text-green-600 border-neutral-300 rounded focus:ring-green-500"
                        />
                        <span className="text-sm text-neutral-700">Unique</span>
                      </label>
                    </div>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => removeField(index)}
                    className="text-red-500 hover:text-red-700 transition-colors pt-2"
                    aria-label="Remove field"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Field Button */}
          <button
            onClick={addField}
            className="mt-4 w-full px-4 py-2 border-2 border-dashed border-neutral-300 rounded-lg text-sm text-neutral-600 hover:border-green-500 hover:text-green-600 transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Field</span>
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 border border-neutral-300 rounded-lg text-sm text-neutral-700 bg-white hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isSyncing}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {(isSaving || isSyncing) && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            <span>{isSyncing ? 'Syncing...' : isSaving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

