/**
 * Centralized Test Data Factory
 *
 * Provides consistent test data for all unit and integration tests.
 * Ensures tests always have access to diverse, realistic data scenarios.
 */

import type {
  User,
  Account,
  AccountGroup,
  Balance,
  HistoryPoint,
  DashboardData,
  DashboardGroupSummary,
  DashboardAccountType,
} from '@/types'

// ============================================================================
// USER TEST DATA
// ============================================================================

export const testUsers = {
  basic: {
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z',
    settings: { theme: 'beige', currency: 'GBP' },
  } satisfies User,

  withSettings: {
    id: 'user-2',
    username: 'advanceduser',
    email: 'advanced@example.com',
    created_at: '2024-01-15T00:00:00Z',
    settings: { theme: 'dark', currency: 'USD' },
  } satisfies User,

  noSettings: {
    id: 'user-3',
    username: 'nosettings',
    email: 'nosettings@example.com',
    created_at: '2024-02-01T00:00:00Z',
  } satisfies User,
}

// ============================================================================
// ACCOUNT TEST DATA
// ============================================================================

export const testAccounts = {
  savings: {
    id: 'acct-1',
    name: 'Easy Access Savings',
    account_type: 'savings',
    currency: 'GBP',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  } satisfies Account,

  investment: {
    id: 'acct-2',
    name: 'Stocks & Shares ISA',
    account_type: 'investment',
    currency: 'GBP',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  } satisfies Account,

  current: {
    id: 'acct-3',
    name: 'Current Account',
    account_type: 'current',
    currency: 'GBP',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  } satisfies Account,

  loan: {
    id: 'acct-4',
    name: 'Personal Loan',
    account_type: 'loan',
    currency: 'GBP',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  } satisfies Account,

  credit: {
    id: 'acct-5',
    name: 'Credit Card',
    account_type: 'credit',
    currency: 'GBP',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  } satisfies Account,
}

export const allTestAccounts = Object.values(testAccounts)

// ============================================================================
// BALANCE TEST DATA
// ============================================================================

const createBalances = (accountId: string, base: number, count: number): Balance[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `bal-${accountId}-${i}`,
    account_id: accountId,
    amount: base + (i * 1000) + Math.floor(Math.random() * 500),
    currency: 'GBP',
    date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
    created_at: new Date(2024, 0, i + 1).toISOString(),
  }))
}

export const testBalances = {
  savings: createBalances('acct-1', 20000, 12),
  investment: createBalances('acct-2', 50000, 12),
  current: createBalances('acct-3', 5000, 12),
  loan: createBalances('acct-4', -10000, 12),
  credit: createBalances('acct-5', -2000, 12),
}

export const allTestBalances = Object.values(testBalances).flat()

// ============================================================================
// ACCOUNT GROUP TEST DATA
// ============================================================================

export const testAccountGroups = {
  emergencyFund: {
    id: 'group-1',
    name: 'Emergency Fund',
    description: 'Rainy day savings',
    user_id: 'user-1',
    account_count: 2,
    total_balance_gbp: 25000,
    balance_history: [
      { date: '2024-01-01', total_balance_gbp: 20000 },
      { date: '2024-02-01', total_balance_gbp: 21000 },
      { date: '2024-03-01', total_balance_gbp: 22000 },
      { date: '2024-04-01', total_balance_gbp: 23000 },
      { date: '2024-05-01', total_balance_gbp: 24000 },
      { date: '2024-06-01', total_balance_gbp: 25000 },
    ],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
  } satisfies AccountGroup,

  investments: {
    id: 'group-2',
    name: 'Investments',
    description: 'Long-term growth',
    user_id: 'user-1',
    account_count: 2,
    total_balance_gbp: 75000,
    balance_history: [
      { date: '2024-01-01', total_balance_gbp: 65000 },
      { date: '2024-02-01', total_balance_gbp: 67000 },
      { date: '2024-03-01', total_balance_gbp: 70000 },
      { date: '2024-04-01', total_balance_gbp: 72000 },
      { date: '2024-05-01', total_balance_gbp: 73000 },
      { date: '2024-06-01', total_balance_gbp: 75000 },
    ],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
  } satisfies AccountGroup,

  everydayBanking: {
    id: 'group-3',
    name: 'Everyday Banking',
    description: 'Daily expenses',
    user_id: 'user-1',
    account_count: 3,
    total_balance_gbp: 12000,
    balance_history: [
      { date: '2024-01-01', total_balance_gbp: 10000 },
      { date: '2024-02-01', total_balance_gbp: 10500 },
      { date: '2024-03-01', total_balance_gbp: 11000 },
      { date: '2024-04-01', total_balance_gbp: 10800 },
      { date: '2024-05-01', total_balance_gbp: 11500 },
      { date: '2024-06-01', total_balance_gbp: 12000 },
    ],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
  } satisfies AccountGroup,

  empty: {
    id: 'group-4',
    name: 'Empty Group',
    description: 'No accounts yet',
    user_id: 'user-1',
    account_count: 0,
    total_balance_gbp: 0,
    balance_history: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  } satisfies AccountGroup,
}

