'use client'

import React, { useEffect, useState } from 'react'
import { incomeService } from '@/lib/api/budgets.service'
import { Income, Frequency } from '@/types/budget'

export default function BudgetIncomePage() {
  const [income, setIncome] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchIncome = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await incomeService.getIncome()
      setIncome(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load income')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIncome()
  }, [])

  const formatCurrency = (amount: number) => {
    return `£${amount.toFixed(2)}`
  }

  const getFrequencyLabel = (freq: Frequency) => {
    const labels = {
      [Frequency.MONTHLY]: 'Monthly',
      [Frequency.YEARLY]: 'Yearly',
      [Frequency.ONE_TIME]: 'One-Time',
    }
    return labels[freq] || freq
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-4xl font-display font-bold text-primary mb-2">Income</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-xl p-6 h-24 animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-card rounded-2xl p-8 border-l-4 border-accent">
        <p className="text-accent font-medium">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold text-primary mb-2">Income</h1>
          <p className="text-secondary">Track your income sources</p>
        </div>
      </div>

      {income.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <p className="text-secondary mb-4">No income entries yet. Add your first income source.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {income.map((item) => (
            <div
              key={item.id}
              className="glass-card rounded-xl p-6 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-primary text-lg">{item.description}</h3>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {getFrequencyLabel(item.frequency)}
                    </span>
                    {!item.is_net && (
                      <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full">
                        Gross
                      </span>
                    )}
                  </div>
                  {item.frequency === Frequency.ONE_TIME && (
                    <p className="text-sm text-secondary">
                      Effective: {item.effective_month}/{item.effective_year}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold font-mono text-primary">
                    {formatCurrency(item.amount)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
