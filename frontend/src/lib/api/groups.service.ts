import { apiClient } from './client'
import { AccountGroup } from '@/types'

export interface CreateGroupRequest {
  name: string
  description: string
  accounts?: string[]
}

export interface UpdateGroupRequest {
  name?: string
  description?: string
  accounts?: string[]
}

export const groupsService = {
  /**
   * Get all groups
   */
  async getGroups(): Promise<AccountGroup[]> {
    const response = await apiClient.get<AccountGroup[]>('/api/v1/account-groups')
    return response.data
  },

  /**
   * Get group by ID
   */
  async getGroup(id: string): Promise<AccountGroup> {
    const response = await apiClient.get<AccountGroup>(`/api/v1/account-groups/${id}`)
    return response.data
  },

  /**
   * Create new group
   */
  async createGroup(data: CreateGroupRequest): Promise<AccountGroup> {
    const response = await apiClient.post<AccountGroup>('/api/v1/account-groups', data)
    return response.data
  },

  /**
   * Add account to group
   */
  async addAccountToGroup(groupId: string, accountId: string): Promise<void> {
    await apiClient.post(`/api/v1/account-groups/${groupId}/accounts/${accountId}`)
  },

  /**
   * Remove account from group
   */
  async removeAccountFromGroup(groupId: string, accountId: string): Promise<void> {
    await apiClient.delete(`/api/v1/account-groups/${groupId}/accounts/${accountId}`)
  },

  /**
   * Delete group
   */
  async deleteGroup(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/account-groups/${id}`)
  },

  /**
   * Update group
   */
  async updateGroup(id: string, data: UpdateGroupRequest): Promise<AccountGroup> {
    console.log('groupsService.updateGroup called with:', { id, data })
    const response = await apiClient.put<AccountGroup>(`/api/v1/account-groups/${id}`, data)
    console.log('groupsService.updateGroup response:', response.data)
    return response.data
  },
}
