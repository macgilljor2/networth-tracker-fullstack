/**
 * Feature Flags Configuration
 *
 * Toggle features on/off by changing these values.
 * This is a static configuration file - changes require redeployment.
 */

export const featureFlags = {
  // Authentication
  socialLogin: false, // Google/GitHub OAuth
  rememberMe: true, // Remember me checkbox on login

  // Dashboard
  balanceHistoryChart: true, // Main line chart showing balance history
  accountTypeDistribution: true, // Pie chart showing asset distribution
  groupSummaries: true, // Account group summary cards

  // Accounts
  bulkActions: true, // Bulk edit/delete balances
  accountGroups: true, // Group management
  balanceHistoryPerAccount: true, // Balance history chart on account detail

  // Groups
  groupMiniCharts: true, // Sparkline charts on group cards

  // Settings (future)
  darkMode: false, // Dark theme toggle
  exportData: false, // Export to CSV/Excel
  multiCurrency: false, // Display in original currency
} as const

export type FeatureFlag = keyof typeof featureFlags

/**
 * Hook to check if a feature flag is enabled
 * @param flag - The feature flag to check
 * @returns true if the feature is enabled, false otherwise
 */
export function useFeatureFlag(flag: FeatureFlag): boolean {
  return featureFlags[flag]
}

/**
 * Check if a feature flag is enabled (utility function)
 * @param flag - The feature flag to check
 * @returns true if the feature is enabled, false otherwise
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return featureFlags[flag]
}
