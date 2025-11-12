'use client'

export default function IntegrationMarketplaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // SidebarProvider is now at the spaces/layout.tsx level
  // This layout ensures the integration marketplace page uses full screen without container constraints
  return (
    <div style={{ margin: 0, padding: 0, position: 'relative' }}>
        {children}
      </div>
    
  )
}

