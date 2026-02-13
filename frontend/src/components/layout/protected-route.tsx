'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'

export interface ProtectedRouteProps {
  children: React.ReactNode
  isAuthenticated?: boolean
  isLoading?: boolean
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  isAuthenticated: propIsAuth,
  isLoading: propIsLoading,
}) => {
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)
  const storeIsAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isAuthenticated = propIsAuth ?? storeIsAuthenticated
  const isLoading = propIsLoading ?? false

  // Wait for zustand to hydrate from localStorage
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    // Only redirect after hydration is complete
    if (isHydrated && !isAuthenticated && !isLoading) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router, isHydrated])

  // Show loading while hydrating
  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
