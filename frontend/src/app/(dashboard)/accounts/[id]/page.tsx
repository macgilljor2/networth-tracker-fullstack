'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { accountsService } from '@/lib/api/accounts.service'
import { balancesService } from '@/lib/api/balances.service'
import { Account, Balance } from '@/types'
import { AddBalanceModal } from '@/components/accounts/add-balance-modal'
import { ImportCSVModal } from '@/components/accounts/import-csv-modal'
import { ConfigureAccountModal } from '@/components/accounts/configure-account-modal'
import { BalanceLineChart } from '@/components/charts/balance-line-chart'
import { AccountIcons } from '@/lib/icons'

export default function AccountDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const accountId = params.id
  const [account, setAccount] = useState<Account | null>(null)
  const [balances, setBalances] = useState<Balance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAddBalanceModalOpen, setIsAddBalanceModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [editingBalance, setEditingBalance] = useState<Balance | null>(null)
  const [chartPeriod, setChartPeriod] = useState<'3M' | '6M' | '1Y' | 'ALL'>('ALL')
  const [isConfigureModalOpen, setIsConfigureModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  const fetchData = async () => {
    setLoading(true)
    setError('')

    try {
      // Fetch account details
      const accountData = await accountsService.getAccount(accountId)
      setAccount(accountData)

      // Fetch balances
      const balancesData = await balancesService.getBalances(accountId)
      setBalances(balancesData)
    } catch (err: any) {
      setError(err.message || 'Failed to load account details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (accountId) {
      fetchData()
    }
  }, [accountId])

  const handleDeleteBalance = async (balanceId: string) => {
    if (!confirm('Delete this balance entry?')) return

    try {
      await balancesService.deleteBalance(accountId, balanceId)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Failed to delete balance')
    }
  }

  const handleExportCSV = () => {
    // Create CSV content
    const headers = ['date,amount']
    const rows = balances.map(b => `${b.date},${b.amount}`)
    const csvContent = [
      ...headers,
      ...rows
    ].join('\n')

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${account?.account_name || 'account'}-balances.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleImportSuccess = () => {
    fetchData()
    setIsImportModalOpen(false)
  }

  const handleAddBalanceSuccess = () => {
    fetchData()
  }

  const handleEditBalance = (balance: Balance) => {
    setEditingBalance(balance)
  }

  const handleUpdateBalance = async (data?: { amount: number; date: string }) => {
    if (!editingBalance || !data) return

    try {
      await balancesService.updateBalance(accountId, editingBalance.id, {
        amount: data.amount,
        date: data.date,
      })
      setEditingBalance(null)
      fetchData()
    } catch (err: any) {
      throw err // Re-throw to let modal handle the error
    }
  }

  // Always sort by date DESC, then created_at DESC
  const sortedBalances = useMemo(() => {
    return [...balances].sort((a, b) => {
      const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime()
      if (dateCompare !== 0) return dateCompare
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [balances])

  // Pagination
  const totalPages = Math.ceil(sortedBalances.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedBalances = sortedBalances.slice(startIndex, endIndex)

  // Reset to page 1 when items per page changes
  useEffect(() => {
    setCurrentPage(1)
  }, [itemsPerPage])

  // Calculate change from previous entry (next in sorted array)
  const calculateChange = (balance: Balance, indexInPaginated: number) => {
    const actualIndex = startIndex + indexInPaginated
    if (actualIndex >= sortedBalances.length - 1) return null
    const current = balance.amount
    const previous = sortedBalances[actualIndex + 1].amount
    return current - previous
  }

  // Prepare chart data from sorted balances
  const chartData = useMemo(() => {
    const today = new Date()
    let cutoffDate: Date | null = null

    switch (chartPeriod) {
      case '3M':
        cutoffDate = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate())
        break
      case '6M':
        cutoffDate = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate())
        break
      case '1Y':
        cutoffDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
        break
      case 'ALL':
      default:
        cutoffDate = null
        break
    }

    // Reverse for chart (oldest to newest) and filter by period
    const chartBalances = [...sortedBalances]
      .reverse()
      .filter(b => !cutoffDate || new Date(b.date) >= cutoffDate)

    return chartBalances.map(b => ({
      date: b.date,
      created_at: b.date,
      balance: b.amount
    }))
  }, [sortedBalances, chartPeriod])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse h-48 bg-gray-200 rounded-2xl"></div>
        <div className="animate-pulse h-96 bg-gray-200 rounded-2xl"></div>
      </div>
    )
  }

  if (error && !account) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (!account) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <p className="text-gray-500">Account not found</p>
      </div>
    )
  }

  const currencySymbol = account.currency === 'USD' ? '$' : account.currency === 'EUR' ? '€' : '£'
  const stats = account.stats

  return (
    <div className="space-y-8">
      {/* Back Navigation */}
      <div>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-sm text-[#5a5a5a] hover:text-primary transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Accounts
        </button>
      </div>

      {/* Account Header */}
      <div className="glass-card rounded-2xl p-8">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center space-x-5">
            <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center">
              {(() => {
                const icon = AccountIcons[account.account_type as keyof typeof AccountIcons] || AccountIcons.default
                return icon.type === 'text' ? (
                  <span className="text-3xl font-bold text-white">{icon.content}</span>
                ) : (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon.content} />
                  </svg>
                )
              })()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">{account.account_name || 'Account'}</h1>
              <div className="flex items-center space-x-3 text-sm text-[#5a5a5a]">
                <span className="px-3 py-1 bg-[#faf9f6] rounded-lg font-medium capitalize">{account.account_type}</span>
                <span>•</span>
                <span className="text-primary font-medium">{account.currency}</span>
                <span>•</span>
                <span>Updated {balances.length > 0 ? 'today' : 'never'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsAddBalanceModalOpen(true)}
              className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium shadow-md hover:shadow-lg transition-all"
            >
              + Add Balance
            </button>
            <button
              onClick={() => setIsConfigureModalOpen(true)}
              className="px-5 py-2.5 rounded-lg border border-[#d5d9d0] hover:border-primary hover:bg-[#faf9f6] text-[#1a1a1a] font-medium transition-all"
            >
              Configure
            </button>
          </div>
        </div>

        {/* Balance Display */}
        <div className="text-center py-8 bg-[#faf9f6] rounded-xl mb-6">
          <p className="text-sm text-[#5a5a5a] uppercase tracking-wider mb-3">Current Balance</p>
          <p className="text-6xl font-bold text-[#1a1a1a] font-mono mb-4">
            {currencySymbol}{(account.current_balance ?? 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-[#d5d9d0]">
            <p className="text-xs text-[#5a5a5a] mb-2">This Month</p>
            <p className="text-xl font-semibold font-mono text-[#1a1a1a]">
              {stats ? `${stats.this_month_change >= 0 ? '+' : ''}${currencySymbol}${stats.this_month_change.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
            </p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-[#d5d9d0]">
            <p className="text-xs text-[#5a5a5a] mb-2">3 Month Change</p>
            <p className="text-xl font-semibold font-mono text-primary">
              {stats ? `${stats.three_month_change_amount >= 0 ? '+' : ''}${currencySymbol}${stats.three_month_change_amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
            </p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-[#d5d9d0]">
            <p className="text-xs text-[#5a5a5a] mb-2">6 Month Change</p>
            <p className="text-xl font-semibold font-mono text-primary">
              {stats ? `${stats.six_month_change_amount >= 0 ? '+' : ''}${currencySymbol}${stats.six_month_change_amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Balance History Chart */}
      <div className="glass-card rounded-2xl px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-[#1a1a1a]">Balance History</h2>
            <p className="text-sm text-[#5a5a5a]">Track your balance over time</p>
          </div>
          <div className="flex items-center space-x-2">
            {(['3M', '6M', '1Y', 'ALL'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setChartPeriod(period)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  chartPeriod === period
                    ? 'bg-primary text-white'
                    : 'bg-[#faf9f6] text-[#5a5a5a] hover:bg-[#d5d9d0]'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        <div className="h-72">
          <BalanceLineChart data={chartData} currency={account.currency} />
        </div>
      </div>

      {/* Balance Entries Table */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-[#1a1a1a]">Balance Entries</h2>
            <p className="text-sm text-[#5a5a5a]">Manage and edit your balance submissions</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-[#d5d9d0] text-[#1a1a1a] hover:bg-[#faf9f6] transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>Import CSV</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-[#d5d9d0] text-[#1a1a1a] hover:bg-[#faf9f6] transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => setIsAddBalanceModalOpen(true)}
              className="w-9 h-9 rounded-lg bg-primary hover:bg-primary-hover text-white flex items-center justify-center transition-colors shadow-sm hover:shadow-md"
              title="Add balance entry"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-4 text-left text-xs font-semibold text-[#5a5a5a] uppercase tracking-wider border-b border-[#d5d9d0]">
                  Date
                </th>
                <th className="p-4 text-left text-xs font-semibold text-[#5a5a5a] uppercase tracking-wider border-b border-[#d5d9d0]">
                  Balance
                </th>
                <th className="p-4 text-left text-xs font-semibold text-[#5a5a5a] uppercase tracking-wider border-b border-[#d5d9d0]">
                  Change
                </th>
                <th className="p-4 text-right text-xs font-semibold text-[#5a5a5a] uppercase tracking-wider border-b border-[#d9d0]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedBalances.map((balance, index) => {
                const change = calculateChange(balance, index)
                return (
                  <tr key={balance.id} className="hover:bg-[#faf9f6] transition-colors">
                    <td className="p-4 text-[#1a1a1a] font-mono text-sm">{balance.date}</td>
                    <td className="p-4 text-[#1a1a1a] font-mono font-semibold text-primary text-sm">
                      {currencySymbol}{balance.amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-sm">
                      {change !== null ? (
                        <span className={`font-mono ${change >= 0 ? 'text-primary' : 'text-[#c17f59]'}`}>
                          {change >= 0 ? '↑' : '↓'} {currencySymbol}{Math.abs(change).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-[#5a5a5a]">—</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => handleEditBalance(balance)}
                          className="p-2 rounded hover:bg-primary/10 transition-colors group inline-flex"
                          title="Edit"
                        >
                          <svg className="w-4 h-4 text-[#5a5a5a] group-hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteBalance(balance.id)}
                          className="p-2 rounded hover:bg-red-50 transition-colors group inline-flex"
                          title="Delete"
                        >
                          <svg className="w-4 h-4 text-[#5a5a5a] group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {sortedBalances.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-[#5a5a5a]">
                    <div className="flex flex-col items-center space-y-3">
                      <svg className="w-12 h-12 text-[#a89880]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p>No balance entries found.</p>
                      <button
                        onClick={() => setIsAddBalanceModalOpen(true)}
                        className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors"
                      >
                        Add your first balance
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {sortedBalances.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-[#5a5a5a]">
              <span>Rows per page:</span>
              <div className="relative">
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="appearance-none px-3 py-1.5 pr-8 rounded-lg border border-[#d5d9d0] bg-white text-[#1a1a1a] text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={12}>12</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-[#a89880]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-sm text-[#5a5a5a]">
              <span>
                {startIndex + 1}-{Math.min(endIndex, sortedBalances.length)} of {sortedBalances.length}
              </span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded hover:bg-[#faf9f6] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Previous page"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded hover:bg-[#faf9f6] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Next page"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Add Balance Modal */}
      <AddBalanceModal
        isOpen={isAddBalanceModalOpen}
        onClose={() => setIsAddBalanceModalOpen(false)}
        onSuccess={handleAddBalanceSuccess}
        accountId={accountId}
        accountName={account.account_name || 'Account'}
        accountCurrency={account.currency}
      />

      {/* Import CSV Modal */}
      <ImportCSVModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={handleImportSuccess}
        accountId={accountId}
        currency={account.currency}
      />

      {/* Configure Account Modal */}
      {account && (
        <ConfigureAccountModal
          isOpen={isConfigureModalOpen}
          onClose={() => setIsConfigureModalOpen(false)}
          onSuccess={fetchData}
          account={account}
        />
      )}

      {/* Edit Balance Modal */}
      {editingBalance && (
        <AddBalanceModal
          isOpen={!!editingBalance}
          onClose={() => setEditingBalance(null)}
          onSuccess={handleUpdateBalance}
          accountId={accountId}
          accountName={account.account_name || 'Account'}
          accountCurrency={account.currency}
          initialBalance={editingBalance}
        />
      )}
    </div>
  )
}
