'use client'

import { ReactNode } from 'react'

export default function EmissionFactorsLayout({
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

