'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { groupsService } from '@/lib/api/groups.service'

export interface CreateGroupData {
  name: string
  description?: string
}

export interface GroupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  group?: {
    id: string
    name: string
    description: string | null
  }
}

export const GroupModal: React.FC<GroupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  group,
}) => {
  const isEdit = !!group
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateGroupData>({
    defaultValues: group
      ? {
          name: group.name,
          description: group.description || '',
        }
      : undefined,
  })

  const onSubmit = async (data: CreateGroupData) => {
    setError('')
    setLoading(true)

    try {
      const groupData = {
        name: data.name,
        description: data.description || '',
      }

      if (isEdit && group) {
        await groupsService.updateGroup(group.id, groupData)
      } else {
        await groupsService.createGroup(groupData)
      }
      reset()
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || `Failed to ${isEdit ? 'update' : 'create'} group`)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    setError('')
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? 'Edit Group' : 'Create Group'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <Input
          label="Group Name"
          placeholder="e.g., Emergency Fund"
          error={!!errors.name}
          errorText={errors.name?.message}
          {...register('name', { required: 'Group name is required' })}
        />

        <Input
          label="Description (Optional)"
          placeholder="What is this group for?"
          {...register('description')}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {isEdit ? 'Update' : 'Create'} Group
          </Button>
        </div>
      </form>
    </Modal>
  )
}
