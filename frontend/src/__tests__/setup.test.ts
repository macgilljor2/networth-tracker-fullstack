import { describe, it, expect } from 'vitest'

describe('Project Setup', () => {
  it('should verify environment variables are defined', () => {
    expect(process.env.NEXT_PUBLIC_API_URL).toBeDefined()
    expect(process.env.NEXT_PUBLIC_APP_URL).toBeDefined()
  })

  it('should have correct API URL', () => {
    expect(process.env.NEXT_PUBLIC_API_URL).toBe('http://localhost:8000')
  })

  it('should have correct app URL', () => {
    expect(process.env.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000')
  })
})
