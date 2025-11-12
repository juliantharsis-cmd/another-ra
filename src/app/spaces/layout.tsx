'use client'

import { SidebarProvider } from '@/components/SidebarContext'

export default function SpacesLayout({
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

