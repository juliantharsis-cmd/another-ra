'use client'

interface Tag {
  label: string
  value: string
  color?: string
}

interface PanelTagsProps {
  title?: string
  tags: Tag[]
  getTagColor?: (value: string) => string
  className?: string
}

export default function PanelTags({ 
  title, 
  tags, 
  getTagColor,
  className = '' 
}: PanelTagsProps) {
  if (!tags || tags.length === 0) return null

  return (
    <div className={className}>
      {title && (
        <h3 className="text-sm font-semibold text-neutral-900 mb-4">{title}</h3>
      )}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => {
          const colorClass = tag.color || getTagColor?.(tag.value) || 'bg-neutral-100 text-neutral-700'
          return (
            <span
              key={index}
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

