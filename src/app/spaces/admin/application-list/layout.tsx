'use client'

import { SidebarProvider } from '@/components/SidebarContext'

export default function ApplicationListLayout({
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

