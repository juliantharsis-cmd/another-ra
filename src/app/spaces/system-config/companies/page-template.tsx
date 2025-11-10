'use client'

import Sidebar from '@/components/Sidebar'
import ListDetailTemplate from '@/components/templates/ListDetailTemplate'
import { companyConfig } from '@/components/templates/configs/companyConfig'

/**
 * Companies Page using ListDetailTemplate
 * 
 * This page demonstrates how to use the reusable template
 * for a list/detail view with minimal code.
 */
export default function CompaniesPageTemplate() {
  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar />
      <div className="flex-1 overflow-hidden">
        <ListDetailTemplate config={companyConfig} />
      </div>
    </div>
  )
}








