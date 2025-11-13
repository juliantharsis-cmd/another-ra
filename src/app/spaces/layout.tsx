'use client'

import { SidebarProvider } from '@/components/SidebarContext'
import TopRightBanner from '@/components/TopRightBanner'
import { useUserPreferences } from '@/hooks/useUserPreferences'

function SpacesContent({ children }: { children: React.ReactNode }) {
  const { preferences } = useUserPreferences()
  const sidebarLayout = preferences?.sidebarLayout || 'topBanner'
  const showTopBanner = sidebarLayout === 'topBanner'

  return (
    <>
      {showTopBanner && <TopRightBanner />}
      {children}
    </>
  )
}

export default function SpacesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <SpacesContent>{children}</SpacesContent>
    </SidebarProvider>
  )
}

