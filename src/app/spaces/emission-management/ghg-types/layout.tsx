'use client'

import { ReactNode } from 'react'

export default function GHGTypeLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div style={{ margin: 0, padding: 0, position: 'relative' }}>
      {children}
    </div>
  )
}

