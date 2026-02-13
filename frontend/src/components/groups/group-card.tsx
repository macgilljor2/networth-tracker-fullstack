import React from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { SparklineChart } from '@/components/charts/sparkline-chart'
import { cn } from '@/lib/utils'

export interface Group {
  id: string
  name: string
  description: string | null
  _account_count?: number
  _total_balance?: number
}

export interface GroupCardProps {
  group: Group
  loading?: boolean
  showSparkline?: boolean
  sparklineData?: number[]
  onClick?: () => void
  href?: string
  className?: string
}

export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  loading = false,
  showSparkline = false,
  sparklineData,
  onClick,
  href,
  className,
}) => {
  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const cardContent = (
    <>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {group.name}
          </h3>
          {group.description && (
            <p className="text-sm text-gray-500">{group.description}</p>
          )}
        </div>

        {showSparkline && sparklineData && (
          <SparklineChart data={sparklineData} size="lg" />
        )}
      </div>

      <div className="space-y-1">
        {loading ? (
          <>
            <div className="animate-pulse h-4 w-24 bg-gray-200 rounded"></div>
            <div className="animate-pulse h-6 w-32 bg-gray-200 rounded"></div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500">
              {group._account_count || 0} {group._account_count === 1 ? 'account' : 'accounts'}
            </p>
            <p className="text-2xl font-bold font-mono text-gray-900">
              {group._total_balance !== undefined
                ? formatBalance(group._total_balance)
                : '—'}
            </p>
          </>
        )}
      </div>
    </>
  )

  if (href) {
    return (
      <Link href={href} className={cn('block', className)}>
        <Card variant="group" className="h-full">
          {cardContent}
        </Card>
      </Link>
    )
  }

  return (
    <Card
      variant="group"
      onClick={onClick}
      className={cn('h-full', onClick && 'cursor-pointer', className)}
    >
      {cardContent}
    </Card>
  )
}
