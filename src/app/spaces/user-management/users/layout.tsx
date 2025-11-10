'use client'

import { SidebarProvider } from '@/components/SidebarContext'
import { ReactNode } from 'react'

export default function UsersLayout({
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

