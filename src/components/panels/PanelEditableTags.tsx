'use client'

import { useState } from 'react'

interface PanelEditableTagsProps {
  title?: string
  tags: Array<{ key: string; label: string; value: string }>
  getOptions: (key: string) => Array<{ value: string; label: string }>
  onChange: (key: string, value: string) => void
  getTagColor?: (value: string) => string
  className?: string
  layout?: 'stacked' | 'two-column'
}

export default function PanelEditableTags({
  title,
  tags,
  getOptions,
  onChange,
  getTagColor,
  className = '',
  layout = 'two-column',
}: PanelEditableTagsProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null)

  if (layout === 'two-column') {
    return (
      <div className={className}>
        {title && (
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">{title}</h3>
        )}
        <div className="space-y-0">
          {tags.map((tag) => {
            const isEditing = editingKey === tag.key
            const colorClass = getTagColor?.(tag.value) || 'bg-neutral-100 text-neutral-700'

            return (
              <div
                key={tag.key}
                className="grid grid-cols-[200px_1fr] gap-4 items-start py-3 border-b border-neutral-100 last:border-b-0"
              >
                <label className="text-sm font-semibold text-neutral-700 pt-2.5">
                  {tag.label}
                </label>
                <div className="min-w-0">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={tag.value || ''}
                        onChange={(e) => {
                          onChange(tag.key, e.target.value)
                          setEditingKey(null)
                        }}
                        onBlur={() => setEditingKey(null)}
                        autoFocus
                        className="flex-1 px-4 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-neutral-400"
                      >
                        <option value="">-- Select --</option>
                        {getOptions(tag.key).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => setEditingKey(null)}
                        className="px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {tag.value ? (
                        <span
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${colorClass}`}
                        >
                          {tag.value}
                        </span>
                      ) : (
                        <span className="text-sm text-neutral-400 italic">Not set</span>
                      )}
                      <button
                        onClick={() => setEditingKey(tag.key)}
                        className="px-3 py-1.5 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Stacked layout (backward compatibility)
  return (
    <div className={className}>
      {title && (
        <h3 className="text-sm font-semibold text-neutral-900 mb-4">{title}</h3>
      )}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const colorClass = getTagColor?.(tag.value) || 'bg-neutral-100 text-neutral-700'
          return (
            <span
              key={tag.key}
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}
            >
              {tag.label || tag.value}
            </span>
          )
        })}
      </div>
    </div>
  )
}

