'use client'

import React, { useEffect, useState } from 'react'
import { groupsService } from '@/lib/api/groups.service'
import { accountsService } from '@/lib/api/accounts.service'

interface Account {
  id: string
  account_name: string
  currency: string
  account_type: string
  current_balance?: number
}

interface CreateGroupModalProps {
  onClose: () => void
  onSuccess?: () => void
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  savings: 'Savings',
  current: 'Current Account',
  investment: 'Investment',
  credit: 'Credit Card',
  loan: 'Loan',
}

export function CreateGroupModal({ onClose, onSuccess }: CreateGroupModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [loadingAccounts, setLoadingAccounts] = useState(true)

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const data = await accountsService.getAccounts()
        setAccounts(data)
      } catch (error) {
        console.error('Failed to fetch accounts:', error)
        setAccounts([])
      } finally {
        setLoadingAccounts(false)
      }
    }

    fetchAccounts()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !description.trim()) {
      alert('Please provide both a name and description')
      return
    }

    setLoading(true)
    try {
      // Create the group with accounts in one call
      await groupsService.createGroup({
        name: name.trim(),
        description: description.trim(),
        accounts: Array.from(selectedAccounts),
      })

      // Call success callback and close
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Failed to create group:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create group. Please try again.'
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const toggleAccount = (accountId: string) => {
    const newSelected = new Set(selectedAccounts)
    if (newSelected.has(accountId)) {
      newSelected.delete(accountId)
    } else {
      newSelected.add(accountId)
    }
    setSelectedAccounts(newSelected)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="glass-card rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-[#3d3428]">Create Account Group</h2>
            <p className="text-sm text-[#6d5c4a]">Organize your accounts into portfolios</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-lg hover:bg-[#e5ddd3] transition-colors"
          >
            <svg className="w-6 h-6 text-[#a89880]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Scrollable form content */}
        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          <form id="create-group-form" onSubmit={handleSubmit}>
            {/* Name */}
            <div className="mb-4">
              <label htmlFor="group-name" className="block text-sm font-medium text-[#3d3428] mb-2">
                Group Name *
              </label>
              <input
                id="group-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#e5ddd3] bg-[#faf8f5] text-[#3d3428] placeholder-[#a89880] focus:outline-none focus:ring-2 focus:ring-[#5a8f5a]"
                placeholder="e.g., Emergency Fund, Investments"
                required
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label htmlFor="group-description" className="block text-sm font-medium text-[#3d3428] mb-2">
                Description *
              </label>
              <textarea
                id="group-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#e5ddd3] bg-[#faf8f5] text-[#3d3428] placeholder-[#a89880] focus:outline-none focus:ring-2 focus:ring-[#5a8f5a] resize-none"
                placeholder="What's this group for?"
                rows={3}
                required
              />
            </div>

            {/* Select Accounts */}
            <div className="mb-2">
              <label htmlFor="accounts-list" className="block text-sm font-medium text-[#3d3428] mb-2">
                Add Accounts (optional)
              </label>
              {loadingAccounts ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5a8f5a]"></div>
                </div>
              ) : accounts.length > 0 ? (
                <div id="accounts-list" className="space-y-2 max-h-60 overflow-y-auto pr-2 border border-[#e5ddd3] rounded-xl p-2 bg-[#faf8f5]">
                  {accounts.map((account) => (
                    <label
                      key={account.id}
                      className="flex items-center p-3 rounded-lg cursor-pointer hover:bg-[#f5f0e8] transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAccounts.has(account.id)}
                        onChange={() => toggleAccount(account.id)}
                        className="w-5 h-5 rounded border-[#a89880] text-[#5a8f5a] focus:ring-[#5a8f5a]"
                      />
                      <div className="ml-3 flex-1">
                        <p className="font-medium text-[#3d3428]">{account.account_name || 'Unknown Account'}</p>
                        <p className="text-sm text-[#a89880]">
                          {ACCOUNT_TYPE_LABELS[account.account_type] || account.account_type} • {account.currency?.toUpperCase() || 'GBP'}
                        </p>
                      </div>
                      {typeof account.current_balance === 'number' && (
                        <p className="text-sm font-display font-mono text-[#5a8f5a]">
                          {account.currency?.toUpperCase() === 'USD' ? '$' : account.currency?.toUpperCase() === 'EUR' ? '€' : '£'}{account.current_balance.toFixed(2)}
                        </p>
                      )}
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-center text-[#a89880] py-4">
                  No accounts available. Create an account first.
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Fixed footer with buttons */}
        <div className="flex space-x-3 flex-shrink-0 mt-6 pt-6 border-t border-[#e5ddd3]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-[#e5ddd3] text-[#3d3428] font-semibold hover:bg-[#faf8f5] transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              const form = document.getElementById('create-group-form') as HTMLFormElement
              form?.requestSubmit()
            }}
            className="flex-1 py-3 rounded-xl bg-[#5a8f5a] hover:bg-[#3d6b3d] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !name.trim() || !description.trim()}
          >
            {loading ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  )
}
