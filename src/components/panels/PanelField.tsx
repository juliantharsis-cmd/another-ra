'use client'

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
    const attachments = Array.isArray(value) ? value : (value ? [value] : [])
    const hasAttachments = attachments.length > 0 && attachments.some((att: any) => att && (att.url || att.thumbnails || typeof att === 'string'))
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-3 md:gap-4 items-start py-3 md:py-4 border-b border-neutral-100 last:border-b-0">
        <label className="text-xs font-semibold text-neutral-700 pt-0 md:pt-3">
          {label}
        </label>
        <div className="min-w-0 w-full">
          {hasAttachments ? (
            <div className="space-y-2">
              {attachments.map((attachment: any, idx: number) => {
                const url = attachment?.url || attachment?.thumbnails?.large?.url || (typeof attachment === 'string' ? attachment : null)
                const filename = attachment?.filename || attachment?.name || `image-${idx + 1}.png`
                
                if (!url) return null
                
                return (
                  <div key={idx} className="flex items-start space-x-3">
                    <img 
                      src={url} 
                      alt={filename}
                      className="w-20 h-20 object-cover rounded border border-neutral-200"
                      onError={(e) => {
                        // Fallback if image fails to load
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-neutral-700 truncate">{filename}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
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

