'use client'

import { ReactNode } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { useAuthStore } from '@/stores/auth-store'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  useAuthStore((state) => state.user)

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <div className="gradient-mesh"></div>
        <Navbar />
        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
}
