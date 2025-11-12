'use client'

export default function UnitLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // SidebarProvider is now at the spaces/layout.tsx level
  return (
    <div style={{ margin: 0, padding: 0, position: 'relative' }}>
        {children}
      </div>
    
  )
}

