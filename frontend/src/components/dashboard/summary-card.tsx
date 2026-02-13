import React from 'react'
import { cn } from '@/lib/utils'

export interface SummaryCardProps {
  title: string
  value: string | number
  subtitle?: string
  variant?: 'default' | 'green' | 'beige'
  loading?: boolean
  icon?: React.ReactNode
  className?: string
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  variant = 'default',
  loading = false,
  icon,
  className,
}) => {
  const variantStyles = {
    default: 'bg-white border-gray-200',
    green: 'bg-green-50 border-green-200',
    beige: 'bg-beige-50 border-beige-200',
  }

  return (
    <div
      className={cn(
        'glass-card rounded-2xl p-8 shadow-sm fade-in',
        variant === 'green' && 'hover:shadow-glow transition-all duration-300',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          {loading ? (
            <div className="animate-pulse h-8 w-32 bg-gray-200 rounded"></div>
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {subtitle && (
                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
              )}
            </>
          )}
        </div>
        {icon && (
          <div className="ml-4 text-green-600 opacity-80">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
