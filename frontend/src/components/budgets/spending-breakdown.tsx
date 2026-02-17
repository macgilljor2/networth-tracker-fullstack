import React from 'react'
import { Expense, BudgetCategory, Frequency } from '@/types/budget'

export interface SpendingBreakdownProps {
  expenses: Expense[]
  categories: BudgetCategory[]
  selectedYear: number
}

export const SpendingBreakdown: React.FC<SpendingBreakdownProps> = ({
  expenses,
  categories,
  selectedYear
}) => {
  // Calculate yearly spending by category (includes annualized monthly + yearly + one-time)
  const spendingByCategory = React.useMemo(() => {
    const categoryTotals = new Map<string, { amount: number; category: BudgetCategory }>()

    // Annualize monthly expenses (monthly × 12)
    expenses
      .filter(e => e.frequency === Frequency.MONTHLY)
      .forEach(expense => {
        if (expense.category_id) {
          const current = categoryTotals.get(expense.category_id)?.amount || 0
          const category = categories.find(c => c.id === expense.category_id)
          if (category) {
            categoryTotals.set(expense.category_id, {
              amount: current + (expense.amount * 12),  // Annualize
              category
            })
          }
        }
      })

    // Add yearly expenses (as-is)
    expenses
      .filter(e => e.frequency === Frequency.YEARLY)
      .forEach(expense => {
        if (expense.category_id) {
          const current = categoryTotals.get(expense.category_id)?.amount || 0
          const category = categories.find(c => c.id === expense.category_id)
          if (category) {
            categoryTotals.set(expense.category_id, {
              amount: current + expense.amount,
              category
            })
          }
        }
      })

    // Add one-time expenses for selected year
    expenses
      .filter(e => e.frequency === Frequency.ONE_TIME && e.effective_year === selectedYear)
      .forEach(expense => {
        if (expense.category_id) {
          const current = categoryTotals.get(expense.category_id)?.amount || 0
          const category = categories.find(c => c.id === expense.category_id)
          if (category) {
            categoryTotals.set(expense.category_id, {
              amount: current + expense.amount,
              category
            })
          }
        }
      })

    // Convert to array and calculate totals
    const breakdown = Array.from(categoryTotals.values())
    const totalSpending = breakdown.reduce((sum, item) => sum + item.amount, 0)

    // Sort by amount descending and add percentages
    return breakdown
      .sort((a, b) => b.amount - a.amount)
      .map(item => ({
        ...item,
        percentage: totalSpending > 0 ? (item.amount / totalSpending) * 100 : 0
      }))
  }, [expenses, categories, selectedYear])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (spendingByCategory.length === 0) {
    return (
      <div className="glass-card rounded-xl p-5 h-full flex items-center justify-center">
        <p className="text-sm text-muted text-center">No expenses yet for {selectedYear}</p>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-xl p-5 h-full flex flex-col">
      <h3 className="text-lg font-display font-semibold text-primary mb-4">
        Spending by Category • {selectedYear}
      </h3>

      <div className="flex-1 space-y-3">
        {spendingByCategory.map((item) => (
          <div key={item.category.id} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <span
                  className="rounded-md w-6 h-6 flex items-center justify-center text-lg"
                  style={{ backgroundColor: `${item.category.color}20` }}
                >
                  {item.category.icon}
                </span>
                <span className="font-medium text-primary">{item.category.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-muted">{formatCurrency(item.amount)}</span>
                <span className="text-xs font-semibold text-muted bg-secondary px-2 py-0.5 rounded-full">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: item.category.color
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="pt-3 mt-3 border-t border-primary/20">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-primary">Total Yearly</span>
          <span className="text-lg font-mono font-bold text-accent">
            {formatCurrency(spendingByCategory.reduce((sum, item) => sum + item.amount, 0))}
          </span>
        </div>
      </div>
    </div>
  )
}
