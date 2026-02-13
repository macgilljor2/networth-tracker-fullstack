'use client'

import React from 'react'
import Link from 'next/link'
import { SparklineChart } from '@/components/charts/sparkline-chart'
import { cn } from '@/lib/utils'
import { AccountGroupIcon } from '@/lib/icons'

export interface AccountGroup {
  id: string
  name: string
  description?: string | null
  account_count?: number
  total_balance_gbp?: number
  balance_history?: Array<{ date: string; total_balance_gbp: number }>
}

export interface AccountGroupCardProps {
  group: AccountGroup
  loading?: boolean
  showSparkline?: boolean
  href?: string
  onClick?: () => void
  className?: string
}

export const AccountGroupCard: React.FC<AccountGroupCardProps> = ({
  group,
  loading = false,
  showSparkline = false,
  href,
  onClick,
  className,
}) => {
  // Prepare sparkline data from balance history
  const sparklineData = group.balance_history?.map(h => h.total_balance_gbp) || []

  const cardContent = (
    <>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-14 h-14 rounded-xl bg-[#5a8f5a]/10 flex items-center justify-center">
            <svg className="w-7 h-7 text-[#5a8f5a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={AccountGroupIcon.content}/>
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-xl">{group.name}</h3>
            {group.description && (
              <p className="text-sm text-gray-500">{group.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-lg hover:bg-gray-100/50 transition-colors" title="Edit">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-100/50 transition-colors" title="View Details">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="mb-4">
        {loading ? (
          <div className="animate-pulse h-8 w-32 bg-gray-200 rounded"></div>
        ) : (
          <>
            <p className="text-3xl font-bold font-mono text-gray-900">
              £{group.total_balance_gbp?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </p>
            <p className="text-xs text-gray-500">
              {group.account_count || 0} {group.account_count === 1 ? 'account' : 'accounts'}
            </p>
          </>
        )}
      </div>

      {/* Mini Chart */}
      {showSparkline && sparklineData.length > 0 && !loading && (
        <div className="mb-4 h-16">
          <SparklineChart data={sparklineData} />
        </div>
      )}
    </>
  )

  if (href) {
    return (
      <Link href={href} className={cn('block', className)}>
        <div className="glass-card rounded-2xl p-6">
          {cardContent}
        </div>
      </Link>
    )
  }

  return (
    <div
      className={cn('glass-card rounded-2xl p-6', onClick && 'cursor-pointer', className)}
      onClick={onClick}
    >
      {cardContent}
    </div>
  )
}
