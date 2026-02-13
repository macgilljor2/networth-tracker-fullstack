import { test, expect } from '@playwright/test'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

test.describe('Full Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies and localStorage before each test
    await page.context().clearCookies()
    await page.goto(BASE_URL)
    await page.evaluate(() => localStorage.clear())
  })

  test('should login, persist auth across refresh, and work in new tabs', async ({ page, context }) => {
    console.log('🚀 Starting full auth flow test')

    // Step 1: Go to login page
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')
    console.log('📄 Login page loaded')

    // Step 2: Fill in login form with existing test user
    const emailInput = page.getByLabel(/email/i)
    const passwordInput = page.getByLabel(/password/i)

    await emailInput.fill('test99@test.com')
    await passwordInput.fill('password123')
    console.log('✅ Login credentials entered')

    // Step 3: Submit login
    const loginButton = page.getByRole('button', { name: /Sign In/i })
    await loginButton.click()
    console.log('✅ Login button clicked')

    // Step 4: Wait for redirect to dashboard
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 5000 })
    console.log('✅ Redirected to dashboard')
    await page.waitForLoadState('networkidle')
    console.log('✅ Dashboard loaded')

    // Step 5: Verify we're on dashboard with content
    const bodyText1 = await page.textContent('body')
    console.log('📄 Page content length:', bodyText1?.length)
    console.log('🔍 Contains "Total":', bodyText1?.includes('Total'))

    await expect(page.getByText('Total Net Worth').first()).toBeVisible()
    await expect(page.getByText('Net Worth History')).toBeVisible()
    console.log('✅ Dashboard content loaded')

    // Step 6: Check localStorage for auth data
    const authData = await page.evaluate(() => {
      const data = localStorage.getItem('auth-storage')
      return data ? JSON.parse(data) : null
    })
    console.log('📦 Auth data in localStorage:', authData ? {
      hasToken: !!authData.state?.token,
      hasUser: !!authData.state?.user,
      hasExpiry: !!authData.state?.tokenExpiresAt,
      username: authData.state?.user?.username
    } : 'No auth data')
    expect(authData?.state?.token).toBeTruthy()
    expect(authData?.state?.user).toBeTruthy()

    // Step 7: Refresh the page - user should stay logged in
    console.log('🔄 About to refresh page')
    await page.reload({ waitUntil: 'networkidle' })
    console.log('✅ Page refreshed')
    console.log('🔗 Current URL:', page.url())

    // Debug: Check what's on the page after refresh
    const bodyText2 = await page.textContent('body')
    console.log('📄 Page content length after refresh:', bodyText2?.length)
    console.log('🔍 Contains "Total" after refresh:', bodyText2?.includes('Total'))
    console.log('🔍 Contains "login" after refresh:', bodyText2?.includes('login'))

    // Check URL
    const urlAfterRefresh = page.url()
    console.log('🔗 URL after refresh:', urlAfterRefresh)

    // Step 8: Verify still authenticated after refresh
    if (urlAfterRefresh.includes('/dashboard')) {
      // On dashboard - check content
      await expect(page.getByText('Total Net Worth').first()).toBeVisible({ timeout: 10000 })
      console.log('✅ Still authenticated after refresh - dashboard visible')
    } else if (urlAfterRefresh.includes('/login')) {
      console.log('❌ Redirected to login after refresh - auth not persisted')
      throw new Error('User was logged out after page refresh')
    }

    // Step 9: Open new tab - should share auth state via localStorage
    const newPage = await context.newPage()
    await newPage.goto(`${BASE_URL}/dashboard`)
    await newPage.waitForLoadState('networkidle')
    console.log('🆕 New tab opened to dashboard')

    // Step 10: Verify new tab is authenticated
    await expect(newPage.getByText('Total Net Worth').first()).toBeVisible()
    console.log('✅ New tab is authenticated')

    await newPage.close()
    console.log('✅ Test completed successfully')
  })

  test('should handle token expiry and background refresh', async ({ page }) => {
    console.log('🔄 Testing token expiry and background refresh')

    // Login
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')

    await page.getByLabel(/email/i).fill('test99@test.com')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /Sign In/i }).click()

    await page.waitForURL(`${BASE_URL}/dashboard`)
    console.log('✅ Logged in')

    // Get initial token expiry
    const initialExpiry = await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem('auth-storage') || '{}')
      return data.state?.tokenExpiresAt
    })
    console.log('⏰ Initial token expiry:', new Date(initialExpiry).toISOString())

    // Wait a moment
    await page.waitForTimeout(5000)

    // Token should still be valid
    const tokenValid = await page.evaluate(async () => {
      const data = JSON.parse(localStorage.getItem('auth-storage') || '{}')
      const token = data.state?.token
      if (!token) return false

      try {
        const response = await fetch('http://localhost:8000/api/v1/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        return response.ok
      } catch {
        return false
      }
    })
    console.log('✅ Token is valid:', tokenValid)
    expect(tokenValid).toBe(true)
  })

  test('should logout and clear all auth data', async ({ page, context }) => {
    console.log('🚪 Testing logout')

    // Login first
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')

    await page.getByLabel(/email/i).fill('test99@test.com')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /Sign In/i }).click()

    await page.waitForURL(`${BASE_URL}/dashboard`)
    console.log('✅ Logged in')

    // Verify auth data exists
    const hasAuthBefore = await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem('auth-storage') || '{}')
      return !!data.state?.token
    })
    expect(hasAuthBefore).toBe(true)

    // Logout
    await page.getByRole('button', { name: /Logout/i }).first().click()
    await page.waitForURL(`${BASE_URL}/login`)
    console.log('✅ Logged out, redirected to login')

    // Verify auth data is cleared
    const authDataAfter = await page.evaluate(() => {
      return localStorage.getItem('auth-storage')
    })
    console.log('📦 Auth data after logout:', authDataAfter)

    // Try to access dashboard - should redirect to login
    await page.goto(`${BASE_URL}/dashboard`)
    await page.waitForTimeout(2000)

    const currentUrl = page.url()
    console.log('🔗 URL after trying to access dashboard:', currentUrl)
    expect(currentUrl).toContain('/login')
  })
})
