import { apiClient } from './client'
import { Balance } from '@/types'

export interface CreateBalanceRequest {
  amount: number
  currency: string
  date: string
}

export interface UpdateBalanceRequest {
  amount?: number
  date?: string
}

export interface BalancesQueryParams {
  limit?: number
  offset?: number
  sort?: 'date' | 'amount'
  order?: 'asc' | 'desc'
}

export const balancesService = {
  /**
   * Get balances for an account
   */
  async getBalances(accountId: string, params?: BalancesQueryParams): Promise<Balance[]> {
    const response = await apiClient.get<Balance[]>(`/api/v1/accounts/${accountId}/balances`, {
      params,
    })
    return response.data
  },

  /**
   * Create new balance entry
   */
  async createBalance(accountId: string, data: CreateBalanceRequest): Promise<Balance> {
    const response = await apiClient.post<Balance>(
      `/api/v1/accounts/${accountId}/balances`,
      data
    )
    return response.data
  },

  /**
   * Update balance entry
   */
  async updateBalance(accountId: string, balanceId: string, data: UpdateBalanceRequest): Promise<Balance> {
    const response = await apiClient.put<Balance>(
      `/api/v1/accounts/${accountId}/balances/${balanceId}`,
      data
    )
    return response.data
  },

  /**
   * Delete balance entry
   */
  async deleteBalance(accountId: string, balanceId: string): Promise<void> {
    await apiClient.delete(`/api/v1/accounts/${accountId}/balances/${balanceId}`)
  },

  /**
   * Bulk delete balances
   */
  async bulkDeleteBalances(accountId: string, balanceIds: string[]): Promise<void> {
    await apiClient.post(`/api/v1/accounts/${accountId}/balances/bulk-delete`, {
      balance_ids: balanceIds,
    })
  },
}
