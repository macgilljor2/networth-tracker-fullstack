'use client'

import React, { useEffect, useState } from 'react'
import { accountTypesService, AccountType } from '@/lib/api/account-types.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export function AccountTypeManager() {
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingType, setEditingType] = useState<AccountType | null>(null)

  // Create form state
  const [newTypeName, setNewTypeName] = useState('')
  const [newTypeLabel, setNewTypeLabel] = useState('')

  // Edit form state
  const [editLabel, setEditLabel] = useState('')

  useEffect(() => {
    loadAccountTypes()
  }, [])

  const loadAccountTypes = async () => {
    try {
      setLoading(true)
      const types = await accountTypesService.getAccountTypes()
      setAccountTypes(types)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load account types')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    try {
      await accountTypesService.createAccountType({
        name: newTypeName.toLowerCase().replace(/\s+/g, '-'),
        label: newTypeLabel,
      })
      setMessage('Account type created successfully')
      setNewTypeName('')
      setNewTypeLabel('')
      setShowCreateForm(false)
      setTimeout(() => setMessage(''), 3000)
      await loadAccountTypes()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create account type')
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingType) return

    setError('')
    setMessage('')

    try {
      await accountTypesService.updateAccountType(editingType.id, {
        label: editLabel,
      })
      setMessage('Account type updated successfully')
      setEditingType(null)
      setTimeout(() => setMessage(''), 3000)
      await loadAccountTypes()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update account type')
    }
  }

  const handleDelete = async (type: AccountType) => {
    if (!confirm(`Are you sure you want to delete "${type.label}"?`)) return

    setError('')
    setMessage('')

    try {
      await accountTypesService.deleteAccountType(type.id)
      setMessage('Account type deleted successfully')
      setTimeout(() => setMessage(''), 3000)
      await loadAccountTypes()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete account type')
    }
  }

  const startEdit = (type: AccountType) => {
    setEditingType(type)
    setEditLabel(type.label)
  }

  const cancelEdit = () => {
    setEditingType(null)
    setEditLabel('')
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-secondary rounded"></div>
        <div className="h-10 bg-secondary rounded"></div>
        <div className="h-10 bg-secondary rounded"></div>
      </div>
    )
  }

  const systemTypes = accountTypes.filter(t => t.is_default)
  const customTypes = accountTypes.filter(t => !t.is_default)

  return (
    <div className="space-y-6">
      {message && (
        <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
          <p className="text-sm text-primary">{message}</p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* System Types */}
      <div>
        <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">System Types</h3>
        <div className="space-y-2">
          {systemTypes.map(type => (
            <div
              key={type.id}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
            >
              <div>
                <p className="font-medium text-primary">{type.label}</p>
                <p className="text-xs text-muted">{type.name}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-muted text-muted">Default</span>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Types */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">Custom Types</h3>
          {!showCreateForm && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowCreateForm(true)}
            >
              + Add New
            </Button>
          )}
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreate} className="mb-4 p-4 rounded-lg bg-secondary space-y-3">
            <Input
              label="Type Name"
              placeholder="e.g., crypto-wallet"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              helperText="Lowercase letters, numbers, and hyphens only"
              required
            />
            <Input
              label="Display Label"
              placeholder="e.g., Crypto Wallet"
              value={newTypeLabel}
              onChange={(e) => setNewTypeLabel(e.target.value)}
              required
            />
            <div className="flex space-x-2">
              <Button type="submit" variant="primary">Create</Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreateForm(false)}>Cancel</Button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {customTypes.length === 0 ? (
            <p className="text-sm text-muted text-center py-4">No custom account types yet</p>
          ) : (
            customTypes.map(type => (
              <div
                key={type.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/30 transition-colors"
              >
                {editingType?.id === type.id ? (
                  <form onSubmit={handleUpdate} className="flex-1 flex items-center space-x-2">
                    <Input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="flex-1"
                      required
                    />
                    <Button type="submit" variant="primary" size="sm">Save</Button>
                    <Button type="button" variant="secondary" size="sm" onClick={cancelEdit}>Cancel</Button>
                  </form>
                ) : (
                  <>
                    <div>
                      <p className="font-medium text-primary">{type.label}</p>
                      <p className="text-xs text-muted">{type.name}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => startEdit(type)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDelete(type)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
                      >
                        Delete
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
