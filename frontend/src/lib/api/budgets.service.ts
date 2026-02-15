import { apiClient } from './client'
import {
  BudgetCategory,
  Income,
  Expense,
  BudgetSummary,
  BudgetTrends,
  CreateBudgetCategoryRequest,
  UpdateBudgetCategoryRequest,
  CreateIncomeRequest,
  UpdateIncomeRequest,
  CreateExpenseRequest,
  UpdateExpenseRequest,
} from '@/types/budget'

// Budget Categories Service
export const budgetCategoriesService = {
  /**
   * Get all budget categories
   */
  async getCategories(): Promise<BudgetCategory[]> {
    const response = await apiClient.get<BudgetCategory[]>('/api/v1/budget-categories')
    return response.data
  },

  /**
   * Get category by ID
   */
  async getCategory(id: string): Promise<BudgetCategory> {
    const response = await apiClient.get<BudgetCategory>(`/api/v1/budget-categories/${id}`)
    return response.data
  },

  /**
   * Create new category
   */
  async createCategory(data: CreateBudgetCategoryRequest): Promise<BudgetCategory> {
    const response = await apiClient.post<BudgetCategory>('/api/v1/budget-categories', data)
    return response.data
  },

  /**
   * Update category
   */
  async updateCategory(id: string, data: UpdateBudgetCategoryRequest): Promise<BudgetCategory> {
    const response = await apiClient.put<BudgetCategory>(`/api/v1/budget-categories/${id}`, data)
    return response.data
  },

  /**
   * Delete category
   */
  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/budget-categories/${id}`)
  },
}

// Income Service
export const incomeService = {
  /**
   * Get all income entries
   */
  async getIncome(): Promise<Income[]> {
    const response = await apiClient.get<Income[]>('/api/v1/income')
    return response.data
  },

  /**
   * Get income by ID
   */
  async getIncomeById(id: string): Promise<Income> {
    const response = await apiClient.get<Income>(`/api/v1/income/${id}`)
    return response.data
  },

  /**
   * Create new income entry
   */
  async createIncome(data: CreateIncomeRequest): Promise<Income> {
    const response = await apiClient.post<Income>('/api/v1/income', data)
    return response.data
  },

  /**
   * Update income entry
   */
  async updateIncome(id: string, data: UpdateIncomeRequest): Promise<Income> {
    const response = await apiClient.put<Income>(`/api/v1/income/${id}`, data)
    return response.data
  },

  /**
   * Delete income entry
   */
  async deleteIncome(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/income/${id}`)
  },
}

// Expenses Service
export const expensesService = {
  /**
   * Get all expense entries
   */
  async getExpenses(): Promise<Expense[]> {
    const response = await apiClient.get<Expense[]>('/api/v1/expenses')
    return response.data
  },

  /**
   * Get expense by ID
   */
  async getExpenseById(id: string): Promise<Expense> {
    const response = await apiClient.get<Expense>(`/api/v1/expenses/${id}`)
    return response.data
  },

  /**
   * Create new expense entry
   */
  async createExpense(data: CreateExpenseRequest): Promise<Expense> {
    const response = await apiClient.post<Expense>('/api/v1/expenses', data)
    return response.data
  },

  /**
   * Update expense entry
   */
  async updateExpense(id: string, data: UpdateExpenseRequest): Promise<Expense> {
    const response = await apiClient.put<Expense>(`/api/v1/expenses/${id}`, data)
    return response.data
  },

  /**
   * Delete expense entry
   */
  async deleteExpense(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/expenses/${id}`)
  },
}

// Budget Dashboard Service
export const budgetDashboardService = {
  /**
   * Get current month budget summary
   */
  async getCurrentMonthSummary(): Promise<BudgetSummary> {
    const response = await apiClient.get<BudgetSummary>('/api/v1/budget-dashboard/summary')
    return response.data
  },

  /**
   * Get budget summary for specific month
   */
  async getMonthlySummary(month: number, year: number): Promise<BudgetSummary> {
    const response = await apiClient.get<BudgetSummary>(`/api/v1/budget-dashboard/summary/${month}/${year}`)
    return response.data
  },

  /**
   * Get yearly budget summary
   */
  async getYearlySummary(year: number): Promise<{
    year: number
    total_income: number
    total_expenses: number
    surplus_deficit: number
    savings_rate: number
  }> {
    const response = await apiClient.get(`/api/v1/budget-dashboard/yearly/${year}`)
    return response.data
  },

  /**
   * Get budget trends
   */
  async getTrends(months: number = 6): Promise<BudgetTrends> {
    const response = await apiClient.get<BudgetTrends>('/api/v1/budget-dashboard/trends', {
      params: { months }
    })
    return response.data
  },
}
