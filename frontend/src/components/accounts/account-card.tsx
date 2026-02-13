import React from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AccountIcons, type IconType } from '@/lib/icons'

export interface Account {
  id: string
  name?: string
  account_name?: string
  account_type: string
  currency: string
  current_balance?: number
  balance_count?: number
  is_excluded_from_totals?: boolean
}

export interface AccountCardProps {
  account: Account
  loading?: boolean
  href?: string
  onClick?: () => void
  onAddBalance?: () => void
  className?: string
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  loading = false,
  href,
  onClick,
  onAddBalance,
  className,
}) => {
  const displayName = account.account_name || account.name || 'Unnamed Account'

  const formatBalance = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const handleAddBalanceClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onAddBalance?.()
  }

  // Get account type styling
  const getAccountTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'savings':
        return { bg: 'var(--color-primary-bg)', text: 'var(--color-primary)', border: 'var(--color-primary)' }
      case 'investment':
        return { bg: 'rgba(125, 132, 113, 0.2)', text: '#7d8471', border: 'rgba(125, 132, 113, 0.3)' }
      case 'current':
        return { bg: 'var(--color-accent-bg)', text: 'var(--color-accent)', border: 'var(--color-accent)' }
      case 'credit':
      case 'loan':
        return { bg: 'var(--color-accent-bg)', text: 'var(--color-accent)', border: 'var(--color-accent)' }
      default:
        // Custom types - generate a soft muted color based on name
        const hash = type.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        const hue = hash % 360
        return {
          bg: `hsl(${hue}, 25%, 25%)`,
          text: `hsl(${hue}, 30%, 40%)`,
          border: `hsl(${hue}, 30%, 30%)`
        }
    }
  }

  // Get currency badge styling
  const getCurrencyBadgeStyle = (currency: string) => {
    switch (currency) {
      case 'GBP':
        return { bg: 'var(--color-primary-bg)', text: 'var(--color-primary)' }
      case 'USD':
        return { bg: 'var(--color-accent-bg)', text: 'var(--color-accent)' }
      case 'EUR':
        return { bg: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6' }
      default:
        return { bg: 'var(--color-text-muted)', text: 'var(--color-text-muted)' }
    }
  }

  const typeColor = getAccountTypeColor(account.account_type)
  const currencyBadge = getCurrencyBadgeStyle(account.currency)
  const iconContent = AccountIcons[account.account_type as keyof typeof AccountIcons] || AccountIcons.default

  const cardContent = (
    <>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
            style={{ backgroundColor: typeColor.bg }}
          >
            {iconContent.type === 'text' ? (
              <span className="text-2xl font-bold" style={{ color: typeColor.text }}>
                {iconContent.content}
              </span>
            ) : (
              <svg
                className="w-6 h-6 transition-colors duration-300"
                style={{ color: typeColor.text }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={iconContent.content}/>
              </svg>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors duration-300" style={{ color: 'var(--color-text-primary)' }}>
              {displayName}
            </h3>
            <p className="text-xs capitalize" style={{ color: 'var(--color-text-muted)' }}>{account.account_type}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {account.is_excluded_from_totals && (
            <div className="p-2 rounded-lg border border-red-300 bg-red-50" title="Excluded from totals" style={{ opacity: 1 }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#dc2626' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
          )}
          <span
            className="text-xs font-semibold px-2 py-1 rounded-md uppercase tracking-wide"
            style={{
              backgroundColor: currencyBadge.bg,
              color: currencyBadge.text
            }}
          >
            {account.currency}
          </span>
        </div>
      </div>

      <div className="mb-4">
        {loading ? (
          <div className="animate-pulse h-8 w-40 rounded" style={{ backgroundColor: 'var(--color-border)' }}></div>
        ) : (
          <>
            <p className="text-3xl font-bold font-mono" style={{ color: 'var(--color-text-primary)' }}>
              {account.current_balance !== undefined
                ? formatBalance(account.current_balance, account.currency)
                : '—'}
            </p>
            {account.balance_count !== undefined && account.balance_count > 0 && (
              <span
                className="inline-flex items-center px-2 py-1 rounded-lg text-xs mt-2"
                style={{ backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary)' }}
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {account.balance_count} balance{account.balance_count !== 1 ? 's' : ''} tracked
              </span>
            )}
          </>
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span style={{ color: 'var(--color-text-muted)' }}>Last updated: Today</span>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleAddBalanceClick}
            className="p-2 rounded-lg text-primary hover:text-primary-hover transition-colors"
            style={{ backgroundColor: 'transparent' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-bg)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Add Balance"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  )

  if (href) {
    return (
      <Link href={href} className="block group">
        <Card variant="account" className="h-full group-hover:shadow-glow transition-all duration-300">
          {cardContent}
        </Card>
      </Link>
    )
  }

  return (
    <Card
      variant="account"
      onClick={onClick}
      className={cn('h-full group hover:shadow-glow transition-all duration-300', onClick && 'cursor-pointer', className)}
    >
      {cardContent}
    </Card>
  )
}

function cn(...classes: (string | undefined | boolean)[]) {
  return classes.filter(Boolean).join(' ')
}
