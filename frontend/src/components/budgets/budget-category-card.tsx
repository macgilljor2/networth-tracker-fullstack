import React from 'react'
import { BudgetCategory } from '@/types/budget'

export interface BudgetCategoryCardProps {
  category: BudgetCategory
  onClick?: () => void
}

export const BudgetCategoryCard: React.FC<BudgetCategoryCardProps> = ({
  category,
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className="glass-card rounded-2xl p-6 hover:shadow-md transition-all duration-200 cursor-pointer"
      style={{
        borderLeft: `4px solid ${category.color || 'var(--color-primary)'}`
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {category.icon && (
            <span className="text-3xl">{category.icon}</span>
          )}
          <div>
            <h3 className="font-semibold text-primary">{category.name}</h3>
            {category.is_essential && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                Essential
              </span>
            )}
          </div>
        </div>
      </div>
      {category.description && (
        <p className="text-sm text-secondary">{category.description}</p>
      )}
    </div>
  )
}