export const allTestAccountGroups = Object.values(testAccountGroups)

// ============================================================================
// DASHBOARD TEST DATA
// ============================================================================

export const testDashboardData = {
  full: {
    total_balance_gbp: 112000,
    groups: [
      { id: 'group-1', name: 'Emergency Fund', total_balance_gbp: 25000 },
      { id: 'group-2', name: 'Investments', total_balance_gbp: 75000 },
      { id: 'group-3', name: 'Everyday Banking', total_balance_gbp: 12000 },
    ],
    by_account_type: [
      { account_type: 'savings', total_balance_gbp: 45000 },
      { account_type: 'investment', total_balance_gbp: 60000 },
      { account_type: 'current', total_balance_gbp: 7000 },
    ],
  } satisfies DashboardData,

  minimal: {
    total_balance_gbp: 10000,
    groups: [
      { id: 'group-1', name: 'Savings', total_balance_gbp: 10000 },
    ],
    by_account_type: [
      { account_type: 'savings', total_balance_gbp: 10000 },
    ],
  } satisfies DashboardData,

  empty: {
    total_balance_gbp: 0,
    groups: [],
    by_account_type: [],
  } satisfies DashboardData,
}

// ============================================================================
// BALANCE HISTORY TEST DATA
// ============================================================================

export const testBalanceHistory = {
  fullYear: Array.from({ length: 12 }, (_, i) => ({
    date: new Date(2024, i, 1).toISOString().split('T')[0],
    total_balance_gbp: 100000 + (i * 2000) + Math.floor(Math.random() * 5000),
  })) satisfies HistoryPoint[],

  growth: [
    { date: '2024-01-01', total_balance_gbp: 85000 },
    { date: '2024-02-01', total_balance_gbp: 92000 },
    { date: '2024-03-01', total_balance_gbp: 98000 },
    { date: '2024-04-01', total_balance_gbp: 105000 },
    { date: '2024-05-01', total_balance_gbp: 108000 },
    { date: '2024-06-01', total_balance_gbp: 112000 },
  ] satisfies HistoryPoint[],

  decline: [
    { date: '2024-01-01', total_balance_gbp: 120000 },
    { date: '2024-02-01', total_balance_gbp: 115000 },
    { date: '2024-03-01', total_balance_gbp: 110000 },
    { date: '2024-04-01', total_balance_gbp: 105000 },
  ] satisfies HistoryPoint[],

  single: [
    { date: '2024-01-01', total_balance_gbp: 50000 },
  ] satisfies HistoryPoint[],

  empty: [] satisfies HistoryPoint[],
}

// ============================================================================
// API RESPONSE MOCKS
// ============================================================================

export const mockApiResponses = {
  dashboard: {
    success: {
      data: testDashboardData.full,
    },
    empty: {
      data: testDashboardData.empty,
    },
  },

  balanceHistory: {
    success: {
      data: {
        total_history: testBalanceHistory.growth,
        group_histories: [],
      },
    },
  },

  accountGroups: {
    success: {
      data: allTestAccountGroups,
    },
  },

  login: {
    success: {
      data: {
        access_token: 'test-token-12345',
        token_type: 'bearer',
      },
    },
    invalidCredentials: {
      response: {
        status: 401,
        data: { detail: 'Incorrect email or password' },
      },
    },
  },
}

// ============================================================================
// TEST DATA GENERATORS
// ============================================================================

/**
 * Generate a custom balance history with specified parameters
 */
export const generateBalanceHistory = (
  months: number,
  startBalance: number,
  growthRate: number = 0.02,
  volatility: number = 500
): HistoryPoint[] => {
  return Array.from({ length: months }, (_, i) => {
    const growth = startBalance * growthRate * (i / months)
    const random = (Math.random() - 0.5) * volatility
    return {
      date: new Date(2024, i, 1).toISOString().split('T')[0],
      total_balance_gbp: Math.round(startBalance + growth + random),
    }
  })
}

/**
 * Generate an account with custom properties
 */
export const generateAccount = (overrides?: Partial<Account>): Account => {
  return {
    id: `acct-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Test Account',
    account_type: 'savings',
    currency: 'GBP',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Generate multiple accounts
 */
export const generateAccounts = (count: number, type?: string): Account[] => {
  return Array.from({ length: count }, (_, i) =>
    generateAccount({
      name: `Account ${i + 1}`,
      account_type: type || ['savings', 'investment', 'current'][i % 3],
    })
  )
}

// ============================================================================
// EXPORT ALL DATA
// ============================================================================

export const testDataFactory = {
  users: testUsers,
  accounts: testAccounts,
  balances: testBalances,
  groups: testAccountGroups,
  dashboard: testDashboardData,
  history: testBalanceHistory,
  mocks: mockApiResponses,
  generators: {
    balanceHistory: generateBalanceHistory,
    account: generateAccount,
    accounts: generateAccounts,
  },
}
