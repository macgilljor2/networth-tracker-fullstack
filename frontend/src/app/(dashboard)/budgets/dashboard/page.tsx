'use client'

import React, { useState, useEffect } from 'react'
import { budgetDashboardService } from '@/lib/api/budgets.service'
import { BudgetSummary } from '@/types/budget'
import { Button } from '@/components/ui/button'
import { BudgetCategoryModal } from '@/components/budgets/budget-category-modal'
import { IncomeModal } from '@/components/budgets/income-modal'
import { ExpenseModal } from '@/components/budgets/expense-modal'

export default function BudgetDashboardPage() {
  const [summary, setSummary] = useState<BudgetSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [incomeModalOpen, setIncomeModalOpen] = useState(false)
  const [expenseModalOpen, setExpenseModalOpen] = useState(false)

  const fetchSummary = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await budgetDashboardService.getCurrentMonthSummary()
      setSummary(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load budget summary')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    return months[month - 1]
  }

  // Empty State - No budget data at all
  const isEmpty = summary && summary.total_income === 0 && summary.total_expenses === 0

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-display font-bold text-primary mb-2 fade-in">
              Budget Dashboard
            </h1>
            <p className="text-secondary fade-in" style={{ animationDelay: '0.1s' }}>
              Track income and expenses
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card rounded-xl p-6 h-32 animate-pulse fade-in" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-card rounded-2xl p-8 border-l-4 border-accent fade-in">
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-accent font-medium">{error}</p>
        </div>
      </div>
    )
  }

  if (!summary) return null

  const isPositive = summary.surplus_deficit >= 0
  const hasData = summary.total_income > 0 || summary.total_expenses > 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between fade-in">
        <div>
          <h1 className="text-4xl font-display font-bold text-primary mb-2">
            Budget Dashboard
          </h1>
          <p className="text-secondary">
            {getMonthName(summary.month)} {summary.year}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => setIncomeModalOpen(true)}
            className="glass-card px-4 py-2 rounded-xl font-medium hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Income
          </Button>
          <Button
            variant="secondary"
            onClick={() => setExpenseModalOpen(true)}
            className="glass-card px-4 py-2 rounded-xl font-medium hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Expense
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {!hasData && (
        <div className="glass-card rounded-2xl p-12 text-center fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="w-20 h-20 rounded-full bg-primary/10 mx-auto mb-6 flex items-center justify-center">
            <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-display font-semibold text-primary mb-3">
            Start Tracking Your Budget
          </h2>
          <p className="text-secondary mb-8 max-w-md mx-auto">
            Create categories and add your income and expenses to gain insights into your spending habits.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Button
              onClick={() => setCategoryModalOpen(true)}
              className="btn-primary px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-glow-strong transition-all duration-300 hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Create Categories
            </Button>
            <Button
              onClick={() => setIncomeModalOpen(true)}
              variant="secondary"
              className="glass-card px-6 py-3 rounded-xl font-semibold hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
            >
              Add Income
            </Button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {hasData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Income Card */}
          <div className="glass-card rounded-xl p-6 fade-in hover:shadow-md transition-all duration-300" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Income
              </span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-display font-bold text-primary">
              {formatCurrency(summary.total_income)}
            </p>
          </div>

          {/* Expenses Card */}
          <div className="glass-card rounded-xl p-6 fade-in hover:shadow-md transition-all duration-300" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Expenses
              </span>
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-display font-bold text-accent">
              {formatCurrency(summary.total_expenses)}
            </p>
          </div>

          {/* Surplus/Deficit Card */}
          <div className="glass-card rounded-xl p-6 fade-in hover:shadow-md transition-all duration-300" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                {isPositive ? 'Surplus' : 'Deficit'}
              </span>
              <div className={`w-8 h-8 rounded-lg ${isPositive ? 'bg-primary/10' : 'bg-accent/10'} flex items-center justify-center`}>
                <svg className={`w-4 h-4 ${isPositive ? 'text-primary' : 'text-accent'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isPositive ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  )}
                </svg>
              </div>
            </div>
            <p className={`text-3xl font-display font-bold ${isPositive ? 'text-primary' : 'text-accent'}`}>
              {formatCurrency(Math.abs(summary.surplus_deficit))}
            </p>
          </div>

          {/* Savings Rate Card */}
          <div className="glass-card rounded-xl p-6 fade-in hover:shadow-md transition-all duration-300" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Savings Rate
              </span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-display font-bold text-primary">
              {summary.savings_rate.toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Expense Breakdown */}
      {hasData && summary.expense_breakdown.length > 0 && (
        <div className="glass-card rounded-2xl p-8 fade-in" style={{ animationDelay: '0.5s' }}>
          <h2 className="text-xl font-display font-semibold text-primary mb-6">
            Expense Breakdown
          </h2>
          <div className="space-y-5">
            {summary.expense_breakdown.map((item, index) => (
              <div key={item.category_name} className="fade-in" style={{ animationDelay: `${0.6 + index * 0.1}s` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-primary">{item.category_name}</span>
                  <span className="text-sm font-mono text-secondary">
                    {formatCurrency(item.amount)} ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: 'var(--color-primary)'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {hasData && (
        <div className="glass-card rounded-2xl p-6 fade-in" style={{ animationDelay: '0.7s' }}>
          <h3 className="text-lg font-display font-semibold text-primary mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setCategoryModalOpen(true)}
              className="glass-card rounded-xl p-4 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary">New Category</p>
                  <p className="text-xs text-muted">Create expense category</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setIncomeModalOpen(true)}
              className="glass-card rounded-xl p-4 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary">Add Income</p>
                  <p className="text-xs text-muted">Track income sources</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setExpenseModalOpen(true)}
              className="glass-card rounded-xl p-4 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-accent">Add Expense</p>
                  <p className="text-xs text-muted">Log your expenses</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <BudgetCategoryModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onSuccess={fetchSummary}
      />
      <IncomeModal
        isOpen={incomeModalOpen}
        onClose={() => setIncomeModalOpen(false)}
        onSuccess={fetchSummary}
      />
      <ExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onSuccess={fetchSummary}
      />
    </div>
  )
}
