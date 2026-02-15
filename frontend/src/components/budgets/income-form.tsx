import React, { useState } from 'react'
import { incomeService } from '@/lib/api/budgets.service'
import { CreateIncomeRequest, Frequency } from '@/types/budget'
import { FrequencySelect } from './frequency-select'

export interface IncomeFormProps {
  onSuccess?: () => void
}

export const IncomeForm: React.FC<IncomeFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<CreateIncomeRequest>({
    description: '',
    amount: 0,
    frequency: Frequency.MONTHLY,
    is_net: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await incomeService.createIncome(formData)
      setFormData({
        description: '',
        amount: 0,
        frequency: Frequency.MONTHLY,
        is_net: true,
      })
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || 'Failed to create income entry')
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

      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="is_net"
          checked={formData.is_net}
          onChange={(e) => setFormData({ ...formData, is_net: e.target.checked })}
          className="w-5 h-5 rounded border-primary focus:ring-primary"
        />
        <label htmlFor="is_net" className="text-sm font-medium text-primary">
          Net Income (after tax)
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary px-6 py-3 rounded-xl text-white font-semibold shadow-md hover:shadow-glow-strong transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Creating...' : 'Add Income'}
      </button>
    </form>
  )
}
