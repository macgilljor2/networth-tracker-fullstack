import apiClient from './client'

export interface AccountType {
  id: string
  name: string
  label: string
  icon?: string
  is_default: boolean
  user_id?: string
  created_at: string
  updated_at: string
}

export interface AccountTypeCreate {
  name: string
  label: string
  icon?: string
}

export interface AccountTypeUpdate {
  label?: string
  icon?: string
}

export const accountTypesService = {
  /**
   * Get all account types for the current user (system defaults + custom)
   */
  async getAccountTypes(): Promise<AccountType[]> {
    const response = await apiClient.get<AccountType[]>('/api/v1/account-types')
    return response.data
  },

  /**
   * Create a new custom account type
   */
  async createAccountType(data: AccountTypeCreate): Promise<AccountType> {
    const response = await apiClient.post<AccountType>('/api/v1/account-types', data)
    return response.data
  },

  /**
   * Update an existing custom account type
   */
  async updateAccountType(id: string, data: AccountTypeUpdate): Promise<AccountType> {
    const response = await apiClient.put<AccountType>(`/api/v1/account-types/${id}`, data)
    return response.data
  },

  /**
   * Delete a custom account type
   */
  async deleteAccountType(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/account-types/${id}`)
  },
}
