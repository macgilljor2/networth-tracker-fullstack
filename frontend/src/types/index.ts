export interface User {
  id: string
  username: string
  email: string
  created_at: string
  settings?: UserSettings
}

export interface UserSettings {
  theme?: string
  currency?: string
}

export interface AccountStats {
  this_month_change: number
  three_month_change_percent: number
  six_month_change_percent: number
  all_time_change_percent: number
  three_month_change_amount: number
  six_month_change_amount: number
  all_time_change_amount: number
}

export interface Account {
  id: string
  name?: string
  account_name?: string
  account_type: string
  currency: string
  current_balance?: number
  is_excluded_from_totals?: boolean
  created_at: string
  updated_at: string
  stats?: AccountStats
}

export interface AccountWithBalances extends Account {
  current_balance?: number
  balance_count?: number
}

export interface Balance {
  id: string
  account_id: string
  amount: number
  currency: string
  date: string
  created_at: string
}

// Account group from GET /account-groups (full details with history)
export interface AccountGroup {
  id: string
  name: string
  description: string | null
  account_count: number
  total_balance_gbp: number
  balance_history: HistoryPoint[]
  created_at: string
  updated_at: string
  user_id: string
  accounts?: AccountInGroup[]
}

export interface AccountInGroup {
  id: string
  account_name: string
  account_type: string
  currency: string
  latest_balance_gbp: number
}

// Minimal account group for other responses
export interface AccountGroupSummary {
  id: string
  user_id: string
  name: string
  description: string | null
  order_index: number
  created_at: string
  updated_at: string
  _account_count?: number
  _total_balance?: number
}

// Dashboard types from API spec
export interface DashboardGroupSummary {
  id: string
  name: string
  total_balance_gbp: number
}

export interface DashboardAccountType {
  account_type: string
  total_balance_gbp: number
}

export interface DashboardData {
  total_balance_gbp: number
  groups: DashboardGroupSummary[]
  by_account_type: DashboardAccountType[]
}

// Balance history types from API spec
export interface HistoryPoint {
  date: string
  total_balance_gbp: number
}

// Alias for compatibility with components that expect BalanceHistoryPoint
export type BalanceHistoryPoint = HistoryPoint

export interface GroupHistory {
  group_id: string
  group_name: string
  history: HistoryPoint[]
}

export interface DashboardHistoryResponse {
  total_history: HistoryPoint[]
  group_histories: GroupHistory[]
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface RegisterResponse {
  id: string
  username: string
  email: string
  created_at: string
}

// Export budget types from budget.ts
export * from './budget'
