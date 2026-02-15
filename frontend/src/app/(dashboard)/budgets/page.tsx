'use client'

import React, { useState, useEffect } from 'react'
import { budgetDashboardService, budgetCategoriesService, incomeService, expensesService } from '@/lib/api/budgets.service'
import { BudgetSummary, BudgetCategory, Income, Expense, Frequency } from '@/types/budget'
import { BudgetCategoryModal } from '@/components/budgets/budget-category-modal'
import { IncomeModal } from '@/components/budgets/income-modal'
import { ExpenseModal } from '@/components/budgets/expense-modal'

export default function BudgetsPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [summary, setSummary] = useState<BudgetSummary | null>(null)
  const [yearlySummary, setYearlySummary] = useState<{
    year: number
    total_income: number
    total_expenses: number
    surplus_deficit: number
    savings_rate: number
  } | null>(null)
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [income, setIncome] = useState<Income[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modals
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [incomeModalOpen, setIncomeModalOpen] = useState(false)
  const [expenseModalOpen, setExpenseModalOpen] = useState(false)
  const [incomeModalFrequency, setIncomeModalFrequency] = useState<Frequency | undefined>()
  const [expenseModalFrequency, setExpenseModalFrequency] = useState<Frequency | undefined>()
  const [incomeToEdit, setIncomeToEdit] = useState<Income | undefined>()
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | undefined>()
  const [initialCategoryId, setInitialCategoryId] = useState<string | undefined>()
  const [itemToDelete, setItemToDelete] = useState<{type: 'income' | 'expense' | 'category', id: string} | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [summaryData, categoriesData, incomeData, expensesData, yearlyData] = await Promise.all([
        budgetDashboardService.getCurrentMonthSummary(),
        budgetCategoriesService.getCategories(),
        incomeService.getIncome(),
        expensesService.getExpenses(),
        budgetDashboardService.getYearlySummary(selectedYear),
      ])
      setSummary(summaryData)
      setCategories(categoriesData)
      setIncome(incomeData)
      setExpenses(expensesData)
      setYearlySummary(yearlyData)
    } catch (err: any) {
      setError(err.message || 'Failed to load budget data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedYear])


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const currentDate = new Date()
  const currentMonth = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  const recurringIncome = income.filter(i => i.frequency === Frequency.MONTHLY || i.frequency === Frequency.YEARLY)
  const recurringExpenses = expenses.filter(e => e.frequency === Frequency.MONTHLY || e.frequency === Frequency.YEARLY)
  const oneTimeIncome = income.filter(i => i.frequency === Frequency.ONE_TIME && i.effective_year === selectedYear)
  const oneTimeExpenses = expenses.filter(e => e.frequency === Frequency.ONE_TIME && e.effective_year === selectedYear)

  // Group expenses by category
  const expensesByCategory = categories.map(cat => {
    const catExpenses = recurringExpenses.filter(e => e.category_id === cat.id)
    const monthlyTotal = catExpenses.filter(e => e.frequency === Frequency.MONTHLY).reduce((sum, e) => sum + e.amount, 0)
    const yearlyTotal = catExpenses.filter(e => e.frequency === Frequency.YEARLY).reduce((sum, e) => sum + e.amount, 0)
    const annualizedMonthly = monthlyTotal * 12
    const totalYearlyCost = annualizedMonthly + yearlyTotal
    return {
      ...cat,
      expenses: catExpenses,
      monthlyTotal,
      yearlyTotal,
      totalYearlyCost
    }
  }).filter(cat => cat.expenses.length > 0)

  // Uncategorized expenses
  const uncategorizedExpenses = recurringExpenses.filter(e => !e.category_id)
  const uncategorizedMonthlyTotal = uncategorizedExpenses.filter(e => e.frequency === Frequency.MONTHLY).reduce((sum, e) => sum + e.amount, 0)
  const uncategorizedYearlyTotal = uncategorizedExpenses.filter(e => e.frequency === Frequency.YEARLY).reduce((sum, e) => sum + e.amount, 0)
  const uncategorizedTotalYearlyCost = (uncategorizedMonthlyTotal * 12) + uncategorizedYearlyTotal

  const totalMonthlyIncome = recurringIncome.reduce((sum, i) => sum + (i.frequency === Frequency.MONTHLY ? i.amount : 0), 0)
  const totalMonthlyExpenses = recurringExpenses.reduce((sum, e) => sum + (e.frequency === Frequency.MONTHLY ? e.amount : 0), 0)
  const savings = totalMonthlyIncome - totalMonthlyExpenses
  const savingsRate = totalMonthlyIncome > 0 ? (savings / totalMonthlyIncome) * 100 : 0

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-primary mb-2">Budgets</h1>
          <p className="text-secondary">{currentMonth}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card rounded-xl p-5 h-28 animate-pulse fade-in" style={{ animationDelay: `${i * 0.05}s` }} />
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold text-primary mb-2">Budgets</h1>
          <p className="text-lg font-display text-secondary">{currentMonth}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedYear(selectedYear - 1)}
            className="w-10 h-10 rounded-xl glass-card flex items-center justify-center hover:bg-primary/10 transition-all duration-200 hover:scale-105"
          >
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="glass-card rounded-xl px-6 py-2 min-w-[100px] text-center">
            <p className="text-3xl font-mono font-bold text-primary">{selectedYear}</p>
          </div>
          <button
            onClick={() => setSelectedYear(selectedYear + 1)}
            disabled={selectedYear >= new Date().getFullYear()}
            className="w-10 h-10 rounded-xl glass-card flex items-center justify-center hover:bg-primary/10 transition-all duration-200 hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Yearly Summary */}
      {yearlySummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card rounded-xl p-5 fade-in" style={{ animationDelay: '0.03s' }}>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Yearly Income</p>
            <p className="text-2xl font-mono font-bold text-primary">{formatCurrency(yearlySummary.total_income)}</p>
          </div>
          <div className="glass-card rounded-xl p-5 fade-in" style={{ animationDelay: '0.06s' }}>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Yearly Expenses</p>
            <p className="text-2xl font-mono font-bold text-accent">{formatCurrency(yearlySummary.total_expenses)}</p>
          </div>
          <div className="glass-card rounded-xl p-5 fade-in" style={{ animationDelay: '0.09s' }}>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Yearly Savings</p>
            <p className={`text-2xl font-mono font-bold ${yearlySummary.surplus_deficit >= 0 ? 'text-primary' : 'text-accent'}`}>
              {formatCurrency(Math.abs(yearlySummary.surplus_deficit))}
            </p>
          </div>
          <div className="glass-card rounded-xl p-5 fade-in" style={{ animationDelay: '0.12s' }}>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Yearly Savings Rate</p>
            <p className="text-2xl font-mono font-bold text-primary">{yearlySummary.savings_rate.toFixed(1)}%</p>
          </div>
        </div>
      )}

      {/* Monthly Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5 fade-in" style={{ animationDelay: '0.15s' }}>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Monthly Income</p>
          <p className="text-2xl font-mono font-bold text-primary">{formatCurrency(totalMonthlyIncome)}</p>
        </div>
        <div className="glass-card rounded-xl p-5 fade-in" style={{ animationDelay: '0.18s' }}>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Monthly Expenses</p>
          <p className="text-2xl font-mono font-bold text-accent">{formatCurrency(totalMonthlyExpenses)}</p>
        </div>
        <div className="glass-card rounded-xl p-5 fade-in" style={{ animationDelay: '0.21s' }}>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Monthly Savings</p>
          <p className={`text-2xl font-mono font-bold ${savings >= 0 ? 'text-primary' : 'text-accent'}`}>
            {formatCurrency(Math.abs(savings))}
          </p>
        </div>
        <div className="glass-card rounded-xl p-5 fade-in" style={{ animationDelay: '0.24s' }}>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Monthly Savings Rate</p>
          <p className="text-2xl font-mono font-bold text-primary">{savingsRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Two Column Layout - Income & Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Income */}
        <div className="space-y-6">
          {/* Recurring Income */}
          <div className="glass-card rounded-xl p-5 fade-in" style={{ animationDelay: '0.25s' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-semibold text-primary">Recurring Income</h2>
              <button
                onClick={() => {
                  setIncomeModalFrequency(Frequency.MONTHLY)
                  setIncomeModalOpen(true)
                }}
                className="w-8 h-8 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-all duration-200 hover:scale-110"
              >
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {recurringIncome.length === 0 ? (
              <p className="text-center text-muted py-6 text-sm">No income sources yet</p>
            ) : (
              <div className="space-y-3">
                {recurringIncome.map((item) => (
                  <div key={item.id} className="p-4 rounded-xl bg-card border border-primary/10 relative group">
                    <div className="absolute top-3 right-3 flex items-center space-x-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        item.frequency === Frequency.MONTHLY
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {item.frequency === Frequency.MONTHLY ? 'Monthly' : 'Yearly'}
                      </span>
                      <button
                        onClick={() => {
                          setIncomeToEdit(item)
                          setIncomeModalOpen(true)
                        }}
                        className="w-7 h-7 rounded bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center space-x-3 mb-3 pr-12">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-primary">{item.description}</h3>
                        <p className="text-xs text-muted">{item.is_net ? 'Net' : 'Gross'}</p>
                      </div>
                    </div>
                    <p className="text-xl font-bold font-mono text-primary">{formatCurrency(item.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* One-Time Income */}
          <div className="glass-card rounded-xl p-5 fade-in" style={{ animationDelay: '0.35s' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-display font-semibold text-primary">One-Time Income</h2>
                <p className="text-xs text-muted mt-0.5">For {selectedYear}</p>
              </div>
              <button
                onClick={() => {
                  setIncomeModalFrequency(Frequency.ONE_TIME)
                  setIncomeModalOpen(true)
                }}
                className="w-8 h-8 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-all duration-200 hover:scale-110"
              >
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {oneTimeIncome.length === 0 ? (
              <p className="text-center text-muted py-6 text-sm">No one-time income this year</p>
            ) : (
              <div className="space-y-3">
                {oneTimeIncome.map((item) => (
                  <div key={item.id} className="p-4 rounded-xl bg-card border border-primary/10 relative group">
                    <button
                      onClick={() => {
                        setIncomeToEdit(item)
                        setIncomeModalOpen(true)
                      }}
                      className="absolute top-3 right-3 w-7 h-7 rounded bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <div className="flex items-center space-x-3 mb-3 pr-12">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-primary">{item.description}</h3>
                        <p className="text-xs text-muted">{item.effective_month}/{item.effective_year}</p>
                      </div>
                    </div>
                    <p className="text-xl font-bold font-mono text-primary">{formatCurrency(item.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* One-Time Expenses */}
          <div className="glass-card rounded-xl p-5 fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-display font-semibold text-primary">One-Time Expenses</h2>
                <p className="text-xs text-muted mt-0.5">For {selectedYear}</p>
              </div>
              <button
                onClick={() => {
                  setExpenseModalFrequency(Frequency.ONE_TIME)
                  setExpenseModalOpen(true)
                }}
                className="w-8 h-8 rounded-lg bg-accent/10 hover:bg-accent/20 flex items-center justify-center transition-all duration-200 hover:scale-110"
              >
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {oneTimeExpenses.length === 0 ? (
              <p className="text-center text-muted py-6 text-sm">No one-time expenses this year</p>
            ) : (
              <div className="space-y-3">
                {oneTimeExpenses.map((item) => (
                  <div key={item.id} className="p-4 rounded-xl bg-card border border-primary/10 relative group">
                    <button
                      onClick={() => {
                        setExpenseToEdit(item)
                        setExpenseModalOpen(true)
                      }}
                      className="absolute top-3 right-3 w-7 h-7 rounded bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <div className="flex items-center space-x-3 mb-3 pr-12">
                      {item.category?.icon && (
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                          style={{ backgroundColor: `${item.category.color}20` }}
                        >
                          {item.category.icon}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-primary">{item.description}</h3>
                        <p className="text-xs text-muted">{item.effective_month}/{item.effective_year} {item.category?.name && `• ${item.category.name}`}</p>
                      </div>
                    </div>
                    <p className="text-xl font-bold font-mono text-accent">{formatCurrency(item.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Expenses by Category */}
        <div className="lg:col-span-2 glass-card rounded-xl p-5 fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold text-primary">Recurring Expenses</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCategoryModalOpen(true)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-card hover:bg-secondary text-primary transition-all duration-200 border border-primary/20"
              >
                New Category
              </button>
              <button
                onClick={() => {
                  setExpenseModalFrequency(Frequency.MONTHLY)
                  setExpenseModalOpen(true)
                }}
                className="w-8 h-8 rounded-lg bg-accent/10 hover:bg-accent/20 flex items-center justify-center transition-all duration-200 hover:scale-110"
              >
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          {expensesByCategory.length === 0 && uncategorizedExpenses.length === 0 ? (
            <p className="text-center text-muted py-6 text-sm">No expenses yet. Create a category and add expenses.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {expensesByCategory.map((cat) => (
                <div key={cat.id} className="p-4 rounded-xl bg-card border border-primary/10">
                  <div className="flex items-center justify-between mb-3">
                    <div></div>
                    <div className="flex items-center gap-3">
                      {cat.icon && (
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                          style={{ backgroundColor: `${cat.color}20` }}
                        >
                          {cat.icon}
                        </div>
                      )}
                      <div className="text-center">
                        <h3 className="font-semibold text-primary">{cat.name}</h3>
                        {cat.is_essential && (
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Essential</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setExpenseModalFrequency(Frequency.MONTHLY)
                        setInitialCategoryId(cat.id)
                        setExpenseModalOpen(true)
                      }}
                      className="w-6 h-6 rounded bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-all duration-200 flex-shrink-0"
                    >
                      <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-8 py-3 px-4 rounded-lg bg-secondary/30">
                    <div className="text-center">
                      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Monthly</p>
                      <p className="text-lg font-bold font-mono text-accent">{formatCurrency(cat.monthlyTotal)}</p>
                    </div>
                    <div className="w-px h-8 bg-primary/20"></div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Yearly</p>
                      <p className="text-lg font-bold font-mono text-primary">{formatCurrency(cat.totalYearlyCost)}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {cat.expenses.map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between text-sm p-2.5 rounded-lg bg-secondary/30 group">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-primary">{expense.description}</span>
                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                            expense.frequency === Frequency.MONTHLY
                              ? 'bg-blue-100/50 text-blue-600'
                              : 'bg-purple-100/50 text-purple-600'
                          }`}>
                            {expense.frequency === Frequency.MONTHLY ? 'M' : 'Y'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-muted">{formatCurrency(expense.amount)}</span>
                          <button
                            onClick={() => {
                              setExpenseToEdit(expense)
                              setExpenseModalOpen(true)
                            }}
                            className="w-6 h-6 rounded bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
                          >
                            <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {uncategorizedExpenses.length > 0 && (
                <div className="p-4 rounded-xl bg-card border-l-2 border-muted">
                  <div className="flex items-center justify-center mb-3">
                    <h3 className="font-semibold text-muted">Uncategorized</h3>
                  </div>

                  <div className="flex items-center justify-center gap-8 py-3 px-4 rounded-lg bg-secondary/30">
                    <div className="text-center">
                      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Monthly</p>
                      <p className="text-lg font-bold font-mono text-accent">{formatCurrency(uncategorizedMonthlyTotal)}</p>
                    </div>
                    <div className="w-px h-8 bg-primary/20"></div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Yearly</p>
                      <p className="text-lg font-bold font-mono text-primary">{formatCurrency(uncategorizedTotalYearlyCost)}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {uncategorizedExpenses.map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between text-sm p-2.5 rounded-lg bg-secondary/30 group">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-primary">{expense.description}</span>
                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                            expense.frequency === Frequency.MONTHLY
                              ? 'bg-blue-100/50 text-blue-600'
                              : 'bg-purple-100/50 text-purple-600'
                          }`}>
                            {expense.frequency === Frequency.MONTHLY ? 'M' : 'Y'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-muted">{formatCurrency(expense.amount)}</span>
                          <button
                            onClick={() => {
                              setExpenseToEdit(expense)
                              setExpenseModalOpen(true)
                            }}
                            className="w-6 h-6 rounded bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
                          >
                            <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <BudgetCategoryModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onSuccess={fetchData}
      />
      <IncomeModal
        isOpen={incomeModalOpen}
        onClose={() => {
          setIncomeModalOpen(false)
          setIncomeModalFrequency(undefined)
          setIncomeToEdit(undefined)
        }}
        onSuccess={fetchData}
        initialFrequency={incomeModalFrequency}
        incomeToEdit={incomeToEdit}
        onDelete={() => incomeToEdit && setItemToDelete({ type: 'income', id: incomeToEdit.id })}
      />
      <ExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => {
          setExpenseModalOpen(false)
          setExpenseModalFrequency(undefined)
          setExpenseToEdit(undefined)
          setInitialCategoryId(undefined)
        }}
        onSuccess={fetchData}
        initialFrequency={expenseModalFrequency}
        expenseToEdit={expenseToEdit}
        initialCategoryId={initialCategoryId}
        onDelete={() => expenseToEdit && setItemToDelete({ type: 'expense', id: expenseToEdit.id })}
      />

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 fade-in">
          <div className="glass-card rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-display font-bold text-primary mb-4">Confirm Delete</h3>
            <p className="text-secondary mb-6">
              Are you sure you want to delete this {itemToDelete.type}? This action cannot be undone.
            </p>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setItemToDelete(null)}
                className="flex-1 px-6 py-3 rounded-xl font-semibold glass-card hover:shadow-md transition-all duration-300 text-primary"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    if (itemToDelete.type === 'income') {
                      await incomeService.deleteIncome(itemToDelete.id)
                    } else if (itemToDelete.type === 'expense') {
                      await expensesService.deleteExpense(itemToDelete.id)
                    } else if (itemToDelete.type === 'category') {
                      await budgetCategoriesService.deleteCategory(itemToDelete.id)
                    }
                    setItemToDelete(null)
                    fetchData()
                  } catch (err: any) {
                    alert(err.message || 'Failed to delete')
                  }
                }}
                className="flex-1 px-6 py-3 rounded-xl font-semibold bg-accent hover:bg-accent/80 text-white transition-all duration-300"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
