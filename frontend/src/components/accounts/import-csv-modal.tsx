'use client'

import React, { useState, useRef } from 'react'
import { balancesService } from '@/lib/api/balances.service'

interface BalanceRow {
  date: string
  amount: number
  isValid: boolean
  error?: string
}

interface ImportCSVModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  accountId: string
  currency: string
}

export const ImportCSVModal: React.FC<ImportCSVModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  accountId,
  currency,
}) => {
  const [step, setStep] = useState<'upload' | 'preview' | 'submitting'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [balances, setBalances] = useState<BalanceRow[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [submitProgress, setSubmitProgress] = useState({ current: 0, total: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£'

  const resetState = () => {
    setStep('upload')
    setFile(null)
    setBalances([])
    setErrors([])
    setSubmitProgress({ current: 0, total: 0 })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {
      setErrors(['Please select a CSV file'])
      return
    }

    setFile(selectedFile)
    setErrors([])

    // Parse CSV
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      parseCSV(text)
    }
    reader.readAsText(selectedFile)
  }

  const parseCSV = (csvText: string) => {
    const lines = csvText.trim().split('\n')
    const parsedBalances: BalanceRow[] = []
    const parseErrors: string[] = []

    // Skip header row if it exists
    let startIndex = 0
    const firstLine = lines[0].toLowerCase()
    if (firstLine.includes('date') || firstLine.includes('amount')) {
      startIndex = 1
    }

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const parts = line.split(',')
      if (parts.length < 2) {
        parseErrors.push(`Line ${i + 1}: Invalid format. Expected date,amount`)
        continue
      }

      const dateStr = parts[0].trim()
      const amountStr = parts[1].trim()

      // Validate date
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(dateStr)) {
        parsedBalances.push({
          date: dateStr,
          amount: 0,
          isValid: false,
          error: 'Invalid date format (use YYYY-MM-DD)'
        })
        continue
      }

      // Validate amount
      const amount = parseFloat(amountStr)
      if (isNaN(amount)) {
        parsedBalances.push({
          date: dateStr,
          amount: 0,
          isValid: false,
          error: 'Invalid amount'
        })
        continue
      }

      parsedBalances.push({
        date: dateStr,
        amount,
        isValid: true
      })
    }

    if (parseErrors.length > 0) {
      setErrors(parseErrors)
    }

    if (parsedBalances.length === 0) {
      setErrors(['No valid balance entries found in CSV'])
      return
    }

    setBalances(parsedBalances)
    setStep('preview')
  }

  const handleSubmit = async () => {
    setStep('submitting')
    const validBalances = balances.filter(b => b.isValid)
    setSubmitProgress({ current: 0, total: validBalances.length })

    const submitErrors: string[] = []

    for (let i = 0; i < validBalances.length; i++) {
      const balance = validBalances[i]
      try {
        await balancesService.createBalance(accountId, {
          amount: balance.amount,
          currency: currency,
          date: balance.date,
        })
        setSubmitProgress({ current: i + 1, total: validBalances.length })
      } catch (err: any) {
        const errorMsg = err?.response?.data?.detail || err?.message || `Failed to add balance for ${balance.date}`
        submitErrors.push(`${balance.date}: ${errorMsg}`)
      }
    }

    if (submitErrors.length > 0) {
      setErrors(submitErrors)
      setStep('preview')
    } else {
      onSuccess()
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile)
      setErrors([])

      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        parseCSV(text)
      }
      reader.readAsText(droppedFile)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div
        className="glass-card rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#1a1a1a]">Import Balances from CSV</h2>
            <p className="text-sm text-[#5a5a5a]">
              {step === 'upload' && 'Upload a CSV file with date and balance columns'}
              {step === 'preview' && `Review ${balances.length} balance entries before importing`}
              {step === 'submitting' && 'Importing balances...'}
            </p>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close modal"
            className="p-2 rounded-lg hover:bg-[#faf9f6] transition-colors"
            disabled={step === 'submitting'}
          >
            <svg className="w-6 h-6 text-[#a89880]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-semibold text-red-600">
                {step === 'submitting' ? 'Some imports failed:' : 'Errors found:'}
              </p>
            </div>
            <ul className="text-sm text-red-600 space-y-1">
              {errors.map((error, idx) => (
                <li key={idx}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {step === 'upload' && (
          <>
            {/* Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-[#d5d9d0] rounded-xl p-12 text-center cursor-pointer hover:bg-[#faf9f6] transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <svg className="w-12 h-12 text-[#7d8471] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-lg font-medium text-[#1a1a1a] mb-2">
                Drop your CSV file here, or click to browse
              </p>
              <p className="text-sm text-[#5a5a5a]">Supports .csv files only</p>
            </div>

            {/* CSV Format Instructions */}
            <div className="mt-6 p-4 bg-[#faf9f6] rounded-xl">
              <h3 className="text-sm font-semibold text-[#1a1a1a] mb-3">CSV Format Requirements:</h3>
              <div className="text-sm text-[#5a5a5a] space-y-2">
                <p>• First column: Date (YYYY-MM-DD format)</p>
                <p>• Second column: Balance amount (numeric, e.g., 1250.50)</p>
                <p>• Optional header row</p>
                <p className="font-mono text-xs bg-white p-3 rounded-lg mt-3">
                  Example:<br/>
                  date,amount<br/>
                  2026-01-15,1000.00<br/>
                  2026-02-01,1250.50<br/>
                  2026-02-15,1450.00
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-6 border-t border-[#d5d9d0]">
              <button
                onClick={handleClose}
                className="flex-1 px-6 py-3 rounded-xl border border-[#d5d9d0] text-[#1a1a1a] font-semibold hover:bg-[#faf9f6] transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {step === 'preview' && (
          <>
            {/* Summary */}
            <div className="mb-6 p-4 bg-[#faf9f6] rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#5a5a5a]">Total entries</p>
                  <p className="text-2xl font-bold text-[#1a1a1a]">{balances.length}</p>
                </div>
                <div>
                  <p className="text-sm text-[#5a5a5a]">Valid entries</p>
                  <p className="text-2xl font-bold text-[#2d5a27]">{balances.filter(b => b.isValid).length}</p>
                </div>
                <div>
                  <p className="text-sm text-[#5a5a5a]">Invalid entries</p>
                  <p className="text-2xl font-bold text-[#c17f59]">{balances.filter(b => !b.isValid).length}</p>
                </div>
              </div>
            </div>

            {/* Preview Table */}
            <div className="border border-[#d5d9d0] rounded-xl overflow-hidden mb-6">
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-[#faf9f6] sticky top-0">
                    <tr>
                      <th className="p-3 text-left text-xs font-semibold text-[#5a5a5a] uppercase">Date</th>
                      <th className="p-3 text-left text-xs font-semibold text-[#5a5a5a] uppercase">Balance</th>
                      <th className="p-3 text-left text-xs font-semibold text-[#5a5a5a] uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balances.map((balance, idx) => (
                      <tr key={idx} className="border-t border-[#d5d9d0]">
                        <td className="p-3 text-sm font-mono">{balance.date}</td>
                        <td className="p-3 text-sm font-mono font-semibold">
                          {currencySymbol}{balance.amount.toFixed(2)}
                        </td>
                        <td className="p-3 text-sm">
                          {balance.isValid ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#2d5a27]/10 text-[#2d5a27]">
                              ✓ Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">
                              ✗ {balance.error || 'Invalid'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-6 border-t border-[#d5d9d0]">
              <button
                onClick={() => {
                  setStep('upload')
                  setErrors([])
                }}
                className="flex-1 px-6 py-3 rounded-xl border border-[#d5d9d0] text-[#1a1a1a] font-semibold hover:bg-[#faf9f6] transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={balances.filter(b => b.isValid).length === 0}
                className="flex-1 px-6 py-3 rounded-xl bg-[#2d5a27] hover:bg-[#1e3d1a] text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Import {balances.filter(b => b.isValid).length} Balances</span>
              </button>
            </div>
          </>
        )}

        {step === 'submitting' && (
          <>
            {/* Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-[#5a5a5a]">Importing balances...</p>
                <p className="text-sm font-medium text-[#1a1a1a]">
                  {submitProgress.current} / {submitProgress.total}
                </p>
              </div>
              <div className="w-full bg-[#faf9f6] rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-[#2d5a27] transition-all duration-300"
                  style={{ width: `${(submitProgress.current / submitProgress.total) * 100}%` }}
                />
              </div>
            </div>

            {/* Current Status */}
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2d5a27]/10 mb-4">
                <div className="w-8 h-8 border-3 border-[#2d5a27] border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-lg font-medium text-[#1a1a1a]">
                {submitProgress.current < submitProgress.total
                  ? `Processing entry ${submitProgress.current + 1} of ${submitProgress.total}`
                  : 'Finishing up...'
                }
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
