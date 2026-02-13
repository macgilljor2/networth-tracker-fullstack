'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { balancesService } from '@/lib/api/balances.service'
import { AccountWithBalances } from '@/types'

export interface BulkBalanceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  accounts: AccountWithBalances[]
}

export const BulkBalanceModal: React.FC<BulkBalanceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  accounts,
}) => {
  const [balances, setBalances] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submittingAccountId, setSubmittingAccountId] = useState<string | null>(null)
  const [submittedAccounts, setSubmittedAccounts] = useState<Set<string>>(new Set())
  const [failedAccounts, setFailedAccounts] = useState<Record<string, string>>({})

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setBalances({})
      setError('')
      setSubmittedAccounts(new Set())
      setFailedAccounts({})
    }
  }, [isOpen])

  const handleBalanceChange = (accountId: string, value: string) => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && value !== '') {
      setBalances(prev => ({ ...prev, [accountId]: numValue }))
    } else {
      setBalances(prev => {
        const newBalances = { ...prev }
        delete newBalances[accountId]
        return newBalances
      })
    }
    // Clear error state when user changes value
    if (failedAccounts[accountId]) {
      setFailedAccounts(prev => {
        const newFailed = { ...prev }
        delete newFailed[accountId]
        return newFailed
      })
    }
  }

  const handleSubmit = async (accountId: string) => {
    const amount = balances[accountId]
    if (!amount && amount !== 0) return

    setSubmittingAccountId(accountId)
    setError('')

    const account = accounts.find(a => a.id === accountId)
    if (!account) return

    try {
      await balancesService.createBalance(accountId, {
        amount: amount,
        currency: account.currency,
        date: new Date().toISOString().split('T')[0],
      })

      setSubmittedAccounts(prev => new Set([...prev, accountId]))
      // Clear the balance for this account after successful submission
      setBalances(prev => {
        const newBalances = { ...prev }
        delete newBalances[accountId]
        return newBalances
      })
    } catch (err: any) {
      console.error('Failed to add balance:', err)
      let errorMessage = 'Failed to add balance'
      if (err?.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail
        }
      } else if (err?.message) {
        errorMessage = err.message
      }
      setFailedAccounts(prev => ({ ...prev, [accountId]: errorMessage }))
    } finally {
      setSubmittingAccountId(null)
    }
  }

  const handleSubmitAll = async () => {
    setLoading(true)
    setError('')

    const accountsWithBalances = Object.keys(balances)

    if (accountsWithBalances.length === 0) {
      setLoading(false)
      return
    }

    // Submit each balance one by one
    for (const accountId of accountsWithBalances) {
      const amount = balances[accountId]
      if (amount === undefined) continue

      setSubmittingAccountId(accountId)

      const account = accounts.find(a => a.id === accountId)
      if (!account) continue

      try {
        await balancesService.createBalance(accountId, {
          amount: amount,
          currency: account.currency,
          date: new Date().toISOString().split('T')[0],
        })
        setSubmittedAccounts(prev => new Set([...prev, accountId]))
      } catch (err: any) {
        console.error(`Failed to add balance for account ${accountId}:`, err)
        let errorMessage = 'Failed to add balance'
        if (err?.response?.data?.detail) {
          if (typeof err.response.data.detail === 'string') {
            errorMessage = err.response.data.detail
          }
        } else if (err?.message) {
          errorMessage = err.message
        }
        setFailedAccounts(prev => ({ ...prev, [accountId]: errorMessage }))
      }
    }

    setSubmittingAccountId(null)
    setLoading(false)

    // Check if all succeeded
    if (Object.keys(failedAccounts).length === 0 && accountsWithBalances.length > 0) {
      onSuccess()
      onClose()
    }
  }

  const handleClose = () => {
    onClose()
  }

  if (!isOpen) return null

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div
        className="glass-card rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#1a1a1a]">Bulk Add Balances</h2>
            <p className="text-sm text-[#5a5a5a]">Add balances for {today}</p>
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

        {/* Accounts List */}
        <div className="space-y-3 mb-6">
          {accounts.map((account) => {
            const currencySymbol = account.currency === 'USD' ? '$' : account.currency === 'EUR' ? '€' : '£'
            const isSubmitted = submittedAccounts.has(account.id)
            const isFailed = failedAccounts[account.id]
            const isSubmitting = submittingAccountId === account.id
            const hasBalance = balances[account.id] !== undefined

            return (
              <div
                key={account.id}
                className={`p-4 rounded-xl border transition-all ${
                  isSubmitted
                    ? 'bg-[#2d5a27]/5 border-[#2d5a27]/30'
                    : isFailed
                    ? 'bg-red-50 border-red-200'
                    : 'bg-[#faf9f6] border-[#d5d9d0]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-[#1a1a1a]">{account.account_name || account.name || 'Unnamed Account'}</p>
                    <p className="text-sm text-[#a89880] capitalize">{account.account_type} • {account.currency}</p>
                    {isFailed && (
                      <p className="text-xs text-red-600 mt-1">{isFailed}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    {isSubmitted ? (
                      <div className="flex items-center space-x-2 text-[#2d5a27]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                        </svg>
                        <span className="text-sm font-medium">Added</span>
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-[#a89880]">
                            {currencySymbol}
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            disabled={isSubmitting}
                            value={balances[account.id] !== undefined ? balances[account.id] : ''}
                            onChange={(e) => handleBalanceChange(account.id, e.target.value)}
                            className="no-spinner w-48 pl-8 pr-3 py-2 rounded-lg border border-[#d5d9d0] bg-white text-base font-mono focus:outline-none focus:ring-2 focus:ring-[#2d5a27]/10 focus:border-[#2d5a27] disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                        <button
                          onClick={() => handleSubmit(account.id)}
                          disabled={!hasBalance || isSubmitting}
                          className="px-4 py-2 rounded-lg bg-[#2d5a27] hover:bg-[#1e3d1a] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                        >
                          {isSubmitting ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                              </svg>
                              <span>Add</span>
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-6 border-t border-[#d5d9d0]">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-6 py-3 rounded-xl border border-[#d5d9d0] text-[#1a1a1a] font-semibold hover:bg-[#faf9f6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Close
          </button>
          <button
            onClick={handleSubmitAll}
            disabled={loading || Object.keys(balances).length === 0}
            className="flex-1 px-6 py-3 rounded-xl bg-[#2d5a27] hover:bg-[#1e3d1a] text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Adding All...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>Submit All ({Object.keys(balances).length})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
