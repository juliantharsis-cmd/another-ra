'use client'

export default function CompaniesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This layout ensures the companies page uses full screen without container constraints
  // SidebarProvider is now at the spaces/layout.tsx level
  return (
    <div style={{ margin: 0, padding: 0, position: 'relative' }}>
      {children}
    </div>
  )
}
