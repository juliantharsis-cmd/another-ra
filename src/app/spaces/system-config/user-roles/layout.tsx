'use client'

import { SidebarProvider } from '@/components/SidebarContext'

export default function UserRolesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This layout ensures the user roles page uses full screen without container constraints
  return (
    <SidebarProvider>
      <div style={{ margin: 0, padding: 0, position: 'relative' }}>
        {children}
      </div>
    </SidebarProvider>
  )
}

