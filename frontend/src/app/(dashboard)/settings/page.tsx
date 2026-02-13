'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { authService } from '@/lib/api/auth.service'
import { useTheme } from '@/hooks/use-theme'
import { ThemeSelector } from '@/components/settings/theme-selector'
import { AccountTypeManager } from '@/components/settings/account-type-manager'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { themes } from '@/styles/themes'

export default function SettingsPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const { theme, setTheme } = useTheme()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')
  const [themeMessage, setThemeMessage] = useState('')
  const [mounted, setMounted] = useState(false)

  // Handle hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (user) {
      setUsername(user.username || '')
      setEmail(user.email || '')
    }
  }, [user])

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme)
    setThemeMessage('Theme updated successfully')
    setTimeout(() => setThemeMessage(''), 3000)

    // TODO: Sync with backend via PUT /api/v1/user/settings
    // try {
    //   await apiClient.put('/api/v1/user/settings', { theme: newTheme })
    // } catch (err) {
    //   setProfileError('Failed to update theme')
    // }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setProfileError('')

    try {
      // TODO: Implement profile update API call
      // await apiClient.put('/api/v1/user/profile', { username, email })
      setProfileMessage('Profile updated successfully')
      setTimeout(() => setProfileMessage(''), 3000)
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearAuth()
      router.push('/login')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary">Settings</h1>
        <p className="text-secondary mt-1">Manage your account preferences</p>
      </div>

      {/* Theme Selection */}
      <Card title="Appearance">
        {themeMessage && (
          <div className="mb-4 p-3 bg-primary/10 border border-primary/30 rounded-lg">
            <p className="text-sm text-primary">{themeMessage}</p>
          </div>
        )}
        <ThemeSelector currentTheme={theme} onThemeChange={handleThemeChange} />
      </Card>

      {/* Profile Settings */}
      <Card title="Profile">
        <div className="space-y-4 max-w-lg">
          {!mounted ? (
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-secondary rounded"></div>
              <div className="h-10 bg-secondary rounded"></div>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted">
                Your username and email are managed by your account provider and cannot be changed here.
              </p>

              <Input
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled
                helperText={username ? "Username is managed by your account provider" : "Not available"}
              />

              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled
                helperText={email ? "Email is managed by your account provider" : "Not available"}
              />

              {profileMessage && (
                <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                  <p className="text-sm text-primary">{profileMessage}</p>
                </div>
              )}

              {profileError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{profileError}</p>
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Account Types */}
      <Card title="Account Types">
        <p className="text-sm text-muted mb-4">
          Manage custom account types for your accounts. System types cannot be modified.
        </p>
        <AccountTypeManager />
      </Card>

      {/* Danger Zone */}
      <Card title="Account" variant="default">
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            Once you log out, you will need to enter your credentials again to access your account.
          </p>
          <Button variant="secondary" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </Card>

      {/* Feature Flags (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <Card title="Feature Flags (Development)">
          <div className="space-y-4">
            <p className="text-sm text-muted">
              These flags control feature availability across the application.
              Changes require reloading the page.
            </p>
            <div className="bg-secondary p-4 rounded-lg">
              <p className="text-xs text-muted mb-2">
                Feature flags are configured in{' '}
                <code className="bg-secondary px-1 rounded">src/lib/constants/feature-flags.ts</code>
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* App Info */}
      <Card title="About">
        <div className="space-y-2 text-sm text-secondary">
          <p><strong>Net Worth Tracker</strong></p>
          <p>Version 1.0.0</p>
          <p>Track your net worth over time with this modern web application.</p>
        </div>
      </Card>
    </div>
  )
}
