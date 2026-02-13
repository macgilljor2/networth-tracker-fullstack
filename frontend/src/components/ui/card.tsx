import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const cardVariants = cva(
  'rounded-lg border transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'glass-card',
        account: 'glass-card hover:shadow-md cursor-pointer',
        group: 'glass-card border-l-4 border-primary cursor-pointer',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  title?: string
  header?: React.ReactNode
  footer?: React.ReactNode
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, title, header, footer, children, onClick, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant }), className, onClick && 'cursor-pointer')}
        onClick={onClick}
        {...props}
      >
        {(title || header) && (
          <div className="px-6 py-4 border-b border-primary">
            {header || (title && <h3 className="text-lg font-semibold text-primary">{title}</h3>)}
          </div>
        )}
        <div className="px-6 py-4">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 border-t border-primary bg-secondary rounded-b-lg">
            {footer}
          </div>
        )}
      </div>
    )
  }
)

Card.displayName = 'Card'
