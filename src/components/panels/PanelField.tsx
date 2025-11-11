'use client'

import { useState } from 'react'

interface PanelFieldProps {
  label: string
  value: string | number | undefined | any
  onChange?: (value: string) => void
  onBlur?: () => void
  type?: 'text' | 'textarea' | 'select' | 'readonly' | 'attachment' | 'url' | 'status'
  options?: { value: string; label: string }[]
  placeholder?: string
  rows?: number
  className?: string
  layout?: 'stacked' | 'two-column' // New prop for layout type
  readOnly?: boolean
}

export default function PanelField({
  label,
  value,
  onChange,
  onBlur,
  type = 'text',
  options,
  placeholder,
  rows = 8, // Increased default rows for textarea to allow more content
  className = '',
  layout = 'two-column', // Default to two-column layout
  readOnly = false,
}: PanelFieldProps) {
  const isReadOnly = type === 'readonly' || readOnly
  const baseInputClasses = `w-full px-4 md:px-6 py-2.5 md:py-3.5 border border-neutral-300 rounded-lg text-xs md:text-sm transition-all ${
    isReadOnly
      ? 'bg-neutral-50 text-neutral-500 cursor-not-allowed'
      : 'text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-neutral-400'
  } ${className}`

  // Render attachment field
  if (type === 'attachment') {
    const [uploadingFiles, setUploadingFiles] = useState<string[]>([])
    const attachments = Array.isArray(value) ? value : (value ? [value] : [])
    const validAttachments = attachments.filter((att: any) => att && (att.url || att.thumbnails || att.dataUrl || typeof att === 'string'))
    const hasAttachments = validAttachments.length > 0
    
    const handleRemoveAttachment = (indexToRemove: number) => {
      if (isReadOnly || !onChange) return
      
      const newAttachments = validAttachments.filter((_, idx) => idx !== indexToRemove)
      onChange(newAttachments.length === 0 ? [] : (newAttachments.length === 1 ? newAttachments[0] : newAttachments))
    }
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isReadOnly || !onChange) return
      
      const files = e.target.files
      if (!files || files.length === 0) return
      
      // Track uploading files
      const fileNames = Array.from(files).map(f => f.name)
      setUploadingFiles(fileNames)
      
      try {
        // Upload each file immediately
        const uploadPromises = Array.from(files).map(async (file) => {
          try {
            // Create FormData for file upload
            const formData = new FormData()
            formData.append('file', file)
            
            // Upload file to backend
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
            const response = await fetch(`${API_BASE_URL}/industry-classification/upload`, {
              method: 'POST',
              body: formData,
            })
            
            if (!response.ok) {
              const error = await response.json()
              throw new Error(error.error || `Upload failed: ${response.status}`)
            }
            
            const result = await response.json()
            return result.data // Should be an Airtable attachment object
          } catch (error) {
            console.error('Error uploading file:', error)
            // Return a temporary object for preview, but mark as failed
            return {
              name: file.name,
              filename: file.name,
              size: file.size,
              type: file.type,
              url: URL.createObjectURL(file),
              dataUrl: URL.createObjectURL(file),
              _isNewUpload: true,
              _uploadFailed: true,
              _error: error instanceof Error ? error.message : 'Upload failed',
            }
          }
        })
        
        // Wait for all uploads to complete
        const uploadedFiles = await Promise.all(uploadPromises)
        
        // Filter out failed uploads and combine with existing attachments
        const successfulUploads = uploadedFiles.filter((f: any) => !f._uploadFailed)
        const updatedAttachments = [...validAttachments, ...successfulUploads]
        
        // Update the field value
        onChange(updatedAttachments.length === 1 ? updatedAttachments[0] : updatedAttachments)
      } finally {
        // Clear uploading state
        setUploadingFiles([])
        // Reset input
        e.target.value = ''
      }
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-3 md:gap-4 items-start py-3 md:py-4 border-b border-neutral-100 last:border-b-0">
        <label className="text-xs font-semibold text-neutral-700 pt-0 md:pt-3">
          {label}
        </label>
        <div className="min-w-0 w-full">
          {hasAttachments ? (
            <div className="space-y-3">
              {validAttachments.map((attachment: any, idx: number) => {
                const url = attachment?.url || attachment?.thumbnails?.large?.url || attachment?.dataUrl || (typeof attachment === 'string' ? attachment : null)
                const filename = attachment?.filename || attachment?.name || `attachment-${idx + 1}`
                const isUploading = uploadingFiles.includes(filename)
                
                if (!url) return null
                
                return (
                  <div key={idx} className="flex items-start space-x-3 p-2 border border-neutral-200 rounded-lg bg-white">
                    <img 
                      src={url} 
                      alt={filename}
                      className="w-20 h-20 object-cover rounded border border-neutral-200 flex-shrink-0"
                      onError={(e) => {
                        // Fallback if image fails to load
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-neutral-700 truncate mb-1">
                        {filename}
                        {isUploading && <span className="ml-2 text-blue-600">(Uploading...)</span>}
                        {attachment?._uploadFailed && (
                          <span className="ml-2 text-red-600">(Failed: {attachment._error})</span>
                        )}
                      </p>
                      {attachment?.size && (
                        <p className="text-xs text-neutral-400">
                          {(attachment.size / 1024).toFixed(1)} KB
                        </p>
                      )}
                      {attachment?._isTemporary && (
                        <p className="text-xs text-yellow-600 mt-1">
                          ⚠️ File needs to be uploaded to storage service before saving
                        </p>
                      )}
                      {!isReadOnly && !isUploading && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(idx)}
                          className="mt-2 text-xs text-red-600 hover:text-red-700 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            !isReadOnly && (
              <p className="text-xs text-neutral-400 mb-2">No attachments</p>
            )
          )}
          {!isReadOnly && (
            <div className="mt-3">
              <label className="block">
                <span className="sr-only">Upload attachment</span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="block w-full text-xs text-neutral-600
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-xs file:font-semibold
                    file:bg-green-50 file:text-green-700
                    hover:file:bg-green-100
                    file:cursor-pointer
                    cursor-pointer"
                  accept="image/*,.pdf,.doc,.docx"
                />
              </label>
              <p className="text-xs text-neutral-400 mt-1">
                Upload images, PDFs, or documents
              </p>
            </div>
          )}
          {isReadOnly && !hasAttachments && (
            <p className="text-xs text-neutral-400">No attachments</p>
          )}
        </div>
      </div>
    )
  }

  // Render URL field
  if (type === 'url') {
    const urlValue = value || ''
    const isValidUrl = urlValue && (urlValue.startsWith('http://') || urlValue.startsWith('https://'))
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-3 md:gap-4 items-start py-3 md:py-4 border-b border-neutral-100 last:border-b-0">
        <label className="text-xs font-semibold text-neutral-700 pt-0 md:pt-3">
          {label}
        </label>
        <div className="min-w-0 w-full">
          {isValidUrl ? (
            <a 
              href={urlValue} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 underline break-all"
            >
              {urlValue}
            </a>
          ) : (
            <input
              type="text"
              value={urlValue}
              onChange={(e) => onChange?.(e.target.value)}
              onBlur={onBlur}
              placeholder={placeholder || 'https://...'}
              readOnly={isReadOnly}
              className={baseInputClasses}
            />
          )}
        </div>
      </div>
    )
  }

  // Render status field
  if (type === 'status') {
    const statusValue = value || ''
    const isActive = statusValue.toString().toLowerCase() === 'active'
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-3 md:gap-4 items-start py-3 md:py-4 border-b border-neutral-100 last:border-b-0">
        <label className="text-xs font-semibold text-neutral-700 pt-0 md:pt-3">
          {label}
        </label>
        <div className="min-w-0 w-full">
          {statusValue ? (
            <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
              isActive
                ? 'bg-green-500 text-white'
                : 'bg-neutral-200 text-neutral-700'
            }`}>
              {statusValue}
            </span>
          ) : (
            <input
              type="text"
              value={statusValue}
              onChange={(e) => onChange?.(e.target.value)}
              onBlur={onBlur}
              placeholder={placeholder}
              readOnly={isReadOnly}
              className={baseInputClasses}
            />
          )}
        </div>
      </div>
    )
  }

  // Two-column layout: label on left, input on right
  if (layout === 'two-column') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-3 md:gap-4 items-start py-3 md:py-4 border-b border-neutral-100 last:border-b-0">
        <label className="text-xs font-semibold text-neutral-700 pt-0 md:pt-3">
          {label}
        </label>
        <div className="min-w-0 w-full">
          {type === 'textarea' ? (
            <textarea
              value={value || ''}
              onChange={(e) => onChange?.(e.target.value)}
              onBlur={onBlur}
              rows={rows}
              placeholder={placeholder}
              readOnly={isReadOnly}
              className={`${baseInputClasses} resize-none`}
            />
          ) : type === 'select' ? (
            <select
              value={value || ''}
              onChange={(e) => {
                onChange?.(e.target.value)
                onBlur?.()
              }}
              disabled={isReadOnly}
              className={baseInputClasses}
            >
              <option value="">-- Select --</option>
              {options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              value={value || ''}
              onChange={(e) => onChange?.(e.target.value)}
              onBlur={onBlur}
              placeholder={placeholder}
              readOnly={isReadOnly}
              className={baseInputClasses}
            />
          )}
        </div>
      </div>
    )
  }

  // Stacked layout: label on top, input below (backward compatibility)
  return (
    <div className="py-4 border-b border-neutral-100 last:border-b-0">
      <label className="block text-xs font-semibold text-neutral-700 mb-3">
        {label}
      </label>
      {type === 'textarea' ? (
        <textarea
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          onBlur={onBlur}
          rows={rows}
          placeholder={placeholder}
          readOnly={isReadOnly}
          className={`${baseInputClasses} resize-none`}
        />
      ) : type === 'select' ? (
        <select
          value={value || ''}
          onChange={(e) => {
            onChange?.(e.target.value)
            onBlur?.()
          }}
          disabled={isReadOnly}
          className={baseInputClasses}
        >
          <option value="">-- Select --</option>
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          readOnly={isReadOnly}
          className={baseInputClasses}
        />
      )}
    </div>
  )
}

