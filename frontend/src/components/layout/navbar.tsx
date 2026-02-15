'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { authService } from '@/lib/api/auth.service'

export interface NavbarProps {
  isAuthenticated?: boolean
  username?: string
  onLogout?: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  isAuthenticated: propIsAuth,
  username: propUsername,
  onLogout: propLogout,
}) => {
  const router = useRouter()
  const pathname = usePathname()
  const storeUser = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/')

  const isAuthenticated = propIsAuth ?? !!storeUser
  const userUsername = propUsername ?? storeUser?.username ?? ''

  const handleLogout = propLogout ?? (async () => {
    try {
      // Call backend to clear httpOnly cookie
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Always clear local state
      clearAuth()
      router.push('/login')
    }
  })

  // Get initials from username
  const initials = userUsername
    .split(' ')
    .map((name: string) => name[0]?.toUpperCase())
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <nav className="relative z-10 glass-card border-b" style={{ borderColor: 'var(--color-border)' }}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo with enhanced gradient */}
          <Link href="/dashboard" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-md transition-all duration-300" style={{ backgroundColor: 'var(--color-primary-light)' }}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
            </div>
            <span className="text-xl font-bold group-hover:text-primary transition-colors duration-300" style={{ color: 'var(--color-text-primary)' }}>
              Net Worth Tracker
            </span>
          </Link>

          {/* Navigation Links with enhanced active states */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/dashboard"
              className={`relative px-2 py-1 text-sm font-medium transition-all duration-300 ${
                isActive('/dashboard')
                  ? 'text-primary'
                  : 'hover:text-text-primary'
              }`}
              style={{ color: isActive('/dashboard') ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
            >
              Dashboard
              {isActive('/dashboard') && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full shadow-glow" style={{ backgroundColor: 'var(--color-primary)' }} />
              )}
            </Link>
            <Link
              href="/accounts"
              className={`relative px-2 py-1 text-sm font-medium transition-all duration-300 ${
                isActive('/accounts')
                  ? 'text-primary'
                  : 'hover:text-text-primary'
              }`}
              style={{ color: isActive('/accounts') ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
            >
              Accounts
              {isActive('/accounts') && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full shadow-glow" style={{ backgroundColor: 'var(--color-primary)' }} />
              )}
            </Link>
            <Link
              href="/budgets"
              className={`relative px-2 py-1 text-sm font-medium transition-all duration-300 ${
                isActive('/budgets')
                  ? 'text-primary'
                  : 'hover:text-text-primary'
              }`}
              style={{ color: isActive('/budgets') ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
            >
              Budgets
              {isActive('/budgets') && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full shadow-glow" style={{ backgroundColor: 'var(--color-primary)' }} />
              )}
            </Link>
            <Link
              href="/settings"
              className={`relative px-2 py-1 text-sm font-medium transition-all duration-300 ${
                isActive('/settings')
                  ? 'text-primary'
                  : 'hover:text-text-primary'
              }`}
              style={{ color: isActive('/settings') ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
            >
              Settings
              {isActive('/settings') && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full shadow-glow" style={{ backgroundColor: 'var(--color-primary)' }} />
              )}
            </Link>
          </div>

          {/* Right Side */}
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium transition-all duration-300 rounded-lg"
                style={{ color: 'var(--color-text-muted)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
                onFocus={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)' }}
                onBlur={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                Logout
              </button>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer" style={{ backgroundColor: 'var(--color-accent)' }}>
                {initials || 'JD'}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="font-medium transition-all duration-300 px-4 py-2 rounded-lg"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Login
              </Link>
              <Link
                href="/register"
                className="btn-primary px-4 py-2 text-sm font-medium rounded-lg text-white shadow-md hover:shadow-glow-strong"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
