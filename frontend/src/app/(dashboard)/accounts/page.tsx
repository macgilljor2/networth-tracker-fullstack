'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { accountsService } from '@/lib/api/accounts.service'
import { AccountCard } from '@/components/accounts/account-card'
import { AddAccountModal } from '@/components/accounts/add-account-modal'
import { AddBalanceModal } from '@/components/accounts/add-balance-modal'
import { BulkBalanceModal } from '@/components/accounts/bulk-balance-modal'
import { Button } from '@/components/ui/button'
import { AccountWithBalances } from '@/types'

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  savings: 'Savings',
  current: 'Current Accounts',
  investment: 'Investments',
  credit: 'Credit Cards',
  loan: 'Loans',
}

type ViewMode = 'all' | 'grouped'
type LayoutMode = 'grid' | 'list'

export default function AccountsPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<AccountWithBalances[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('grouped')
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid')
  const [balanceModalAccount, setBalanceModalAccount] = useState<AccountWithBalances | null>(null)
  const [isBulkBalanceModalOpen, setIsBulkBalanceModalOpen] = useState(false)

  const fetchAccounts = async () => {
    setLoading(true)
    setError('')

    try {
      const data = await accountsService.getAccounts()
      setAccounts(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  const handleAddAccount = () => {
    setIsModalOpen(true)
  }

  const handleAccountClick = (accountId: string) => {
    router.push(`/accounts/${accountId}`)
  }

  const handleAddBalance = (account: AccountWithBalances) => {
    setBalanceModalAccount(account)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card rounded-xl p-5 h-24 animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-6 h-48 animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-card rounded-2xl p-8 border-l-4 border-accent">
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p className="text-accent font-medium">{error}</p>
        </div>
      </div>
    )
  }

  // Calculate summary statistics
  const currencies = new Set(accounts.map((a) => a.currency))

  // Group accounts by type
  const accountsByType = accounts.reduce((acc, account) => {
    const type = account.account_type || 'other'
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(account)
    return acc
  }, {} as Record<string, AccountWithBalances[]>)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold text-primary mb-2">Accounts</h1>
          <p className="text-secondary">Manage your financial accounts</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsBulkBalanceModalOpen(true)}
            className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 hover:shadow-md hover:-translate-y-0.5"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--color-primary)',
              border: '1px solid var(--color-text-secondary)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-bg)'
              e.currentTarget.style.borderColor = 'var(--color-primary-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.borderColor = 'var(--color-text-secondary)'
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>Bulk Add Balances</span>
          </button>
          <button
            onClick={handleAddAccount}
            className="btn-primary px-6 py-3 rounded-xl text-white font-semibold shadow-md hover:shadow-glow-strong transition-all duration-300 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
            </svg>
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {/* Summary Section */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-4">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-5 shadow-sm fade-in">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Total Accounts</p>
            <p className="text-3xl font-bold text-primary">{accounts.length}</p>
          </div>
          <div className="glass-card rounded-xl p-5 shadow-sm fade-in" style={{ animationDelay: '0.1s' }}>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">GBP Total</p>
            <p className="text-3xl font-bold font-mono text-primary">
              £{accounts.filter(a => a.currency === 'GBP').reduce((sum, a) => sum + (a.current_balance || 0), 0).toLocaleString()}
            </p>
          </div>
          <div className="glass-card rounded-xl p-5 shadow-sm fade-in" style={{ animationDelay: '0.2s' }}>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">USD Total</p>
            <p className="text-3xl font-bold font-mono text-accent">
              ${accounts.filter(a => a.currency === 'USD').reduce((sum, a) => sum + (a.current_balance || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* View Mode Toggle and Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-primary">Your Accounts</h2>
          <p className="text-sm text-secondary">{accounts.length} accounts</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Layout Toggle */}
          <div className="flex items-center space-x-1 bg-card rounded-lg p-1 border border-primary">
            <button
              onClick={() => setLayoutMode('grid')}
              className={`p-2 rounded-md transition-all duration-200 ${
                layoutMode === 'grid'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-secondary hover:text-primary'
              }`}
              title="Grid view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
              </svg>
            </button>
            <button
              onClick={() => setLayoutMode('list')}
              className={`p-2 rounded-md transition-all duration-200 ${
                layoutMode === 'list'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-secondary hover:text-primary'
              }`}
              title="List view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
              </svg>
            </button>
          </div>
          {/* Group By Toggle */}
          <div className="flex items-center space-x-2 bg-card rounded-lg p-1 border border-primary">
            <button
              onClick={() => setViewMode('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === 'all'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              All Together
            </button>
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === 'grouped'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              By Type
            </button>
          </div>
        </div>
      </div>

      {/* Accounts Grid/List */}
      {accounts.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <p className="text-secondary mb-4 text-lg">No accounts yet. Add your first account to get started.</p>
          <button
            onClick={handleAddAccount}
            className="btn-primary px-6 py-3 rounded-xl text-white font-semibold shadow-md hover:shadow-glow-strong transition-all duration-300"
          >
            Add Your First Account
          </button>
        </div>
      ) : viewMode === 'all' ? (
        layoutMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account, index) => (
              <div key={account.id} className="fade-in h-[200px]" style={{ animationDelay: `${index * 0.05}s` }}>
                <AccountCard
                  account={account}
                  onClick={() => handleAccountClick(account.id)}
                  onAddBalance={() => handleAddBalance(account)}
                />
              </div>
            ))}

            {/* Add Account Card */}
            <div
              onClick={handleAddAccount}
              className="glass-card rounded-2xl p-6 border-2 border-dashed hover:border-primary cursor-pointer transition-all duration-300 hover:shadow-glow flex flex-col items-center justify-center h-[200px] group fade-in"
              style={{ borderColor: 'var(--color-border)', animationDelay: `${accounts.length * 0.05}s` }}
            >
              <div className="w-14 h-14 rounded-full bg-secondary group-hover:bg-primary/10 flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110">
                <svg className="w-8 h-8 text-muted group-hover:text-primary transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                </svg>
              </div>
              <p className="text-sm font-medium text-muted group-hover:text-primary transition-colors duration-300">
                Add New Account
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map((account, index) => (
              <div
                key={account.id}
                onClick={() => handleAccountClick(account.id)}
                className="fade-in glass-card rounded-xl p-5 hover:shadow-md cursor-pointer transition-all duration-200"
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary">{account.account_name || account.name || 'Unnamed Account'}</h3>
                      <p className="text-sm text-muted capitalize">{account.account_type} • {account.currency}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold font-mono text-primary">
                      {account.currency === 'USD' ? '$' : account.currency === 'EUR' ? '€' : '£'}{account.current_balance?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      View Details →
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Account Button */}
            <div
              onClick={handleAddAccount}
              className="glass-card rounded-xl p-5 border-2 border-dashed hover:border-primary cursor-pointer transition-all duration-300 hover:shadow-glow flex items-center justify-center h-[80px] group fade-in"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-secondary group-hover:bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                  <svg className="w-5 h-5 text-muted group-hover:text-primary transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                  </svg>
                </div>
                <p className="text-sm font-medium text-muted group-hover:text-primary transition-colors duration-300">
                  Add New Account
                </p>
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="space-y-8">
          {Object.entries(accountsByType)
            .sort(([, a], [, b]) => b.length - a.length)
            .map(([type, typeAccounts], typeIndex) => (
              <div key={type} className="fade-in" style={{ animationDelay: `${typeIndex * 0.1}s` }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-primary">
                    {ACCOUNT_TYPE_LABELS[type] || type.charAt(0).toUpperCase() + type.slice(1)}
                  </h3>
                  <span className="text-sm text-muted bg-card px-3 py-1 rounded-full border border-primary">
                    {typeAccounts.length} account{typeAccounts.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {layoutMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {typeAccounts.map((account) => (
                      <div key={account.id} className="h-[200px]">
                        <AccountCard
                          account={account}
                          onClick={() => handleAccountClick(account.id)}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {typeAccounts.map((account) => (
                      <div
                        key={account.id}
                        onClick={() => handleAccountClick(account.id)}
                        className="glass-card rounded-xl p-4 hover:shadow-md cursor-pointer transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-semibold text-primary text-sm">{account.account_name || account.name || 'Unnamed Account'}</h3>
                              <p className="text-xs text-muted">{account.currency}</p>
                            </div>
                          </div>
                          <p className="text-lg font-bold font-mono text-primary">
                            {account.currency === 'USD' ? '$' : account.currency === 'EUR' ? '€' : '£'}{account.current_balance?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

          {/* Add Account Button for Grouped View */}
          <div
            onClick={handleAddAccount}
            className="glass-card rounded-2xl p-6 border-2 border-dashed hover:border-primary cursor-pointer transition-all duration-300 hover:shadow-glow flex flex-col items-center justify-center min-h-[80px] group fade-in"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-secondary group-hover:bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <svg className="w-5 h-5 text-muted group-hover:text-primary transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                </svg>
              </div>
              <p className="text-sm font-medium text-muted group-hover:text-primary transition-colors duration-300">
                Add New Account
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      <AddAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchAccounts}
      />

      {/* Add Balance Modal */}
      {balanceModalAccount && (
        <AddBalanceModal
          isOpen={!!balanceModalAccount}
          onClose={() => setBalanceModalAccount(null)}
          onSuccess={fetchAccounts}
          accountId={balanceModalAccount.id}
          accountName={balanceModalAccount.account_name || balanceModalAccount.name || 'Account'}
          accountCurrency={balanceModalAccount.currency}
        />
      )}

      {/* Bulk Balance Modal */}
      <BulkBalanceModal
        isOpen={isBulkBalanceModalOpen}
        onClose={() => setIsBulkBalanceModalOpen(false)}
        onSuccess={fetchAccounts}
        accounts={accounts}
      />
    </div>
  )
}
