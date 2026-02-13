'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { accountsService } from '@/lib/api/accounts.service'
import { Account } from '@/types'

export interface ConfigureAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  account: Account
}

export interface ConfigureAccountData {
  account_name: string
}

export const ConfigureAccountModal: React.FC<ConfigureAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  account,
}) => {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isExcluded, setIsExcluded] = useState(account.is_excluded_from_totals || false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ConfigureAccountData>({
    defaultValues: {
      account_name: account.account_name || '',
    },
  })

  useEffect(() => {
    if (isOpen) {
      setValue('account_name', account.account_name || '')
      setIsExcluded(account.is_excluded_from_totals || false)
    }
  }, [isOpen, account, setValue])

  const onSubmit = async (data: ConfigureAccountData) => {
    setError('')
    setLoading(true)

    try {
      // Update account name
      await accountsService.updateAccount(account.id, {
        account_name: data.account_name,
      })

      // Update exclusion if changed
      if (isExcluded !== (account.is_excluded_from_totals || false)) {
        await accountsService.toggleExclusion(account.id)
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Configure account error:', err)
      let errorMessage = 'Failed to update account'
      if (err?.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail
        } else if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map((e: any) => e.msg || e.message || String(e)).join(', ')
        } else if (typeof err.response.data.detail === 'object') {
          errorMessage = err.response.data.detail.msg || err.response.data.detail.message || errorMessage
        }
      } else if (err?.message) {
        errorMessage = err.message
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await accountsService.deleteAccount(account.id)
      onClose()
      router.push('/accounts')
    } catch (err: any) {
      setError(err.message || 'Failed to delete account')
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    setError('')
    setIsExcluded(account.is_excluded_from_totals || false)
    setShowDeleteConfirm(false)
    onClose()
  }

  const handleToggleExclusion = () => {
    // Only update local state, don't call API yet
    setIsExcluded(!isExcluded)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div
        className="glass-card rounded-2xl p-8 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#1a1a1a]">Configure Account</h2>
            <p className="text-sm text-[#5a5a5a]">Account settings and preferences</p>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close modal"
            className="p-2 rounded-lg hover:bg-[#faf9f6] transition-colors"
          >
            <svg className="w-6 h-6 text-[#a89880]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Account Name */}
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Account Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter account name"
              className={`w-full px-4 py-3 rounded-xl border bg-white transition-colors ${
                errors.account_name
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                  : 'border-[#d5d9d0] focus:border-[#2d5a27] focus:ring-[#2d5a27]/10'
              } focus:outline-none focus:ring-2`}
              {...register('account_name', { required: 'Account name is required' })}
            />
            {errors.account_name && (
              <p className="mt-1 text-sm text-red-600">{typeof errors.account_name.message === 'string' ? errors.account_name.message : 'Account name is required'}</p>
            )}
          </div>

          {/* Exclusion Toggle */}
          <div className="pt-4 border-t border-[#d5d9d0]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#1a1a1a] mb-1">Include in Overall Total</h3>
                <p className="text-xs text-[#5a5a5a]">
                  {isExcluded
                    ? 'This account is currently excluded from the overall net worth total'
                    : 'This account is included in the overall net worth total'
                  }
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleExclusion}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out ${
                  isExcluded ? 'bg-[#a89880]' : 'bg-[#2d5a27]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                    isExcluded ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="mt-2 text-xs text-[#5a5a5a]">
              {isExcluded
                ? 'Excluded accounts won\'t count toward your total net worth on the dashboard'
                : 'Toggle to exclude this account from your total net worth calculation'
              }
            </p>
          </div>

          {/* Danger Zone */}
          <div className="pt-6 border-t-2 border-red-100">
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border-2 border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600 font-medium transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Delete Account</span>
              </button>
            ) : (
              <div className="bg-red-50 rounded-xl p-4">
                <p className="text-sm text-red-800 mb-4">
                  <strong>Warning:</strong> This action cannot be undone. All balance history will be permanently deleted.
                </p>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setError('')
                    }}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2 rounded-lg border border-red-300 text-red-700 font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isDeleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l2-2m0 0l2 2m-2-2l-2 2M5 12h14" />
                        </svg>
                        <span>Delete Account</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-6 border-t border-[#d5d9d0]">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-xl border border-[#d5d9d0] text-[#1a1a1a] font-semibold hover:bg-[#faf9f6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-xl bg-[#2d5a27] hover:bg-[#1e3d1a] text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
