import React, { useState } from 'react'
import { budgetCategoriesService } from '@/lib/api/budgets.service'
import { CreateBudgetCategoryRequest, BudgetCategory } from '@/types/budget'

export interface BudgetCategoryFormProps {
  onSuccess?: () => void
}

export const BudgetCategoryForm: React.FC<BudgetCategoryFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<CreateBudgetCategoryRequest>({
    name: '',
    description: '',
    icon: '',
    color: '',
    is_essential: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await budgetCategoriesService.createCategory(formData)
      setFormData({
        name: '',
        description: '',
        icon: '',
        color: '',
        is_essential: false,
      })
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || 'Failed to create category')
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
          Name <span className="text-accent">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-primary focus:outline-none focus:ring-2 focus:ring-primary bg-card text-primary"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-primary mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-primary focus:outline-none focus:ring-2 focus:ring-primary bg-card text-primary"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-primary mb-2">Icon (Emoji)</label>
        <input
          type="text"
          value={formData.icon}
          onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-primary focus:outline-none focus:ring-2 focus:ring-primary bg-card text-primary"
          placeholder="🏠"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-primary mb-2">Color</label>
        <input
          type="color"
          value={formData.color}
          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
          className="w-full h-12 rounded-xl border border-primary focus:outline-none focus:ring-2 focus:ring-primary bg-card"
        />
      </div>

      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="is_essential"
          checked={formData.is_essential}
          onChange={(e) => setFormData({ ...formData, is_essential: e.target.checked })}
          className="w-5 h-5 rounded border-primary focus:ring-primary"
        />
        <label htmlFor="is_essential" className="text-sm font-medium text-primary">
          Essential Expense
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary px-6 py-3 rounded-xl text-white font-semibold shadow-md hover:shadow-glow-strong transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Creating...' : 'Create Category'}
      </button>
    </form>
  )
}
