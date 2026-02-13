'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'

export interface LoginFormData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginFormProps {
  onSubmit: (data: LoginFormData) => void | Promise<void>
  error?: string
  loading?: boolean
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  error,
  loading = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>()

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Login Card */}
      <div className="glass-card rounded-2xl p-8">
        {error && (
          <div className="mb-6 p-4 bg-[#c17f59]/10 border border-[#c17f59]/30 rounded-xl">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-[#c17f59]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p className="text-sm text-[#c17f59] font-medium">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            error={!!errors.email}
            errorText={errors.email?.message}
            {...register('email', { required: 'Email is required' })}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={!!errors.password}
            errorText={errors.password?.message}
            {...register('password', { required: 'Password is required' })}
          />

          <div className="flex items-center justify-between">
            <Checkbox
              label="Remember me"
              {...register('rememberMe')}
            />
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-[#5a8f5a] hover:text-[#3d6b3d] transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            className="btn-primary w-full py-3.5 px-4 rounded-xl text-white font-semibold text-lg shadow-md hover:shadow-glow-strong transition-all duration-300"
            loading={loading}
          >
            Sign In
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#e5ddd3]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-[#faf8f5]/50 text-[#a89880]">or continue with</span>
          </div>
        </div>

        {/* Social Login Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center px-4 py-3 border border-[#e5ddd3] rounded-xl hover:bg-[#f5f0e8] hover:border-[#5a8f5a]/30 transition-all duration-300 group">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </button>
          <button className="flex items-center justify-center px-4 py-3 border border-[#e5ddd3] rounded-xl hover:bg-[#f5f0e8] hover:border-[#5a8f5a]/30 transition-all duration-300 group">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </button>
        </div>

        {/* Sign Up Link */}
        <p className="mt-8 text-center text-sm text-[#a89880]">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-[#5a8f5a] hover:text-[#3d6b3d] transition-colors">
            Create one now
          </Link>
        </p>
      </div>

      {/* Footer */}
      <p className="mt-8 text-center text-xs text-[#a89880]/60">
        © 2025 Net Worth Tracker. All rights reserved.
      </p>
    </div>
  )
}
