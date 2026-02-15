'use client'

import React, { useEffect, useState } from 'react'
import { budgetCategoriesService } from '@/lib/api/budgets.service'
import { BudgetCategory } from '@/types/budget'

export default function BudgetCategoriesPage() {
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchCategories = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await budgetCategoriesService.getCategories()
      setCategories(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-4xl font-display font-bold text-primary mb-2">Budget Categories</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-6 h-32 animate-pulse"></div>
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
          <h1 className="text-4xl font-display font-bold text-primary mb-2">Budget Categories</h1>
          <p className="text-secondary">Manage expense categories</p>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <p className="text-secondary mb-4">No categories yet. Create your first category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="glass-card rounded-2xl p-6 hover:shadow-md transition-all duration-200"
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
          ))}
        </div>
      )}
    </div>
  )
}
