'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { RegisterForm, RegisterFormData } from '@/components/forms/register-form'
import { authService } from '@/lib/api/auth.service'
import { useAuthStore } from '@/stores/auth-store'

export default function RegisterPage() {
  const router = useRouter()
  const setAuthData = useAuthStore((state) => state.setAuthData)
  const [error, setError] = React.useState<string>('')
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (data: RegisterFormData) => {
    setError('')
    setLoading(true)

    try {
      await authService.register({
        username: data.username,
        email: data.email,
        password: data.password,
      })

      // Auto-login after registration
      const loginResponse = await authService.login({
        email: data.email,
        password: data.password,
      })

      // Store token FIRST so apiClient can use it
      setAuthData(
        loginResponse.access_token,
        loginResponse.expires_in || 1800,
        null as any // Temporarily set user as null
      )

      // Get current user - apiClient now has token
      const userResponse = await authService.getCurrentUser()

      // Update auth store with complete user data
      setAuthData(
        loginResponse.access_token,
        loginResponse.expires_in || 1800,
        userResponse
      )

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      // Only show error if registration itself failed, not login/user fetch issues
      const errorMessage = err?.response?.data?.detail || err?.message || 'Registration failed. Please try again.'
      console.error('Registration error:', err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return <RegisterForm onSubmit={handleSubmit} error={error} loading={loading} />
}
