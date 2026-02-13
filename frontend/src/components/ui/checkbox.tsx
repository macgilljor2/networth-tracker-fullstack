import React from 'react'
import { useId } from 'react'
import { cn } from '@/lib/utils'

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const generatedId = useId()
    const checkboxId = id || generatedId

    return (
      <label className="flex items-center cursor-pointer">
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          className={cn(
            'w-4 h-4 rounded border-[#d5ccc0] bg-[#e8ddd0] text-[#5a8f5a]',
            'focus:ring-2 focus:ring-[#5a8f5a]/20 focus:ring-offset-0',
            'checked:bg-[#5a8f5a] checked:border-[#5a8f5a]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-all duration-200',
            className
          )}
          {...props}
        />
        {label && (
          <span className="ml-2 text-sm font-medium text-[#6d5c4a]">
            {label}
          </span>
        )}
      </label>
    )
  }
)

Checkbox.displayName = 'Checkbox'
