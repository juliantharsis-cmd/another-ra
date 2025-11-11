'use client'

import { SidebarProvider } from '@/components/SidebarContext'

export default function IntegrationMarketplaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This layout ensures the integration marketplace page uses full screen without container constraints
  return (
    <SidebarProvider>
      <div style={{ margin: 0, padding: 0, position: 'relative' }}>
        {children}
      </div>
    </SidebarProvider>
  )
}

