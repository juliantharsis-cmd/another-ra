'use client'

import { SidebarProvider } from '@/components/SidebarContext'
import { ReactNode } from 'react'

export default function GHGTypeLayout({
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

