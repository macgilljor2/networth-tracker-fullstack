import { apiClient } from './client'
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '@/types'

export const authService = {
  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/api/v1/auth/login', data)
    return response.data
  },

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>('/api/v1/auth/register', data)
    return response.data
  },

  /**
   * Logout user - clears httpOnly cookie
   */
  async logout(): Promise<void> {
    await apiClient.post('/api/v1/auth/logout')
  },

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<any> {
    const response = await apiClient.get('/api/v1/auth/me')
    return response.data
  },

  /**
   * Refresh access token using httpOnly cookie
   */
  async refreshToken(): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/api/v1/auth/refresh', {})
    return response.data
  },
}
