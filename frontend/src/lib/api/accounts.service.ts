import { apiClient } from './client'
import { Account, AccountWithBalances } from '@/types'

export interface CreateAccountRequest {
  account_name: string
  account_type: string
  currency: string
}

export interface UpdateAccountRequest {
  account_name?: string
  account_type?: string
  currency?: string
}

export const accountsService = {
  /**
   * Get all accounts
   */
  async getAccounts(): Promise<AccountWithBalances[]> {
    const response = await apiClient.get<AccountWithBalances[]>('/api/v1/accounts')
    return response.data
  },

  /**
   * Get account by ID
   */
  async getAccount(id: string): Promise<Account> {
    const response = await apiClient.get<Account>(`/api/v1/accounts/${id}`)
    return response.data
  },

  /**
   * Create new account
   */
  async createAccount(data: CreateAccountRequest): Promise<Account> {
    const response = await apiClient.post<Account>('/api/v1/accounts', data)
    return response.data
  },

  /**
   * Update account
   */
  async updateAccount(id: string, data: UpdateAccountRequest): Promise<Account> {
    const response = await apiClient.put<Account>(`/api/v1/accounts/${id}`, data)
    return response.data
  },

  /**
   * Toggle account exclusion from totals
   */
  async toggleExclusion(id: string): Promise<Account> {
    const response = await apiClient.patch<Account>(`/api/v1/accounts/${id}/toggle-exclusion`)
    return response.data
  },

  /**
   * Delete account
   */
  async deleteAccount(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/accounts/${id}`)
  },
}
