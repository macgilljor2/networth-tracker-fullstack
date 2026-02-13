'use client'

import React, { useState } from 'react'
import { groupsService } from '@/lib/api/groups.service'
import { AccountGroup } from '@/types'

interface EditGroupModalProps {
  group: AccountGroup
  onClose: () => void
  onSuccess?: () => void
}

export function EditGroupModal({ group, onClose, onSuccess }: EditGroupModalProps) {
  const [name, setName] = useState(group.name)
  const [description, setDescription] = useState(group.description || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      alert('Please provide a group name')
      return
    }

    setLoading(true)
    try {
      await groupsService.updateGroup(group.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      })

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Failed to update group:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update group. Please try again.'
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="glass-card rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-[#3d3428]">Edit Group</h2>
            <p className="text-sm text-[#6d5c4a]">Update your group details</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-lg hover:bg-[#e5ddd3] transition-colors"
          >
            <svg className="w-6 h-6 text-[#a89880]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          <form id="edit-group-form" onSubmit={handleSubmit}>
            {/* Name */}
            <div className="mb-4">
              <label htmlFor="edit-group-name" className="block text-sm font-medium text-[#3d3428] mb-2">
                Group Name *
              </label>
              <input
                id="edit-group-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#e5ddd3] bg-[#faf8f5] text-[#3d3428] placeholder-[#a89880] focus:outline-none focus:ring-2 focus:ring-[#5a8f5a]"
                placeholder="e.g., Emergency Fund, Investments"
                required
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label htmlFor="edit-group-description" className="block text-sm font-medium text-[#3d3428] mb-2">
                Description
              </label>
              <textarea
                id="edit-group-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#e5ddd3] bg-[#faf8f5] text-[#3d3428] placeholder-[#a89880] focus:outline-none focus:ring-2 focus:ring-[#5a8f5a] resize-none"
                placeholder="What's this group for?"
                rows={3}
              />
            </div>

            {/* Info about accounts */}
            <div className="bg-[#faf8f5] rounded-xl p-4 border border-[#e5ddd3]">
              <p className="text-sm text-[#6d5c4a]">
                <span className="font-semibold text-[#3d3428]">Note:</span> To add or remove accounts from this group, use the "Manage Accounts" button on the group details page.
              </p>
            </div>
          </form>
        </div>

        {/* Buttons */}
        <div className="flex space-x-3 flex-shrink-0 mt-6 pt-6 border-t border-[#e5ddd3]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-[#e5ddd3] text-[#3d3428] font-semibold hover:bg-[#faf8f5] transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              const form = document.getElementById('edit-group-form') as HTMLFormElement
              form?.requestSubmit()
            }}
            className="flex-1 py-3 rounded-xl bg-[#5a8f5a] hover:bg-[#3d6b3d] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !name.trim()}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
