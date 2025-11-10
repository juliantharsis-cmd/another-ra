'use client'

import { SidebarProvider } from '@/components/SidebarContext'
import { ReactNode } from 'react'

export default function ApplicationListLayout({
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

