import React from 'react'
import { Modal } from '@/components/ui/modal'
import { BudgetCategory, Expense, Frequency } from '@/types/budget'

export interface CategoryDetailModalProps {
  isOpen: boolean
  onClose: () => void
  category: BudgetCategory
  expenses: Expense[]
  onEdit: () => void
  onDelete: () => void
}

export const CategoryDetailModal: React.FC<CategoryDetailModalProps> = ({
  isOpen,
  onClose,
  category,
  expenses,
  onEdit,
  onDelete
}) => {
  // Filter expenses for this category
  const categoryExpenses = expenses.filter(e => e.category_id === category.id)

  // Calculate totals
  const monthlyTotal = categoryExpenses
    .filter(e => e.frequency === Frequency.MONTHLY)
    .reduce((sum, e) => sum + e.amount, 0)

  const yearlyTotal = categoryExpenses
    .filter(e => e.frequency === Frequency.YEARLY)
    .reduce((sum, e) => sum + e.amount, 0)

  const annualizedMonthly = monthlyTotal * 12
  const totalYearlyCost = annualizedMonthly + yearlyTotal

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={category.name}>
      <div className="space-y-6">
        {/* Category Info Header */}
        <div className="flex items-center justify-between pb-4 border-b border-primary/20">
          <div className="flex items-center space-x-3">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: `${category.color}20` }}
            >
              {category.icon}
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-primary">{category.name}</h2>
              {category.is_essential && (
                <span className="inline-block mt-1 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-semibold">
                  Essential
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Monthly</p>
            <p className="text-2xl font-mono font-bold text-accent">
              {formatCurrency(monthlyTotal)}
            </p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Yearly Total</p>
            <p className="text-2xl font-mono font-bold text-primary">
              {formatCurrency(totalYearlyCost)}
            </p>
          </div>
        </div>

        {/* Expenses List */}
        <div>
          <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
            Expenses ({categoryExpenses.length})
          </h3>
          {categoryExpenses.length === 0 ? (
            <div className="glass-card rounded-xl p-6 text-center">
              <p className="text-muted text-sm">No expenses in this category yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {categoryExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      expense.frequency === Frequency.MONTHLY
                        ? 'bg-blue-100/50 text-blue-600'
                        : 'bg-purple-100/50 text-purple-600'
                    }`}>
                      {expense.frequency === Frequency.MONTHLY ? 'M' : 'Y'}
                    </span>
                    <span className="text-sm font-medium text-primary">
                      {expense.description}
                    </span>
                  </div>
                  <span className="text-sm font-mono font-semibold text-muted">
                    {formatCurrency(expense.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={onEdit}
            className="px-6 py-3 rounded-xl font-semibold bg-primary/10 hover:bg-primary/20 text-primary transition-all duration-200"
          >
            Configure
          </button>
          <button
            onClick={onDelete}
            className="px-6 py-3 rounded-xl font-semibold bg-accent hover:bg-accent/80 text-white transition-all duration-200"
          >
            Delete Category
          </button>
        </div>
      </div>
    </Modal>
  )
}
