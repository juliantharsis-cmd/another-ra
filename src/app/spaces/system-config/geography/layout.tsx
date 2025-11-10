'use client'

import { SidebarProvider } from '@/components/SidebarContext'

export default function GeographyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      {children}
    </SidebarProvider>
  )
}

