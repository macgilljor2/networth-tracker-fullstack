'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth-store'

export default function AuthLayout({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user)

  // Get initials from username
  const initials = user?.username
    ?.split(' ')
    .map((name: string) => name[0]?.toUpperCase())
    .join('')
    .slice(0, 2)
    .toUpperCase() || ''

  return (
    <div className="min-h-screen">
      <div className="gradient-mesh"></div>
      {/* Minimal navbar for auth pages - logo only */}
      <nav className="relative z-10 glass-card border-b border-[#e5ddd3]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-[#3d3428]">Net Worth Tracker</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-primary font-medium">
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-medium rounded-lg bg-primary hover:bg-primary-hover text-white"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <div className="relative z-10 min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          {children}
        </div>
      </div>
    </div>
  )
}
