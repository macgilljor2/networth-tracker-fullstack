import { apiClient } from './client'
import { DashboardData, DashboardHistoryResponse, HistoryPoint as BalanceHistoryPoint } from '@/types'

export interface BalanceHistoryQueryParams {
  from_date?: string
  to_date?: string
}

export const dashboardService = {
  /**
   * Get dashboard summary data
   */
  async getDashboardData(): Promise<DashboardData> {
    const response = await apiClient.get<DashboardData>('/api/v1/dashboard')
    return response.data
  },

  /**
   * Get balance history for all accounts including group histories
   */
  async getBalanceHistory(params?: BalanceHistoryQueryParams): Promise<DashboardHistoryResponse> {
    const response = await apiClient.get<DashboardHistoryResponse>('/api/v1/dashboard/history', {
      params,
    })
    return response.data
  },

  /**
   * Get balance history for a specific account
   */
  async getAccountBalanceHistory(
    accountId: string,
    params?: BalanceHistoryQueryParams
  ): Promise<BalanceHistoryPoint[]> {
    const response = await apiClient.get<BalanceHistoryPoint[]>(
      `/api/v1/accounts/${accountId}/balances/history`,
      { params }
    )
    return response.data
  },
}
