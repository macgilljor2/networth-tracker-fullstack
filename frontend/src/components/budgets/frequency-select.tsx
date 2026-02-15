import React from 'react'
import { Frequency } from '@/types/budget'

export interface FrequencySelectProps {
  value: Frequency
  onChange: (value: Frequency) => void
  label?: string
  required?: boolean
}

const FREQUENCIES = [
  { value: Frequency.MONTHLY, label: 'Monthly', description: 'Recurring each month' },
  { value: Frequency.YEARLY, label: 'Yearly', description: 'Once per year' },
  { value: Frequency.ONE_TIME, label: 'One-Time', description: 'Single occurrence' },
]

export const FrequencySelect: React.FC<FrequencySelectProps> = ({
  value,
  onChange,
  label = 'Frequency',
  required = false
}) => {
  return (
    <div>
      <label className="block text-sm font-semibold text-primary mb-2">
        {label}
        {required && <span className="text-accent ml-1">*</span>}
      </label>
      <div className="grid grid-cols-3 gap-2">
        {FREQUENCIES.map((freq) => (
          <button
            key={freq.value}
            type="button"
            onClick={() => onChange(freq.value)}
            className={`p-3 rounded-lg text-center transition-all duration-200 ${
              value === freq.value
                ? 'bg-primary text-white shadow-md'
                : 'bg-card hover:bg-secondary border border-primary/20'
            }`}
          >
            <div className="text-sm font-medium">{freq.label}</div>
            <div className={`text-xs mt-0.5 ${value === freq.value ? 'text-white/80' : 'text-muted'}`}>
              {freq.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
