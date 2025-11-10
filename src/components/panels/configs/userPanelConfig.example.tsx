/**
 * Example: User Panel Configuration
 * 
 * This demonstrates how to create a panel configuration for a different entity type.
 * Copy this file and adapt it for your entity (Users, Projects, etc.)
 */

import { PanelConfig } from '../types'

// Example User entity type
interface User {
  id: string
  name: string
  email: string
  role: 'Admin' | 'User' | 'Viewer'
  department: string
  status: 'Active' | 'Inactive'
  createdBy: string
  created: string
  lastModifiedBy: string
  lastModified: string
}

export const userPanelConfig: PanelConfig = {
  titleKey: 'name', // Field to use as panel title
  actions: {
    delete: {
      label: 'Delete user',
      onClick: () => {}, // Will be overridden by parent
    },
    edit: {
      label: 'Edit user',
      onClick: () => {},
    },
  },
  sections: [
    {
      type: 'fields',
      title: 'User Information',
      fields: [
        {
          key: 'name',
          label: 'Full Name',
          type: 'text',
        },
        {
          key: 'email',
          label: 'Email Address',
          type: 'text',
        },
        {
          key: 'role',
          label: 'Role',
          type: 'select',
          options: [
            { value: 'Admin', label: 'Administrator' },
            { value: 'User', label: 'User' },
            { value: 'Viewer', label: 'Viewer' },
          ],
        },
        {
          key: 'department',
          label: 'Department',
          type: 'text',
        },
        {
          key: 'status',
          label: 'Status',
          type: 'select',
          options: [
            { value: 'Active', label: 'Active' },
            { value: 'Inactive', label: 'Inactive' },
          ],
        },
      ],
    },
    {
      type: 'tags',
      title: 'Tags',
      tags: [
        {
          key: 'department',
          label: 'Department',
          getColor: (value: string) => {
            // Custom color logic
            if (value.includes('IT')) return 'bg-blue-100 text-blue-700'
            if (value.includes('Sales')) return 'bg-purple-100 text-purple-700'
            return 'bg-neutral-100 text-neutral-700'
          },
        },
      ],
    },
    {
      type: 'activity',
      title: 'Activity Log',
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

