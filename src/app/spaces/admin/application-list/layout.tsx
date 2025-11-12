'use client'

export default function ApplicationListLayout({
    children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ margin: 0, padding: 0, position: 'relative' }}>
      {children}
    </div>
  )
}

