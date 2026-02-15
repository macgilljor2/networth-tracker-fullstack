import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { expensesService, budgetCategoriesService } from '@/lib/api/budgets.service'
import { CreateExpenseRequest, UpdateExpenseRequest, Frequency, BudgetCategory, Expense } from '@/types/budget'
import { FrequencySelect } from './frequency-select'

export interface ExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  initialFrequency?: Frequency
  expenseToEdit?: Expense
  initialCategoryId?: string
  onDelete?: () => void
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialFrequency,
  expenseToEdit,
  initialCategoryId,
  onDelete
}) => {
  const currentDate = new Date()
  const [formData, setFormData] = useState<CreateExpenseRequest>({
    description: '',
    amount: 0,
    frequency: initialFrequency || Frequency.MONTHLY,
    category_id: initialCategoryId || '',
    effective_month: currentDate.getMonth() + 1,
    effective_year: currentDate.getFullYear(),
  })
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingCategories, setFetchingCategories] = useState(true)
  const [error, setError] = useState('')
  const isEditing = !!expenseToEdit

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

    if (isOpen) {
      fetchCategories()
      if (expenseToEdit) {
        setFormData({
          description: expenseToEdit.description,
          amount: expenseToEdit.amount,
          frequency: expenseToEdit.frequency,
          category_id: expenseToEdit.category_id || '',
          effective_month: expenseToEdit.effective_month,
          effective_year: expenseToEdit.effective_year,
        })
      } else {
        setFormData({
          description: '',
          amount: 0,
          frequency: initialFrequency || Frequency.MONTHLY,
          category_id: initialCategoryId || '',
          effective_month: currentDate.getMonth() + 1,
          effective_year: currentDate.getFullYear(),
        })
      }
      setError('')
    }
  }, [isOpen, initialFrequency, expenseToEdit, initialCategoryId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isEditing && expenseToEdit) {
        const updateData: UpdateExpenseRequest = {
          description: formData.description,
          amount: formData.amount,
          frequency: formData.frequency,
          category_id: formData.category_id,
          effective_month: formData.effective_month,
          effective_year: formData.effective_year,
        }
        await expensesService.updateExpense(expenseToEdit.id, updateData)
      } else {
        await expensesService.createExpense(formData)
      }
      onSuccess?.()
      onClose()
    } catch (err: any) {
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} expense entry`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Expense' : 'Add Expense'}>
      <form onSubmit={handleSubmit} className="space-y-5">
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

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-primary mb-2">
            Category <span className="text-accent">*</span>
          </label>
          {fetchingCategories ? (
            <div className="w-full px-4 py-3 rounded-xl border border-primary/20 bg-secondary/30 animate-pulse">
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <div className="glass-card rounded-lg p-4 text-center">
              <p className="text-sm text-muted mb-3">No categories yet. Create one first!</p>
              <button
                type="button"
                onClick={() => {
                  onClose()
                  // Trigger category modal (you'll need to handle this)
                }}
                className="text-sm font-semibold text-primary hover:underline"
              >
                Create Category
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, category_id: cat.id })}
                  className={`p-3 rounded-lg text-left transition-all duration-200 hover:scale-[1.02] ${
                    formData.category_id === cat.id
                      ? 'bg-primary/20 border-2 border-primary'
                      : 'bg-secondary/50 border-2 border-transparent hover:border-primary/30'
                  }`}
                  style={{
                    borderLeftColor: formData.category_id === cat.id ? undefined : cat.color || undefined,
                    borderLeftWidth: formData.category_id === cat.id ? '2px' : '4px',
                  }}
                >
                  <div className="flex items-center space-x-2">
                    {cat.icon && <span className="text-lg">{cat.icon}</span>}
                    <span className="text-sm font-medium text-primary truncate">{cat.name}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-primary mb-2">
            Description <span className="text-accent">*</span>
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-card text-primary transition-all duration-200"
            placeholder="e.g., Rent, Groceries, Netflix"
            required
            autoFocus
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-semibold text-primary mb-2">
            {formData.frequency === Frequency.YEARLY ? 'Yearly Amount' : formData.frequency === Frequency.ONE_TIME ? 'Amount' : 'Monthly Amount'} (£) <span className="text-accent">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-semibold">£</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount || ''}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              className="w-full pl-8 pr-4 py-3 rounded-xl border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-card text-primary font-mono transition-all duration-200"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        {/* Frequency */}
        <FrequencySelect
          value={formData.frequency}
          onChange={(value) => setFormData({ ...formData, frequency: value })}
          required
        />

        {/* Effective Date for One-Time */}
        {formData.frequency === Frequency.ONE_TIME && (
          <div className="glass-card rounded-xl p-4 fade-in">
            <p className="text-sm font-semibold text-primary mb-3">Effective Date</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Month</label>
                <div className="relative">
                  <select
                    value={formData.effective_month || currentDate.getMonth() + 1}
                    onChange={(e) => setFormData({ ...formData, effective_month: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-primary/20 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-card text-primary font-display appearance-none cursor-pointer transition-all duration-200 hover:border-primary/30"
                    required
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Year</label>
                <div className="relative">
                  <select
                    value={formData.effective_year || currentDate.getFullYear()}
                    onChange={(e) => setFormData({ ...formData, effective_year: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-primary/20 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-card text-primary font-display font-mono appearance-none cursor-pointer transition-all duration-200 hover:border-primary/30"
                    required
                  >
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = currentDate.getFullYear() - 2 + i
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      )
                    })}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className={`${isEditing ? 'grid grid-cols-3 gap-3' : 'flex items-center space-x-3'} pt-4`}>
          {isEditing && onDelete && (
            <button
              type="button"
              onClick={() => {
                onDelete()
                onClose()
              }}
              className="px-6 py-3 rounded-xl font-semibold bg-accent hover:bg-accent/80 text-white transition-all duration-300"
              disabled={loading}
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className={`${isEditing ? 'col-span-1' : 'flex-1'} px-6 py-3 rounded-xl font-semibold glass-card hover:shadow-md transition-all duration-300 text-primary`}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !formData.description || !formData.amount || !formData.category_id}
            className={`${isEditing ? 'col-span-1' : 'flex-1'} btn-primary px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-glow-strong transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed text-white`}
          >
            {loading ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Expense' : 'Add Expense')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
