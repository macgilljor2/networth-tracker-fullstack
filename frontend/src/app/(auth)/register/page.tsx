'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { RegisterForm, RegisterFormData } from '@/components/forms/register-form'
import { authService } from '@/lib/api/auth.service'
import { useAuthStore } from '@/stores/auth-store'

export default function RegisterPage() {
  const router = useRouter()
  const setUser = useAuthStore((state) => state.setUser)
  const setToken = useAuthStore((state) => state.setToken)
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

      // Store auth data
      setToken(loginResponse.access_token)

      // Fetch user data using axios directly with the token
      const { apiClient } = await import('@/lib/api/client')
      const userResponse = await apiClient.get('/api/v1/auth/me', {
        headers: {
          Authorization: `Bearer ${loginResponse.access_token}`
        }
      })
      setUser(userResponse.data)

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
