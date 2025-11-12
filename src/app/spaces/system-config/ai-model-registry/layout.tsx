'use client'

export default function AIModelRegistryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // SidebarProvider is now at the spaces/layout.tsx level
  // This layout ensures the AI Model Registry page uses full screen without container constraints
  return (
    <div style={{ margin: 0, padding: 0, position: 'relative' }}>
      {children}
    </div>
  )
}

