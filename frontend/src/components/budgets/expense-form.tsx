import React, { useState, useEffect } from 'react'
import { expensesService, budgetCategoriesService } from '@/lib/api/budgets.service'
import { CreateExpenseRequest, Frequency, BudgetCategory } from '@/types/budget'
import { FrequencySelect } from './frequency-select'

export interface ExpenseFormProps {
  onSuccess?: () => void
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<CreateExpenseRequest>({
    description: '',
    amount: 0,
    frequency: Frequency.MONTHLY,
    category_id: '',
  })
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingCategories, setFetchingCategories] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await budgetCategoriesService.getCategories()
        setCategories(data)
      } catch (err) {
        console.error('Failed to load categories:', err)
      } finally {
        setFetchingCategories(false)
      }
    }
    fetchCategories()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await expensesService.createExpense(formData)
      setFormData({
        description: '',
        amount: 0,
        frequency: Frequency.MONTHLY,
        category_id: '',
      })
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || 'Failed to create expense entry')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="glass-card rounded-lg p-4 border-l-4 border-accent">
          <p className="text-sm text-accent">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-primary mb-2">
          Category <span className="text-accent">*</span>
        </label>
        {fetchingCategories ? (
          <div className="w-full px-4 py-3 rounded-xl border border-primary bg-card animate-pulse">
            Loading categories...
          </div>
        ) : (
          <select
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-primary focus:outline-none focus:ring-2 focus:ring-primary bg-card text-primary"
            required
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon ? `${cat.icon} ` : ''}{cat.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-primary mb-2">
          Description <span className="text-accent">*</span>
        </label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-primary focus:outline-none focus:ring-2 focus:ring-primary bg-card text-primary"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-primary mb-2">
          Amount (£) <span className="text-accent">*</span>
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.amount || ''}
          onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
          className="w-full px-4 py-3 rounded-xl border border-primary focus:outline-none focus:ring-2 focus:ring-primary bg-card text-primary"
          required
        />
      </div>

      <FrequencySelect
        value={formData.frequency}
        onChange={(value) => setFormData({ ...formData, frequency: value })}
        required
      />

      {formData.frequency === Frequency.ONE_TIME && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Month <span className="text-accent">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="12"
              value={formData.effective_month || ''}
              onChange={(e) => setFormData({ ...formData, effective_month: parseInt(e.target.value) || undefined })}
              className="w-full px-4 py-3 rounded-xl border border-primary focus:outline-none focus:ring-2 focus:ring-primary bg-card text-primary"
              required={formData.frequency === Frequency.ONE_TIME}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Year <span className="text-accent">*</span>
            </label>
            <input
              type="number"
              min="2000"
              max="2100"
              value={formData.effective_year || ''}
              onChange={(e) => setFormData({ ...formData, effective_year: parseInt(e.target.value) || undefined })}
              className="w-full px-4 py-3 rounded-xl border border-primary focus:outline-none focus:ring-2 focus:ring-primary bg-card text-primary"
              required={formData.frequency === Frequency.ONE_TIME}
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || fetchingCategories}
        className="w-full btn-primary px-6 py-3 rounded-xl text-white font-semibold shadow-md hover:shadow-glow-strong transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Creating...' : 'Add Expense'}
      </button>
    </form>
  )
}
