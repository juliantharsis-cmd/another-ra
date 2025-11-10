'use client'

import { SidebarProvider } from '@/components/SidebarContext'
import { ReactNode } from 'react'

export default function EmissionFactorsLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <SidebarProvider>
      {children}
    </SidebarProvider>
  )
}

