'use client'

import { useState, useEffect } from 'react'
import { Company, getTagColor } from '@/lib/mockData'
import { companiesApi, UpdateCompanyDto } from '@/lib/api/companies'
import {
  DetailPanel,
  PanelHeader,
  PanelSection,
  PanelField,
  PanelTags,
  PanelActivity,
  PanelComments,
  getPanelTitle,
  getPanelFields,
  getPanelTags,
  getPanelActivities,
} from './panels'
import PanelEditableTags from './panels/PanelEditableTags'
import ChoiceList from './panels/ChoiceList'
import { companyPanelConfig } from './panels/configs/companyPanelConfig'

interface CompanyDetailPanelProps {
  company: Company | null
  isOpen: boolean
  onClose: () => void
  onDelete: (id: string) => void
  onUpdate: (company: Company) => void
  // Filter options for editable tags and choice lists
  industryOptions?: string[]
  sectorOptions?: string[]
  activityOptions?: string[]
  statusOptions?: string[]
}

export default function CompanyDetailPanel({
  company,
  isOpen,
  onClose,
  onDelete,
  onUpdate,
  industryOptions = [],
  sectorOptions = [],
  activityOptions = [],
  statusOptions = [],
}: CompanyDetailPanelProps) {
  const [editedCompany, setEditedCompany] = useState<Company | null>(company)
  const [originalCompany, setOriginalCompany] = useState<Company | null>(company)
  const [comment, setComment] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Update local state when company prop changes
  useEffect(() => {
    if (company) {
      setEditedCompany(company)
      setOriginalCompany(company)
      setComment('')
      setHasChanges(false)
      setSaveError(null)
      setSaveSuccess(false)
    }
  }, [company?.id])

  // Check for changes
  useEffect(() => {
    if (editedCompany && originalCompany) {
      const changed = JSON.stringify(editedCompany) !== JSON.stringify(originalCompany)
      setHasChanges(changed)
    }
  }, [editedCompany, originalCompany])

  if (!company || !editedCompany) return null

  const handleFieldChange = (field: keyof Company, value: string) => {
    setEditedCompany({ ...editedCompany, [field]: value })
    setSaveError(null)
    setSaveSuccess(false)
  }

  const handleTagChange = (key: string, value: string) => {
    setEditedCompany({ ...editedCompany, [key]: value })
    setSaveError(null)
    setSaveSuccess(false)
  }

  const handleSave = async () => {
    if (!editedCompany || !hasChanges) return

    try {
      setIsSaving(true)
      setSaveError(null)
      setSaveSuccess(false)

      const updateDto: UpdateCompanyDto = {
        isinCode: editedCompany.isinCode,
        companyName: editedCompany.companyName,
        name: editedCompany.name,
        status: editedCompany.status,
        primarySector: editedCompany.primarySector,
        primaryActivity: editedCompany.primaryActivity,
        primaryIndustry: editedCompany.primaryIndustry,
        notes: editedCompany.notes,
      }

      const updated = await companiesApi.update(editedCompany.id, updateDto)
      
      // Update both edited and original to reflect saved state
      setEditedCompany(updated)
      setOriginalCompany(updated)
      setHasChanges(false)
      setSaveSuccess(true)
      
      // Notify parent component
      onUpdate(updated)

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update company'
      setSaveError(errorMessage)
      console.error('Error updating company:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (originalCompany) {
      setEditedCompany(originalCompany)
      setHasChanges(false)
      setSaveError(null)
      setSaveSuccess(false)
    }
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this company?')) {
      onDelete(company.id)
      onClose()
    }
  }

  const handleCommentSubmit = (commentText: string) => {
    // TODO: Implement comment submission
    console.log('Comment submitted:', commentText)
  }

  // Get panel title
  const panelTitle = getPanelTitle(editedCompany, companyPanelConfig)

  // Render header actions
  const headerActions = (
    <div className="flex items-center gap-2">
      {hasChanges && (
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="px-4 py-2 border border-neutral-300 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      )}
      <button
        onClick={handleSave}
        disabled={!hasChanges || isSaving}
        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isSaving ? (
          <>
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
          </>
        ) : (
          'Save Changes'
        )}
      </button>
      <button
        onClick={handleDelete}
        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm"
      >
        {companyPanelConfig.actions?.delete?.label || 'Delete'}
      </button>
    </div>
  )

  // Render sections based on configuration
  const renderSections = () => {
    return companyPanelConfig.sections.map((section, index) => {
      switch (section.type) {
        case 'fields':
          const fields = getPanelFields(editedCompany, section)
          return (
            <PanelSection key={index} title={section.title} showDivider={section.showDivider}>
              {fields.map((field) => {
                // Use ChoiceList for choiceList type fields
                if (field.type === 'choiceList') {
                  // Get dynamic options from Airtable if available, otherwise use config options
                  let options = field.options || []
                  if (field.key === 'status' && statusOptions.length > 0) {
                    options = statusOptions.map(opt => ({ value: opt, label: opt }))
                  }
                  
                  return (
                    <ChoiceList
                      key={field.key}
                      label={field.label}
                      value={editedCompany[field.key as keyof Company] as string || ''}
                      options={options}
                      onChange={(value) => handleFieldChange(field.key as keyof Company, value)}
                      layout="two-column"
                      maxHeight={field.maxHeight || '300px'}
                      searchable={field.searchable !== false && options.length > 10}
                    />
                  )
                }
                
                // Use PanelField for other field types
                return (
                  <PanelField
                    key={field.key}
                    label={field.label}
                    value={editedCompany[field.key as keyof Company] as string}
                    onChange={(value) => handleFieldChange(field.key as keyof Company, value)}
                    type={field.type}
                    options={field.options}
                    placeholder={field.placeholder}
                    rows={field.rows}
                    layout="two-column"
                  />
                )
              })}
            </PanelSection>
          )

        case 'tags':
          const tags = getPanelTags(editedCompany, section, getTagColor)
          // Convert tags to editable format
          const editableTags = section.tags?.map(tag => ({
            key: tag.key,
            label: tag.label,
            value: editedCompany[tag.key as keyof Company] as string || '',
          })) || []
          
          // Get options for each tag type
          const getTagOptions = (key: string) => {
            if (key === 'primaryIndustry') {
              return industryOptions.map(opt => ({ value: opt, label: opt }))
            } else if (key === 'primarySector') {
              return sectorOptions.map(opt => ({ value: opt, label: opt }))
            } else if (key === 'primaryActivity') {
              return activityOptions.map(opt => ({ value: opt, label: opt }))
            }
            return []
          }

          // Use ChoiceList for all tag fields (standardized inline selection)
          const sectorTag = editableTags.find(tag => tag.key === 'primarySector')
          const activityTag = editableTags.find(tag => tag.key === 'primaryActivity')
          const industryTag = editableTags.find(tag => tag.key === 'primaryIndustry')

          return (
            <PanelSection key={index} title={section.title} showDivider={section.showDivider}>
              {/* Primary Sector - Inline ChoiceList */}
              {sectorTag && (
                <ChoiceList
                  label={sectorTag.label}
                  value={sectorTag.value}
                  options={getTagOptions('primarySector')}
                  onChange={(value) => handleTagChange('primarySector', value)}
                  layout="two-column"
                  maxHeight="300px"
                  searchable={true}
                />
              )}

              {/* Primary Activity - Inline ChoiceList */}
              {activityTag && (
                <ChoiceList
                  label={activityTag.label}
                  value={activityTag.value}
                  options={getTagOptions('primaryActivity')}
                  onChange={(value) => handleTagChange('primaryActivity', value)}
                  layout="two-column"
                  maxHeight="300px"
                  searchable={true}
                />
              )}

              {/* Primary Industry - Inline ChoiceList (standardized) */}
              {industryTag && (
                <ChoiceList
                  label={industryTag.label}
                  value={industryTag.value}
                  options={getTagOptions('primaryIndustry')}
                  onChange={(value) => handleTagChange('primaryIndustry', value)}
                  layout="two-column"
                  maxHeight="300px"
                  searchable={true}
                />
              )}
            </PanelSection>
          )

        case 'activity':
          const activities = getPanelActivities(editedCompany, section)
          return (
            <PanelActivity
              key={index}
              title={section.title}
              activities={activities}
              className={section.showDivider ? '' : ''}
            />
          )

        case 'comments':
          return (
            <PanelComments
              key={index}
              title={section.title}
              onSubmit={handleCommentSubmit}
              className={section.showDivider ? '' : ''}
            />
          )

        default:
          return null
      }
    })
  }

  return (
    <DetailPanel 
      isOpen={isOpen} 
      onClose={onClose}
      header={<PanelHeader title={panelTitle} actions={headerActions} onClose={onClose} />}
    >
      {/* Save status messages */}
      {saveError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{saveError}</p>
        </div>
      )}
      {saveSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">✓ Changes saved successfully</p>
        </div>
      )}
      
      {renderSections()}
    </DetailPanel>
  )
}
