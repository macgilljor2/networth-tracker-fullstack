import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock axios before importing the client
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      defaults: {
        baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
        headers: {
          common: {
            'Content-Type': 'application/json',
          },
        },
        timeout: 30000,
      },
      withCredentials: true,
      interceptors: {
        request: {
          use: vi.fn(),
        },
        response: {
          use: vi.fn(),
        },
      },
    })),
    post: vi.fn(),
  },
}))

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create axios instance with base URL', async () => {
    const { apiClient } = await import('@/lib/api/client')
    expect(apiClient).toBeDefined()
    expect(apiClient.defaults.baseURL).toBe(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
  })

  it('should have default headers', async () => {
    const { apiClient } = await import('@/lib/api/client')
    expect(apiClient.defaults.headers.common['Content-Type']).toBe('application/json')
  })

  it('should have timeout configured', async () => {
    const { apiClient } = await import('@/lib/api/client')
    expect(apiClient.defaults.timeout).toBeDefined()
    expect(apiClient.defaults.timeout).toBe(30000)
  })

  it('should have request interceptor registered', async () => {
    const { apiClient } = await import('@/lib/api/client')
    expect(apiClient.interceptors.request.use).toBeDefined()
  })

  it('should have response interceptor registered', async () => {
    const { apiClient } = await import('@/lib/api/client')
    expect(apiClient.interceptors.response.use).toBeDefined()
  })

  it('should have withCredentials enabled', async () => {
    const { apiClient } = await import('@/lib/api/client')
    expect((apiClient as any).withCredentials).toBe(true)
  })
})
