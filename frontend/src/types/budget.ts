export interface BudgetCategory {
  id: string
  user_id: string
  name: string
  description?: string
  icon?: string
  color?: string
  is_essential: boolean
  created_at: string
  updated_at: string
}

export enum Frequency {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  ONE_TIME = 'ONE_TIME'
}

export interface Income {
  id: string
  user_id: string
  description: string
  amount: number
  frequency: Frequency
  is_net: boolean
  effective_month?: number
  effective_year?: number
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  user_id: string
  description: string
  amount: number
  frequency: Frequency
  category_id: string
  category?: BudgetCategory
  effective_month?: number
  effective_year?: number
  created_at: string
  updated_at: string
}

export interface ExpenseBreakdownItem {
  category_name: string
  amount: number
  percentage: number
}

export interface BudgetSummary {
  month: number
  year: number
  total_income: number
  total_expenses: number
  surplus_deficit: number
  savings_rate: number
  expense_breakdown: ExpenseBreakdownItem[]
}

export interface BudgetTrendMonth {
  month: number
  year: number
  income: number
  expenses: number
  surplus_deficit: number
}

export interface BudgetTrends {
  months: BudgetTrendMonth[]
}

export interface CreateBudgetCategoryRequest {
  name: string
  description?: string
  icon?: string
  color?: string
  is_essential?: boolean
}

export interface UpdateBudgetCategoryRequest {
  name?: string
  description?: string
  icon?: string
  color?: string
  is_essential?: boolean
}

export interface CreateIncomeRequest {
  description: string
  amount: number
  frequency: Frequency
  is_net?: boolean
  effective_month?: number
  effective_year?: number
}

export interface UpdateIncomeRequest {
  description?: string
  amount?: number
  frequency?: Frequency
  is_net?: boolean
  effective_month?: number
  effective_year?: number
}

export interface CreateExpenseRequest {
  description: string
  amount: number
  frequency: Frequency
  category_id: string
  effective_month?: number
  effective_year?: number
}

export interface UpdateExpenseRequest {
  description?: string
  amount?: number
  frequency?: Frequency
  category_id?: string
  effective_month?: number
  effective_year?: number
}
