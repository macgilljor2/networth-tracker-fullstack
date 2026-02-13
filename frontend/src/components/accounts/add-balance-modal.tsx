'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { balancesService } from '@/lib/api/balances.service'
import { enumsService } from '@/lib/api/enums.service'
import { Balance } from '@/types'

export interface AddBalanceData {
  amount: number
  date: string
}

export interface AddBalanceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (data?: AddBalanceData) => void | Promise<void>
  accountId: string
  accountName: string
  accountCurrency: string
  initialBalance?: Balance
}

export const AddBalanceModal: React.FC<AddBalanceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  accountId,
  accountName,
  accountCurrency,
  initialBalance,
}) => {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const isEditing = !!initialBalance

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<AddBalanceData>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (initialBalance) {
        setValue('amount', initialBalance.amount)
        setValue('date', initialBalance.date)
      } else {
        setValue('date', new Date().toISOString().split('T')[0])
        reset()
      }
    }
  }, [isOpen, setValue, reset, initialBalance])

  const onSubmit = async (data: AddBalanceData) => {
    setError('')
    setLoading(true)

    try {
      if (isEditing) {
        // For editing, pass the data to parent to handle the update
        await onSuccess(data)
      } else {
        // For creating, call the API directly
        await balancesService.createBalance(accountId, {
          amount: data.amount,
          currency: accountCurrency,
          date: data.date,
        })
        reset()
        onSuccess() // No data for create
      }
      onClose()
    } catch (err: any) {
      console.error('Balance error:', err)
      let errorMessage = isEditing ? 'Failed to update balance' : 'Failed to add balance'
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

  const currencySymbol = accountCurrency === 'USD' ? '$' : accountCurrency === 'EUR' ? '€' : '£'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div
        className="glass-card rounded-2xl p-8 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#1a1a1a]">{isEditing ? 'Edit Balance' : 'Add Balance'}</h2>
            <p className="text-sm text-[#5a5a5a]">{accountName}</p>
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Balance Amount */}
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Balance Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-mono text-[#a89880]">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className={`no-spinner w-full pl-10 pr-4 py-3 rounded-xl border bg-white text-lg font-mono transition-colors ${
                  errors.amount
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                    : 'border-[#d5d9d0] focus:border-[#2d5a27] focus:ring-[#2d5a27]/10'
                } focus:outline-none focus:ring-2`}
                {...register('amount', {
                  required: 'Balance amount is required',
                  valueAsNumber: true,
                  min: { value: 0, message: 'Balance must be positive' },
                })}
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{typeof errors.amount.message === 'string' ? errors.amount.message : 'Balance amount is required'}</p>
            )}
          </div>

          {/* Balance Date */}
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className={`w-full px-4 py-3 rounded-xl border bg-white text-base transition-colors ${
                errors.date
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                  : 'border-[#d5d9d0] focus:border-[#2d5a27] focus:ring-[#2d5a27]/10'
              } focus:outline-none focus:ring-2`}
              {...register('date', { required: 'Date is required' })}
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{typeof errors.date.message === 'string' ? errors.date.message : 'Date is required'}</p>
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
                  <span>{isEditing ? 'Updating...' : 'Adding...'}</span>
                </>
              ) : (
                <>
                  {isEditing ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Update Balance</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                      </svg>
                      <span>Add Balance</span>
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
