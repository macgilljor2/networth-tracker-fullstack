'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { LoginForm, LoginFormData } from '@/components/forms/login-form'
import { authService } from '@/lib/api/auth.service'
import { useAuthStore } from '@/stores/auth-store'
import { apiClient } from '@/lib/api/client'

export default function LoginPage() {
  const router = useRouter()
  const setAuthData = useAuthStore((state) => state.setAuthData)
  const [error, setError] = React.useState<string>('')
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (data: LoginFormData) => {
    setError('')
    setLoading(true)

    try {
      // Login - get token
      const response = await authService.login({
        email: data.email,
        password: data.password,
      })

      // Store token FIRST so apiClient can use it for next request
      // We'll update with user data after we fetch it
      setAuthData(
        response.access_token,
        response.expires_in || 1800,
        null as any // Temporarily set user as null
      )

      // Get current user - apiClient now has token
      const userResponse = await authService.getCurrentUser()

      // Update auth store with complete user data
      setAuthData(
        response.access_token,
        response.expires_in || 1800,
        userResponse
      )

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return <LoginForm onSubmit={handleSubmit} error={error} loading={loading} />
}
