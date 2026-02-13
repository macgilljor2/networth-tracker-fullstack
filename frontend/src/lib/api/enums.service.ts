import { apiClient } from './client'

export interface AccountType {
  value: string
  label: string
}

export interface Currency {
  code: string
  name: string
  symbol: string
}

export const enumsService = {
  /**
   * Get all account types
   */
  async getAccountTypes(): Promise<AccountType[]> {
    const response = await apiClient.get<AccountType[]>('/api/v1/enums/account-types')
    return response.data
  },

  /**
   * Get all currencies
   */
  async getCurrencies(): Promise<Currency[]> {
    const response = await apiClient.get<Currency[]>('/api/v1/enums/currencies')
    return response.data
  },
}
