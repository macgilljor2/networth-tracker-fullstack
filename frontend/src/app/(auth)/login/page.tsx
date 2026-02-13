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

      // Temporarily set token so getCurrentUser works
      const setToken = useAuthStore.getState().setAuthData
      setToken(response.access_token, response.expires_in, {} as any)

      // Get current user - now has token available
      const userResponse = await authService.getCurrentUser()

      // Store complete auth data with user
      setAuthData(response.access_token, response.expires_in, userResponse)

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
