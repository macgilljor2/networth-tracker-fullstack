import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '@/stores/auth-store'

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.getState().reset()
  })

  it('should have initial state', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.isLoading).toBe(false)
  })

  it('should set user and token on login', () => {
    const { setUser, setToken } = useAuthStore.getState()

    setUser({
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      created_at: new Date().toISOString(),
      settings: { theme: 'beige' },
    })

    setToken('test-jwt-token')

    const state = useAuthStore.getState()
    expect(state.user).toBeDefined()
    expect(state.user?.username).toBe('testuser')
    expect(state.token).toBe('test-jwt-token')
    expect(state.isAuthenticated).toBe(true)
  })

  it('should clear user and token on logout', () => {
    const { setUser, setToken, logout } = useAuthStore.getState()

    setUser({
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      created_at: new Date().toISOString(),
      settings: { theme: 'beige' },
    })

    setToken('test-jwt-token')

    logout()

    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('should update loading state', () => {
    const { setLoading } = useAuthStore.getState()

    setLoading(true)
    expect(useAuthStore.getState().isLoading).toBe(true)

    setLoading(false)
    expect(useAuthStore.getState().isLoading).toBe(false)
  })

  it('should reset state', () => {
    const { setUser, setToken, reset } = useAuthStore.getState()

    setUser({
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      created_at: new Date().toISOString(),
      settings: { theme: 'beige' },
    })

    setToken('test-jwt-token')

    reset()

    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.isLoading).toBe(false)
  })
})
