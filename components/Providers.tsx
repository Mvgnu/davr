'use client'

import { SessionProvider } from 'next-auth/react'
import { AuthProvider } from '@/context/AuthContext'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/ThemeProvider'

interface ProvidersProps {
  children: React.ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider defaultTheme="system" storageKey="davr-ui-theme">
      <SessionProvider>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </SessionProvider>
    </ThemeProvider>
  )
} 