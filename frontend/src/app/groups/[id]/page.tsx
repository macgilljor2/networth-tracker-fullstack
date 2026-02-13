'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { groupsService } from '@/lib/api/groups.service'
import { accountsService } from '@/lib/api/accounts.service'
import { AccountGroup, AccountInGroup } from '@/types'
import { LineChart } from '@/components/charts/line-chart'
import { EditGroupModal } from '@/components/groups/edit-group-modal'
import { ManageAccountsModal } from '@/components/groups/manage-accounts-modal'
import { useTheme } from '@/components/providers/theme-provider'

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  savings: 'Savings',
  current: 'Current Account',
  investment: 'Investment',
  credit: 'Credit Card',
  loan: 'Loan',
}

export default function GroupDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { currentTheme } = useTheme()
  const [group, setGroup] = useState<AccountGroup | null>(null)
  const [allAccounts, setAllAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showManageAccountsModal, setShowManageAccountsModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchGroupData = async () => {
    try {
      console.log('fetchGroupData called')
      setLoading(true)
      const groupData = await groupsService.getGroup(params.id)
      console.log('Fetched group data:', groupData)
      setGroup(groupData)

      // Fetch all accounts for the manage accounts modal
      const accountsData = await accountsService.getAccounts()
      console.log('Fetched all accounts:', accountsData)
      setAllAccounts(accountsData)
    } catch (err) {
      console.error('Error in fetchGroupData:', err)
      setError(err instanceof Error ? err.message : 'Failed to load group')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGroupData()
  }, [params.id])

  const handleDeleteGroup = async () => {
    if (!group) return
    if (!confirm(`Are you sure you want to delete "${group.name}"? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    try {
      await groupsService.deleteGroup(params.id)
      router.push('/dashboard')
    } catch (err) {
      alert('Failed to delete group. Please try again.')
      setIsDeleting(false)
    }
  }

  // Prepare chart data from balance history
  const chartData = useMemo(() => {
    if (!group?.balance_history || group.balance_history.length === 0) {
      return null
    }

    // Get primary color from theme
    const primaryColor = currentTheme?.colors?.primary || '#2d5a27'

    // Convert hex to rgba for background
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 45, g: 90, b: 39 }
    }
    const rgb = hexToRgb(primaryColor)
    const primaryBg = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`

    return {
      labels: group.balance_history.map(point => {
        const date = new Date(point.date)
        return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
      }),
      datasets: [
        {
          label: group.name,
          data: group.balance_history.map(point => point.total_balance_gbp),
          borderColor: primaryColor,
          backgroundColor: primaryBg,
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: primaryColor,
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
        },
      ],
    }
  }, [group, currentTheme])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <p className="text-red-600">{error || 'Group not found'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 text-primary hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-[#a89880] hover:text-[#3d3428] mb-4 flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
            </svg>
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold text-[#3d3428]">{group.name}</h1>
          {group.description && (
            <p className="text-[#6d5c4a] mt-2">{group.description}</p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2 rounded-lg border border-[#e5ddd3] text-[#3d3428] font-semibold hover:bg-[#faf8f5] transition-colors"
          >
            Edit Group
          </button>
          <button
            onClick={handleDeleteGroup}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isDeleting ? 'Deleting...' : 'Delete Group'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <p className="text-sm font-medium text-[#a89880] uppercase tracking-wider mb-2">Total Balance</p>
          <p className="text-3xl font-bold font-mono text-primary">
            £{group.total_balance_gbp?.toLocaleString() || '0'}
          </p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <p className="text-sm font-medium text-[#a89880] uppercase tracking-wider mb-2">Accounts</p>
          <p className="text-3xl font-bold text-[#3d3428]">
            {group.account_count || 0}
          </p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <p className="text-sm font-medium text-[#a89880] uppercase tracking-wider mb-2">Created</p>
          <p className="text-3xl font-bold text-[#3d3428]">
            {new Date(group.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Balance History Chart */}
      {chartData && (
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-[#3d3428] mb-2">Balance History</h2>
          <p className="text-sm text-[#6d5c4a] mb-4">Track your group's growth over time</p>
          <div style={{ height: 320 }}>
            <LineChart data={chartData} height={320} />
          </div>
        </div>
      )}

      {/* Accounts in Group */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-[#3d3428]">Accounts in this Group</h2>
            <p className="text-sm text-[#6d5c4a]">Manage which accounts belong to this group</p>
          </div>
          <button
            onClick={() => setShowManageAccountsModal(true)}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold transition-colors"
          >
            Manage Accounts
          </button>
        </div>

        {group.accounts && group.accounts.length > 0 ? (
          <div className="space-y-3">
            {group.accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 rounded-xl bg-[#faf8f5] border border-[#e5ddd3] hover:shadow-md transition-all duration-200"
              >
                <div className="flex-1">
                  <p className="font-semibold text-[#3d3428]">{account.account_name}</p>
                  <p className="text-sm text-[#a89880]">
                    {ACCOUNT_TYPE_LABELS[account.account_type] || account.account_type} • {account.currency?.toUpperCase() || 'GBP'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold font-mono text-primary">
                    £{account.latest_balance_gbp?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                  </p>
                  <button
                    onClick={() => router.push(`/accounts/${account.id}`)}
                    className="text-sm text-[#6d5c4a] hover:text-primary mt-1"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-[#e8ddd0] mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#a89880]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p className="text-[#6d5c4a] mb-4">No accounts in this group yet</p>
            <button
              onClick={() => setShowManageAccountsModal(true)}
              className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold transition-colors"
            >
              Add Accounts
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showEditModal && (
        <EditGroupModal
          group={group}
          onClose={() => setShowEditModal(false)}
          onSuccess={fetchGroupData}
        />
      )}

      {showManageAccountsModal && (
        <ManageAccountsModal
          groupId={group.id}
          groupName={group.name}
          groupDescription={group.description}
          currentAccounts={group.accounts || []}
          allAccounts={allAccounts}
          onClose={() => setShowManageAccountsModal(false)}
          onSuccess={fetchGroupData}
        />
      )}
    </div>
  )
}
