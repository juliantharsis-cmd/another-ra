'use client'

export default function ScopeCategorisationLayout({
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

