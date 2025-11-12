'use client'

export default function GeographyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // SidebarProvider is now at the spaces/layout.tsx level
  return (
    <>
      {children}
    </>
  )
}

