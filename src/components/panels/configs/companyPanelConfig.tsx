import { PanelConfig } from '../types'
import { getTagColor } from '@/lib/mockData'

/**
 * Panel configuration for Company entities
 * This defines the structure and fields for the Company detail panel
 */
export const companyPanelConfig: PanelConfig = {
  titleKey: 'companyName',
  actions: {
    delete: {
      label: 'Delete company',
      onClick: () => {}, // Will be overridden by parent component
    },
  },
  sections: [
    {
      type: 'fields',
      title: 'Main Information',
      fields: [
        {
          key: 'isinCode',
          label: 'ISIN Code',
          type: 'text',
          placeholder: 'Enter ISIN code',
        },
        {
          key: 'companyName',
          label: 'Company Name',
          type: 'text',
          placeholder: 'Enter company name',
        },
        {
          key: 'status',
          label: 'Status',
          type: 'choiceList', // Use ChoiceList for consistent inline selection
          options: [
            { value: 'Active', label: 'Active' },
            { value: 'Closed', label: 'Closed' },
          ],
        },
        {
          key: 'notes',
          label: 'Notes',
          type: 'textarea',
          placeholder: 'Add notes...',
          rows: 4,
        },
      ],
    },
    {
      type: 'tags',
      title: 'Categories',
      tags: [
        {
          key: 'primaryIndustry',
          label: 'Primary Industry',
          getColor: getTagColor,
        },
        {
          key: 'primarySector',
          label: 'Primary Sector',
          getColor: getTagColor,
        },
        {
          key: 'primaryActivity',
          label: 'Primary Activity',
          getColor: getTagColor,
        },
      ],
    },
    {
      type: 'activity',
      title: 'Action Logs',
      activities: [
        {
          key: 'createdBy',
          label: 'Created By',
          timestampKey: 'created',
        },
        {
          key: 'lastModifiedBy',
          label: 'Last Modified By',
          timestampKey: 'lastModified',
        },
      ],
      showDivider: true,
    },
    {
      type: 'comments',
      showDivider: true,
    },
  ],
}

