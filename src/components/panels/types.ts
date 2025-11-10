/**
 * Generic panel configuration types
 * These can be used to configure panels for any entity type
 */

export interface PanelFieldConfig {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'choiceList' | 'readonly'
  options?: { value: string; label: string }[]
  placeholder?: string
  rows?: number
  searchable?: boolean // For choiceList type
  maxHeight?: string // For choiceList type
}

export interface PanelTagConfig {
  key: string
  label: string
  getColor?: (value: string) => string
}

export interface PanelActivityConfig {
  key: string
  label: string
  timestampKey?: string
}

export interface PanelSectionConfig {
  type: 'fields' | 'tags' | 'activity' | 'comments' | 'custom'
  title?: string
  fields?: PanelFieldConfig[]
  tags?: PanelTagConfig[]
  activities?: PanelActivityConfig[]
  showDivider?: boolean
}

export interface PanelConfig {
  titleKey: string
  sections: PanelSectionConfig[]
  actions?: {
    delete?: {
      label: string
      onClick: (id: string) => void
    }
    edit?: {
      label: string
      onClick: (id: string) => void
    }
    [key: string]: {
      label: string
      onClick: (id: string) => void
    } | undefined
  }
}

/**
 * Helper function to render a panel based on configuration
 */
export function getPanelTitle(data: any, config: PanelConfig): string {
  return data[config.titleKey] || 'Untitled'
}

export function getPanelFields(data: any, section: PanelSectionConfig): PanelFieldConfig[] {
  if (section.type !== 'fields' || !section.fields) return []
  return section.fields.map(field => ({
    ...field,
    value: data[field.key],
  }))
}

export function getPanelTags(data: any, section: PanelSectionConfig, getTagColor?: (value: string) => string): Array<{ label: string; value: string; color?: string }> {
  if (section.type !== 'tags' || !section.tags) return []
  return section.tags
    .filter(tag => data[tag.key])
    .map(tag => ({
      label: tag.label,
      value: data[tag.key],
      color: tag.getColor ? tag.getColor(data[tag.key]) : undefined,
    }))
}

export function getPanelActivities(data: any, section: PanelSectionConfig): Array<{ label: string; value: string; timestamp?: string }> {
  if (section.type !== 'activity' || !section.activities) return []
  return section.activities.map(activity => ({
    label: activity.label,
    value: data[activity.key] || 'N/A',
    timestamp: activity.timestampKey ? data[activity.timestampKey] : undefined,
  }))
}

