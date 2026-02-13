'use client'

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { accountsService } from '@/lib/api/accounts.service'
import { balancesService } from '@/lib/api/balances.service'
import { accountTypesService } from '@/lib/api/account-types.service'
import { AccountType } from '@/lib/api/account-types.service'

export interface CreateAccountData {
  account_name: string
  account_type: string
  currency: string
  initial_balance?: number
  balance_date?: string // Local form field only, not sent to API
}

export interface AddAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [accountTypes, setAccountTypes] = useState<Array<{ value: string; label: string }>>([])
  const [currencies, setCurrencies] = useState<Array<{ code: string; name: string; symbol: string }>>([
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
  ])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CreateAccountData>({
    defaultValues: {
      balance_date: new Date().toISOString().split('T')[0],
    },
  })

  useEffect(() => {
    const fetchAccountTypes = async () => {
      try {
        const types = await accountTypesService.getAccountTypes()
        // Convert to format expected by select
        setAccountTypes(types.map((t: AccountType) => ({ value: t.name, label: t.label })))
      } catch (err) {
        console.error('Failed to load account types from API:', err)
        // Set fallback defaults
        setAccountTypes([
          { value: 'savings', label: 'Savings' },
          { value: 'current', label: 'Current Account' },
          { value: 'investment', label: 'Investment' },
          { value: 'credit', label: 'Credit Card' },
          { value: 'loan', label: 'Loan' },
        ])
      }
    }

    if (isOpen) {
      fetchAccountTypes()
    }
  }, [isOpen])

  const onSubmit = async (data: CreateAccountData) => {
    setError('')
    setLoading(true)

    try {
      // Create the account first (without initial balance in the request)
      const accountData = {
        account_name: data.account_name,
        account_type: data.account_type,
        currency: data.currency,
      }
      console.log('Creating account:', accountData)
      const createdAccount = await accountsService.createAccount(accountData)
      console.log('Account created:', createdAccount)

      // If initial balance is provided, create a balance entry
      if (data.initial_balance !== undefined && data.initial_balance !== null && data.initial_balance > 0 && data.balance_date) {
        console.log('Creating initial balance entry:', {
          amount: data.initial_balance,
          currency: data.currency,
          date: data.balance_date,
        })
        await balancesService.createBalance(createdAccount.id, {
          amount: data.initial_balance,
          currency: data.currency,
          date: data.balance_date,
        })
        console.log('Initial balance created')
      }

      reset()
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Create account error:', err)
      // Handle different error response formats
      let errorMessage = 'Failed to create account'
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

  const handleClose = () => {
    reset()
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div
        className="glass-card rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#3d3428]">Add New Account</h2>
            <p className="text-sm text-[#6d5c4a]">Create a new account to track</p>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close modal"
            className="p-2 rounded-lg hover:bg-[#e5ddd3] transition-colors"
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Account Name */}
          <div>
            <label className="block text-sm font-medium text-[#3d3428] mb-2">
              Account Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., My Main Savings"
              className={`w-full px-4 py-3 rounded-xl border bg-white transition-colors ${
                errors.account_name
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                  : 'border-[#e5ddd3] focus:border-[#5a8f5a] focus:ring-[#5a8f5a]/10'
              } focus:outline-none focus:ring-2`}
              {...register('account_name', { required: 'Account name is required' })}
            />
            {errors.account_name && (
              <p className="mt-1 text-sm text-red-600">{typeof errors.account_name.message === 'string' ? errors.account_name.message : 'Account name is required'}</p>
            )}
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-sm font-medium text-[#3d3428] mb-2">
              Account Type <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                className={`w-full px-4 py-3 rounded-xl border bg-white appearance-none cursor-pointer transition-colors ${
                  errors.account_type
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                    : 'border-[#e5ddd3] focus:border-[#5a8f5a] focus:ring-[#5a8f5a]/10'
                } focus:outline-none focus:ring-2 pr-10`}
                {...register('account_type', { required: 'Account type is required' })}
              >
                <option value="">Select account type...</option>
                {accountTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-[#a89880]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </div>
            {errors.account_type && (
              <p className="mt-1 text-sm text-red-600">{typeof errors.account_type.message === 'string' ? errors.account_type.message : 'Account type is required'}</p>
            )}
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-[#3d3428] mb-2">
              Currency <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                className={`w-full px-4 py-3 rounded-xl border bg-white appearance-none cursor-pointer transition-colors ${
                  errors.currency
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                    : 'border-[#e5ddd3] focus:border-[#5a8f5a] focus:ring-[#5a8f5a]/10'
                } focus:outline-none focus:ring-2 pr-10`}
                {...register('currency', { required: 'Currency is required' })}
              >
                <option value="">Select currency...</option>
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-[#a89880]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </div>
            {errors.currency && (
              <p className="mt-1 text-sm text-red-600">{typeof errors.currency.message === 'string' ? errors.currency.message : 'Currency is required'}</p>
            )}
          </div>

          {/* Initial Balance (Optional) */}
          <div className="pt-4 border-t border-[#e5ddd3]">
            <p className="text-sm font-medium text-[#3d3428] mb-3">Initial Balance (Optional)</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#6d5c4a] mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-lg border border-[#e5ddd3] bg-white focus:border-[#5a8f5a] focus:ring-2 focus:ring-[#5a8f5a]/10 focus:outline-none transition-colors text-sm"
                  {...register('initial_balance', {
                    valueAsNumber: true,
                    min: 0,
                  })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6d5c4a] mb-1">Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 rounded-lg border border-[#e5ddd3] bg-white focus:border-[#5a8f5a] focus:ring-2 focus:ring-[#5a8f5a]/10 focus:outline-none transition-colors text-sm"
                  {...register('balance_date')}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-6 border-t border-[#e5ddd3]">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-xl border border-[#e5ddd3] text-[#3d3428] font-semibold hover:bg-[#faf8f5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-xl bg-[#5a8f5a] hover:bg-[#3d6b3d] text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  <span>Create Account</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
