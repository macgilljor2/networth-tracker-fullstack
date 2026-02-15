import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { budgetCategoriesService } from '@/lib/api/budgets.service'
import { CreateBudgetCategoryRequest } from '@/types/budget'

export interface BudgetCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const PRESET_ICONS = [
  '🏠', '🍔', '🚗', '💊', '🎬', '👗', '📱', '💡',
  '🎓', '✈️', '🏃', '🛒', '🎁', '🍕', '🚇', '💰'
]

const PRESET_COLORS = [
  '#2d5a27', '#5a8f5a', '#7d8471', '#c17f59', '#d4a574',
  '#6b8e9f', '#9f7b6b', '#8b7d6a', '#a89880', '#7a8b7a'
]

export const BudgetCategoryModal: React.FC<BudgetCategoryModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<CreateBudgetCategoryRequest>({
    name: '',
    description: '',
    icon: '',
    color: PRESET_COLORS[0],
    is_essential: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        description: '',
        icon: '',
        color: PRESET_COLORS[0],
        is_essential: false,
      })
      setError('')
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await budgetCategoriesService.createCategory(formData)
      onSuccess?.()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to create category')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Budget Category">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="glass-card rounded-lg p-4 border-l-4 border-accent fade-in">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-accent">{error}</p>
            </div>
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-primary mb-2">
            Category Name <span className="text-accent">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-card text-primary transition-all duration-200"
            placeholder="e.g., Housing, Food, Transport"
            required
            autoFocus
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-primary mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-card text-primary transition-all duration-200 resize-none"
            placeholder="Optional description..."
            rows={2}
          />
        </div>

        {/* Icon Selection */}
        <div>
          <label className="block text-sm font-semibold text-primary mb-3">
            Icon
          </label>
          <div className="grid grid-cols-8 gap-2">
            {PRESET_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setFormData({ ...formData, icon })}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all duration-200 hover:scale-110 ${
                  formData.icon === icon
                    ? 'bg-primary/20 border-2 border-primary'
                    : 'bg-secondary border-2 border-transparent hover:border-primary/30'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            className="mt-3 w-full px-4 py-2 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-card text-primary text-sm transition-all duration-200"
            placeholder="Or type a custom emoji..."
          />
        </div>

        {/* Color Selection */}
        <div>
          <label className="block text-sm font-semibold text-primary mb-3">
            Color
          </label>
          <div className="grid grid-cols-10 gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, color })}
                className={`w-8 h-8 rounded-lg transition-all duration-200 hover:scale-110 ${
                  formData.color === color
                    ? 'ring-2 ring-offset-2 ring-primary ring-offset-bg-card scale-110'
                    : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Essential Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
          <div>
            <p className="text-sm font-semibold text-primary">Essential Expense</p>
            <p className="text-xs text-muted mt-1">Mark as must-have expense (rent, utilities, etc.)</p>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, is_essential: !formData.is_essential })}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
              formData.is_essential ? 'bg-primary' : 'bg-primary/30'
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${
                formData.is_essential ? 'left-7' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-xl font-semibold glass-card hover:shadow-md transition-all duration-300 text-primary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !formData.name}
            className="flex-1 btn-primary px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-glow-strong transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed text-white"
          >
            {loading ? 'Creating...' : 'Create Category'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
