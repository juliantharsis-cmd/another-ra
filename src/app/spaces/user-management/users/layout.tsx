'use client'

import { ReactNode } from 'react'

export default function UsersLayout({
  children,
}: {
  children: ReactNode
}) {
  // SidebarProvider is now at the spaces/layout.tsx level
  return (
    <>
      {children}
    </>
  )
}

