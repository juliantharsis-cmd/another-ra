/**
 * User Table Configuration Example
 * 
 * This is an example configuration showing how to set up
 * the ListDetailTemplate for a Users table.
 * 
 * To use this:
 * 1. Create a User API client similar to companiesApi
 * 2. Uncomment and adapt this configuration
 * 3. Use it in your Users page component
 */

import { ListDetailTemplateConfig } from '../types'

// Example User type
interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'Admin' | 'User' | 'Viewer'
  department?: string
  status: 'Active' | 'Inactive'
  createdAt: string
  lastLogin?: string
}

// Example API client (you would implement this)
const userApiClient = {
  getPaginated: async (params: any) => {
    // TODO: Implement API call
    return { data: [], pagination: { total: 0, page: 1, limit: 25, hasMore: false } }
  },
  getById: async (id: string) => {
    // TODO: Implement API call
    throw new Error('Not implemented')
  },
  create: async (data: Partial<User>) => {
    // TODO: Implement API call
    throw new Error('Not implemented')
  },
  update: async (id: string, data: Partial<User>) => {
    // TODO: Implement API call
    throw new Error('Not implemented')
  },
  delete: async (id: string) => {
    // TODO: Implement API call
  },
}

export const userConfig: ListDetailTemplateConfig<User> = {
  entityName: 'User',
  entityNamePlural: 'Users',
  defaultSort: {
    field: 'lastName',
    order: 'asc',
  },
  defaultPageSize: 25,
  pageSizeOptions: [10, 25, 50, 100],
  showImportExport: true,

  columns: [
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      align: 'left',
    },
    {
      key: 'firstName',
      label: 'First Name',
      sortable: true,
      align: 'left',
    },
    {
      key: 'lastName',
      label: 'Last Name',
      sortable: true,
      align: 'left',
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      filterable: true,
      align: 'center',
      render: (value: string) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          value === 'Admin' 
            ? 'bg-purple-100 text-purple-800' 
            : value === 'User'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-neutral-100 text-neutral-800'
        }`}>
          {value}
        </span>
      ),
    },
    {
      key: 'department',
      label: 'Department',
      sortable: true,
      filterable: true,
      align: 'center',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true,
      align: 'center',
      render: (value: string) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          value === 'Active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-neutral-100 text-neutral-800'
        }`}>
          {value}
        </span>
      ),
    },
  ],

  filters: [
    {
      key: 'role',
      label: 'Role',
      type: 'select',
      options: ['Admin', 'User', 'Viewer'],
      placeholder: 'All Roles',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: ['Active', 'Inactive'],
      placeholder: 'All Statuses',
    },
    {
      key: 'department',
      label: 'Department',
      type: 'select',
      options: async () => {
        // TODO: Fetch from API
        return []
      },
      placeholder: 'All Departments',
    },
  ],

  fields: [
    {
      key: 'email',
      label: 'Email',
      type: 'text',
      editable: true,
      required: true,
      section: 'general',
    },
    {
      key: 'firstName',
      label: 'First Name',
      type: 'text',
      editable: true,
      required: true,
      section: 'general',
    },
    {
      key: 'lastName',
      label: 'Last Name',
      type: 'text',
      editable: true,
      required: true,
      section: 'general',
    },
    {
      key: 'role',
      label: 'Role',
      type: 'choiceList',
      editable: true,
      options: ['Admin', 'User', 'Viewer'],
      section: 'general',
    },
    {
      key: 'department',
      label: 'Department',
      type: 'text',
      editable: true,
      section: 'general',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'choiceList',
      editable: true,
      options: ['Active', 'Inactive'],
      section: 'general',
    },
    {
      key: 'createdAt',
      label: 'Created At',
      type: 'readonly',
      section: 'metadata',
    },
    {
      key: 'lastLogin',
      label: 'Last Login',
      type: 'readonly',
      section: 'metadata',
    },
  ],

  panel: {
    titleKey: 'email',
    sections: [
      {
        id: 'general',
        title: 'General Information',
        fields: ['email', 'firstName', 'lastName', 'role', 'department', 'status'],
      },
      {
        id: 'metadata',
        title: 'Metadata',
        fields: ['createdAt', 'lastLogin'],
      },
    ],
    actions: {
      delete: {
        label: 'Delete User',
        confirmMessage: 'Are you sure you want to delete this user?',
      },
    },
  },

  apiClient: userApiClient,
}








