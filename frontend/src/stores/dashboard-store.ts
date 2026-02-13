import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DashboardData, BalanceHistoryPoint, AccountGroup } from '@/types'

interface DashboardState {
  dashboardData: DashboardData | null
  balanceHistory: BalanceHistoryPoint[]
  accountGroups: AccountGroup[]
  selectedSeries: string[] // Persist chart series selections
  isLoading: boolean
  error: string | null

  setDashboardData: (data: DashboardData) => void
  setBalanceHistory: (history: BalanceHistoryPoint[]) => void
  setAccountGroups: (groups: AccountGroup[]) => void
  setSelectedSeries: (series: string[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      dashboardData: null,
      balanceHistory: [],
      accountGroups: [],
      selectedSeries: ['total'], // Default: show total series
      isLoading: false,
      error: null,

      setDashboardData: (data) => set({ dashboardData: data, error: null }),
      setBalanceHistory: (history) => set({ balanceHistory: history }),
      setAccountGroups: (groups) => set({ accountGroups: groups }),
      setSelectedSeries: (series) => set({ selectedSeries: series }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      reset: () =>
        set({
          dashboardData: null,
          balanceHistory: [],
          accountGroups: [],
          selectedSeries: ['total'],
          isLoading: false,
          error: null,
        }),
    }),
    {
      name: 'dashboard-storage',
      partialize: (state) => ({
        selectedSeries: state.selectedSeries,
      }),
    }
  )
)
