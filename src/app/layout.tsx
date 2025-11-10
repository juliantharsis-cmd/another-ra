import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SpaceNavigation from '@/components/SpaceNavigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Another RA - Multi-Space Tool',
  description: 'Web-based tool with System Configuration, Admin, and GHG Emission spaces',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <SpaceNavigation />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}

