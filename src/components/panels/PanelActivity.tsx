'use client'

interface ActivityItem {
  label: string
  value: string
  timestamp?: string
}

interface PanelActivityProps {
  title?: string
  activities: ActivityItem[]
  className?: string
}

export default function PanelActivity({ 
  title = 'Activity', 
  activities, 
  className = '' 
}: PanelActivityProps) {
  if (!activities || activities.length === 0) return null

  return (
    <div className={`border-t border-neutral-200 pt-6 ${className}`}>
      <h3 className="text-sm font-semibold text-neutral-900 mb-4">{title}</h3>
      <div className="space-y-3 text-sm">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start justify-between">
            <div>
              <span className="text-neutral-600">{activity.label}:</span>{' '}
              <span className="font-medium text-neutral-900">{activity.value}</span>
            </div>
            {activity.timestamp && (
              <span className="text-neutral-500 text-xs">{activity.timestamp}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

