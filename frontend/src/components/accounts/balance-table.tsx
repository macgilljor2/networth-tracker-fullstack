'use client'

import React, { useState } from 'react'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Balance } from '@/types'

export interface BalanceTableProps {
  balances: Balance[]
  loading?: boolean
  onEdit?: (balance: Balance) => void
  onDelete?: (balanceIds: string[]) => void
  selectable?: boolean
}

export const BalanceTable: React.FC<BalanceTableProps> = ({
  balances,
  loading = false,
  onEdit,
  onDelete,
  selectable = false,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const formatBalance = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(balances.map((b) => b.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }

  const handleDeleteSelected = () => {
    if (onDelete && selectedIds.size > 0) {
      onDelete(Array.from(selectedIds))
      setSelectedIds(new Set())
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse h-12 bg-gray-200 rounded"></div>
        ))}
      </div>
    )
  }

  if (balances.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No balance entries yet. Add your first balance to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {selectable && selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
          <span className="text-sm text-gray-700">
            {selectedIds.size} balance{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDeleteSelected}
          >
            Delete Selected
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.size === balances.length && balances.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </TableHead>
            )}
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {balances.map((balance) => (
            <TableRow key={balance.id}>
              {selectable && (
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(balance.id)}
                    onChange={(e) => handleSelectOne(balance.id, e.target.checked)}
                  />
                </TableCell>
              )}
              <TableCell>{formatDate(balance.date)}</TableCell>
              <TableCell className="font-medium">{formatBalance(balance.amount, balance.currency)}</TableCell>
              <TableCell>{balance.currency}</TableCell>
              <TableCell className="text-right">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(balance)}
                  >
                    Edit
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
