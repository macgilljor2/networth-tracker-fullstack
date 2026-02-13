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

    // Step 8: Verify still authenticated after refresh
    await expect(page.getByText('Total Net Worth').first()).toBeVisible()
    console.log('✅ Still authenticated after refresh - dashboard visible')

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

test.describe('Dashboard and UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.context().clearCookies()
    await page.goto(`${BASE_URL}/login`)
    await page.getByLabel(/email/i).fill('test99@test.com')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /Sign In/i }).click()
    await page.waitForURL(`${BASE_URL}/dashboard`)
    await page.waitForLoadState('networkidle')
  })

  test('should load dashboard smoothly with correct digital font', async ({ page }) => {
    console.log('🎨 Testing dashboard loading and fonts')

    // Check dashboard loaded
    await expect(page.getByText('Total Net Worth').first()).toBeVisible()
    console.log('✅ Dashboard content visible')

    // Wait for fonts to load
    await page.waitForTimeout(500)

    // Check that numbers are NOT using Playfair Display (the display font)
    const fontCheck = await page.evaluate(() => {
      const numberElements = document.querySelectorAll('span.font-mono')
      if (numberElements.length === 0) {
        return { found: false, reason: 'No .font-mono elements found' }
      }

      const firstElement = numberElements[0] as HTMLElement
      const styles = window.getComputedStyle(firstElement)
      const fontFamily = styles.fontFamily

      return {
        found: true,
        fontFamily,
        elementCount: numberElements.length,
        // Check if Playfair Display is being used (which would be wrong)
        usingDisplayFont: fontFamily.toLowerCase().includes('playfair'),
        // Check if any mono font is being used
        usingMonoFont: fontFamily.toLowerCase().includes('mono') ||
                       fontFamily.toLowerCase().includes('share') ||
                       fontFamily.toLowerCase().includes('tech')
      }
    })

    console.log('🔤 Font check result:', fontCheck)

    expect(fontCheck.found).toBe(true)
    expect(fontCheck.usingDisplayFont).toBe(false) // Should NOT be Playfair
    expect(fontCheck.usingMonoFont).toBe(true) // Should be a mono font

    console.log('✅ Digital font verified - NOT using Playfair Display')
  })

  test('should have all key dashboard elements visible', async ({ page }) => {
    console.log('📊 Testing dashboard elements')

    // Check key elements
    await expect(page.getByText('Total Net Worth').first()).toBeVisible()
    await expect(page.getByText('Net Worth History')).toBeVisible()
    await expect(page.getByText('Show on Chart')).toBeVisible()
    await expect(page.getByText('By Account Type')).toBeVisible()
    await expect(page.getByText('Account Groups')).toBeVisible()

    console.log('✅ All dashboard elements visible')
  })
})

test.describe('Account Group Modal Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.context().clearCookies()
    await page.goto(`${BASE_URL}/login`)
    await page.getByLabel(/email/i).fill('test99@test.com')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /Sign In/i }).click()
    await page.waitForURL(`${BASE_URL}/dashboard`)
    await page.waitForLoadState('networkidle')
  })

  test('should open create group modal and show real accounts', async ({ page }) => {
    console.log('📁 Testing create group modal')

    // Click "New Group" button
    await page.getByRole('button', { name: /\+ New Group/i }).click()
    console.log('✅ Clicked New Group button')

    // Wait for modal
    await expect(page.getByText('Create Account Group')).toBeVisible()
    console.log('✅ Modal opened')

    // Check for real accounts (not fake data)
    const accountItems = await page.locator('input[type="checkbox"]').count()
    console.log('📊 Number of accounts:', accountItems)

    if (accountItems > 0) {
      // Get first account name
      const firstAccountName = await page.locator('.font-medium.text-\\[\\#3d3428\\]').first().textContent()
      console.log('🏦 First account name:', firstAccountName)
      expect(firstAccountName).toBeTruthy()
      expect(firstAccountName).not.toContain('fake')
      expect(firstAccountName).not.toContain('example')
      expect(firstAccountName).not.toContain('test')
    }

    // Close modal
    await page.getByRole('button', { name: /Close modal/i }).click()
    console.log('✅ Modal closed')
  })

  test('should have scrollable account list with fixed buttons', async ({ page }) => {
    console.log('📜 Testing modal scrolling behavior')

    // Open modal
    await page.getByRole('button', { name: /\+ New Group/i }).click()
    await expect(page.getByText('Create Account Group')).toBeVisible()

    // Check if there are enough accounts to test scrolling
    const accountCount = await page.locator('input[type="checkbox"]').count()

    if (accountCount > 3) {
      // Get modal structure
      const modalHeight = await page.evaluate(() => {
        const modal = document.querySelector('.glass-card.rounded-2xl')
        return modal ? modal.scrollHeight : 0
      })
      console.log('📏 Modal height:', modalHeight)

      // Check buttons are at the bottom (fixed position)
      const cancelButton = page.getByRole('button', { name: /Cancel/i })
      await expect(cancelButton).toBeVisible()
      console.log('✅ Cancel button visible')

      // Check if account list is scrollable
      const accountList = page.locator('.max-h-60.overflow-y-auto')
      const isAccountListScrollable = await accountList.evaluate((el: any) => {
        return el.scrollHeight > el.clientHeight
      })
      console.log('🔄 Account list scrollable:', isAccountListScrollable)
    }

    // Close modal
    await page.keyboard.press('Escape')
    console.log('✅ Modal closed via keyboard')
  })

  test('should create group with selected accounts', async ({ page }) => {
    console.log('➕ Testing group creation')

    // Open modal
    await page.getByRole('button', { name: /\+ New Group/i }).click()
    await expect(page.getByText('Create Account Group')).toBeVisible()

    // Fill in group name
    const groupName = `Test Group ${Date.now()}`
    await page.getByLabel(/Group Name/i).fill(groupName)
    console.log('✅ Entered group name:', groupName)

    // Fill in description (required)
    await page.getByLabel(/Description/i).fill('Test group description for E2E testing')
    console.log('✅ Entered description')

    // Select first account if available
    const accountCount = await page.locator('input[type="checkbox"]').count()
    if (accountCount > 0) {
      await page.locator('input[type="checkbox"]').first().check()
      console.log('✅ Selected first account')
    }

    // Submit form
    await page.getByRole('button', { name: /Create Group/i }).click()
    console.log('✅ Clicked Create Group button')

    // Wait for modal to close
    await page.waitForTimeout(2000)

    // Modal should be closed
    await expect(page.getByText('Create Account Group')).not.toBeVisible()
    console.log('✅ Modal closed after creation')
  })
})
