'use client'

import React, { useState } from 'react'
import { groupsService } from '@/lib/api/groups.service'
import { AccountInGroup } from '@/types'
import { UpdateGroupRequest } from '@/lib/api/groups.service'

interface Account {
  id: string
  account_name: string
  account_type: string
  currency: string
  current_balance?: number
}

interface ManageAccountsModalProps {
  groupId: string
  groupName: string
  groupDescription: string | null
  currentAccounts: AccountInGroup[]
  allAccounts: Account[]
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

export function ManageAccountsModal({ groupId, groupName, groupDescription, currentAccounts, allAccounts, onClose, onSuccess }: ManageAccountsModalProps) {
  // Track selected account IDs locally
  const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(
    new Set(currentAccounts.map(a => a.id))
  )
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Compute which accounts are in each section based on local state
  const selectedAccounts = allAccounts.filter(acc => selectedAccountIds.has(acc.id))
  const availableAccounts = allAccounts.filter(acc => !selectedAccountIds.has(acc.id))

  const toggleAccount = (accountId: string) => {
    const newSelected = new Set(selectedAccountIds)
    if (newSelected.has(accountId)) {
      newSelected.delete(accountId)
    } else {
      newSelected.add(accountId)
    }
    setSelectedAccountIds(newSelected)
    setHasChanges(true)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const selectedIds = Array.from(selectedAccountIds)

      // Build update payload - always include accounts array
      const updateData: UpdateGroupRequest = {
        name: groupName,
        description: groupDescription ?? undefined,
        accounts: selectedIds,
      }

      console.log('Updating group:', groupId, 'with data:', updateData)
      const result = await groupsService.updateGroup(groupId, updateData)
      console.log('Update response:', result)

      setHasChanges(false)
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Failed to update accounts:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      alert('Failed to update accounts. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="glass-card rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-[#3d3428]">Manage Accounts</h2>
            <p className="text-sm text-[#6d5c4a]">Select accounts for "{groupName}"</p>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-6">
          {/* Currently in Group */}
          <div>
            <h3 className="text-lg font-semibold text-[#3d3428] mb-3">
              Accounts in Group ({selectedAccounts.length})
            </h3>
            {selectedAccounts.length > 0 ? (
              <div className="space-y-2">
                {selectedAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-[#faf8f5] border border-[#e5ddd3]"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-[#3d3428]">{account.account_name}</p>
                      <p className="text-sm text-[#a89880]">
                        {ACCOUNT_TYPE_LABELS[account.account_type] || account.account_type} • {account.currency?.toUpperCase() || 'GBP'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      {account.current_balance !== undefined && (
                        <p className="text-lg font-bold font-mono text-[#5a8f5a]">
                          {account.currency?.toUpperCase() === 'USD' ? '$' : account.currency?.toUpperCase() === 'EUR' ? '€' : '£'}{account.current_balance.toFixed(2)}
                        </p>
                      )}
                      <button
                        onClick={() => toggleAccount(account.id)}
                        disabled={loading}
                        className="p-2 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Remove from group"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-[#a89880] py-8 bg-[#faf8f5] rounded-xl border border-dashed border-[#e5ddd3]">
                No accounts in this group yet
              </p>
            )}
          </div>

          {/* Available to Add */}
          <div>
            <h3 className="text-lg font-semibold text-[#3d3428] mb-3">
              Available Accounts ({availableAccounts.length})
            </h3>
            {availableAccounts.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 border border-[#e5ddd3] rounded-xl p-2 bg-[#faf8f5]">
                {availableAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-[#f5f0e8] transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-[#3d3428]">{account.account_name}</p>
                      <p className="text-sm text-[#a89880]">
                        {ACCOUNT_TYPE_LABELS[account.account_type] || account.account_type} • {account.currency?.toUpperCase() || 'GBP'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      {typeof account.current_balance === 'number' && (
                        <p className="text-sm font-bold font-mono text-[#5a8f5a]">
                          {account.currency?.toUpperCase() === 'USD' ? '$' : account.currency?.toUpperCase() === 'EUR' ? '€' : '£'}{account.current_balance.toFixed(2)}
                        </p>
                      )}
                      <button
                        onClick={() => toggleAccount(account.id)}
                        disabled={loading}
                        className="p-2 rounded-lg bg-[#5a8f5a] hover:bg-[#3d6b3d] text-white transition-colors disabled:opacity-50"
                        title="Add to group"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-[#a89880] py-8 bg-[#faf8f5] rounded-xl">
                All accounts are already in this group.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex space-x-3 flex-shrink-0 mt-6 pt-6 border-t border-[#e5ddd3]">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-[#e5ddd3] text-[#3d3428] font-semibold hover:bg-[#faf8f5] transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !hasChanges}
            className="flex-1 py-3 rounded-xl bg-[#5a8f5a] hover:bg-[#3d6b3d] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
