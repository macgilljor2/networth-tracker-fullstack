'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { authService } from '@/lib/api/auth.service'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const setAuthData = useAuthStore((state) => state.setAuthData)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const shouldRefreshToken = useAuthStore((state) => state.shouldRefreshToken)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const hasFetchedUserRef = useRef(false)

  // Fetch user data on mount if we have a token but no user
  useEffect(() => {
    const fetchUserData = async () => {
      // Skip if we've already attempted to fetch user
      if (hasFetchedUserRef.current) {
        setIsLoading(false)
        return
      }

      hasFetchedUserRef.current = true

      // If we have a token but no user data, fetch it
      if (token && !user) {
        try {
          console.log('AuthProvider: Found token but no user, fetching user data...')
          const userData = await authService.getCurrentUser()
          if (userData) {
            setUser(userData)
            console.log('AuthProvider: User data loaded:', userData)
          }
        } catch (error) {
          console.error('AuthProvider: Failed to fetch user data:', error)
          // Clear invalid token
          clearAuth()
        }
      }

      setIsLoading(false)
    }

    fetchUserData()
  }, [token, user, setUser, clearAuth])

  // Background token refresh
  useEffect(() => {
    if (isLoading || !token || !user) {
      // No auth data, clear any existing interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
        refreshIntervalRef.current = null
      }
      return
    }

    // Check immediately if refresh is needed
    const checkAndRefresh = async () => {
      if (shouldRefreshToken()) {
        try {
          const response = await authService.refreshToken()
          if (response.access_token) {
            // Update token and expiry, keep existing user
            setAuthData(response.access_token, response.expires_in, user)
            console.log('Token refreshed in background')
          }
        } catch (error) {
          console.error('Background refresh failed:', error)
          // Don't logout on background refresh failure
          // Let the API interceptor handle it when actual requests fail
        }
      }
    }

    // Check immediately
    checkAndRefresh()

    // Set up interval to check every minute
    refreshIntervalRef.current = setInterval(() => {
      checkAndRefresh()
    }, 60 * 1000) // Every minute

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
        refreshIntervalRef.current = null
      }
    }
  }, [token, user, setAuthData, shouldRefreshToken, isLoading])

  if (isLoading) {
    return null // Or a loading spinner
  }

  return <>{children}</>
}
