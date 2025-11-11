'use client'

import { SidebarProvider } from '@/components/SidebarContext'

export default function StandardEmissionFactorsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div style={{ margin: 0, padding: 0, position: 'relative' }}>
        {children}
      </div>
    </SidebarProvider>
  )
}

