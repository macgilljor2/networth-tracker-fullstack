import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { useAuthStore } from '@/stores/auth-store'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Track if a refresh is in progress to prevent multiple refresh attempts
let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback)
}

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token))
  refreshSubscribers = []
}

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true, // Important for httpOnly cookies
})

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle 401 and token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses for debugging
    if (response.config.url?.includes('/account-groups')) {
      console.log('API Response:', {
        method: response.config.method,
        url: response.config.url,
        status: response.status,
        data: response.data
      })
    }
    return response
  },
  async (error: AxiosError) => {
    // Log error responses
    if (error.config?.url?.includes('/account-groups')) {
      console.error('API Error:', {
        method: error.config.method,
        url: error.config.url,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      })
    }
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // If 401/403 and not already retrying
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      originalRequest._retry = true

      // If already refreshing, queue the request
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            resolve(apiClient(originalRequest))
          })
        })
      }

      isRefreshing = true

      try {
        // Attempt to refresh token (uses httpOnly cookie)
        const response = await axios.post(`${API_URL}/api/v1/auth/refresh`, {}, { withCredentials: true })

        if (response.data.access_token) {
          const { token: oldToken, user, setAuthData, clearAuth } = useAuthStore.getState()

          if (!user) {
            // No user, can't refresh
            clearAuth()
            window.location.href = '/login'
            return Promise.reject(error)
          }

          // Update token and expiry in store
          setAuthData(response.data.access_token, response.data.expires_in, user)

          // Notify all waiting requests
          onRefreshed(response.data.access_token)

          // Update authorization header
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`
          }

          // Retry original request
          return apiClient(originalRequest)
        } else {
          // No token in response, session invalid
          clearAuth()
          window.location.href = '/login'
        }
      } catch (refreshError) {
        // Refresh failed - clear auth and redirect to login
        useAuthStore.getState().clearAuth()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
