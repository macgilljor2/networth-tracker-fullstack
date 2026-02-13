'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { groupsService } from '@/lib/api/groups.service'
import { AccountGroup } from '@/types'

interface GroupDetailModalProps {
  groupId: string
  onClose: () => void
}

export function GroupDetailModal({ groupId, onClose }: GroupDetailModalProps) {
  const router = useRouter()
  const [group, setGroup] = useState<AccountGroup | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGroupDetails = async () => {
      setLoading(true)
      try {
        const groupData = await groupsService.getGroup(groupId)
        setGroup(groupData)
      } catch (error) {
        console.error('Failed to fetch group details:', error)
        setGroup(null)
      } finally {
        setLoading(false)
      }
    }

    fetchGroupDetails()
  }, [groupId])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
        <div className="glass-card rounded-2xl p-8 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5a8f5a]"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!group) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#3d3428] mb-1">{group.name}</h2>
            {group.description && (
              <p className="text-sm text-[#6d5c4a]">{group.description}</p>
            )}
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

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="glass-card rounded-xl p-4">
            <p className="text-sm text-[#6d5c4a] mb-1">Total Balance</p>
            <p className="text-2xl font-bold font-mono text-[#5a8f5a]">
              £{group.total_balance_gbp?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-sm text-[#6d5c4a] mb-1">Accounts</p>
            <p className="text-2xl font-bold text-[#3d3428]">
              {group.account_count || 0}
            </p>
          </div>
        </div>

        {/* Accounts in Group */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-[#3d3428] mb-3">Accounts in this Group</h3>
          {group.accounts && group.accounts.length > 0 ? (
            <div className="space-y-3">
              {group.accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-[#faf8f5] border border-[#e5ddd3]"
                >
                  <div>
                    <p className="font-semibold text-[#3d3428]">{account.account_name || 'Unknown Account'}</p>
                    <p className="text-sm text-[#a89880] capitalize">{account.account_type || 'Unknown'}</p>
                  </div>
                  <p className="text-lg font-mono font-medium text-[#5a8f5a]">
                    £{typeof account.latest_balance_gbp === 'number' ? account.latest_balance_gbp.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-[#a89880] py-8">No accounts in this group yet</p>
          )}
        </div>

        {/* View Full Details Button with link */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              router.push(`/groups/${group.id}`)
              onClose()
            }}
            className="flex-1 py-3 rounded-xl bg-[#5a8f5a] hover:bg-[#3d6b3d] text-white font-semibold flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4 4-6 6"/>
            </svg>
            <span>View Full Details</span>
          </button>
        </div>
      </div>
    </div>
  )
}
