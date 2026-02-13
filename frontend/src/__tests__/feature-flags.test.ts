import { describe, it, expect } from 'vitest'
import { featureFlags, useFeatureFlag } from '@/lib/constants/feature-flags'

describe('Feature Flags', () => {
  it('should have socialLogin flag defined', () => {
    expect(featureFlags.socialLogin).toBeDefined()
    expect(typeof featureFlags.socialLogin).toBe('boolean')
  })

  it('should have rememberMe flag defined', () => {
    expect(featureFlags.rememberMe).toBeDefined()
    expect(typeof featureFlags.rememberMe).toBe('boolean')
  })

  it('should have balanceHistoryChart flag defined', () => {
    expect(featureFlags.balanceHistoryChart).toBeDefined()
    expect(typeof featureFlags.balanceHistoryChart).toBe('boolean')
  })

  it('should have accountTypeDistribution flag defined', () => {
    expect(featureFlags.accountTypeDistribution).toBeDefined()
    expect(typeof featureFlags.accountTypeDistribution).toBe('boolean')
  })

  it('should have groupSummaries flag defined', () => {
    expect(featureFlags.groupSummaries).toBeDefined()
    expect(typeof featureFlags.groupSummaries).toBe('boolean')
  })

  it('should have bulkActions flag defined', () => {
    expect(featureFlags.bulkActions).toBeDefined()
    expect(typeof featureFlags.bulkActions).toBe('boolean')
  })

  it('should have accountGroups flag defined', () => {
    expect(featureFlags.accountGroups).toBeDefined()
    expect(typeof featureFlags.accountGroups).toBe('boolean')
  })

  it('should have balanceHistoryPerAccount flag defined', () => {
    expect(featureFlags.balanceHistoryPerAccount).toBeDefined()
    expect(typeof featureFlags.balanceHistoryPerAccount).toBe('boolean')
  })

  it('should have groupMiniCharts flag defined', () => {
    expect(featureFlags.groupMiniCharts).toBeDefined()
    expect(typeof featureFlags.groupMiniCharts).toBe('boolean')
  })

  it('should have darkMode flag defined', () => {
    expect(featureFlags.darkMode).toBeDefined()
    expect(typeof featureFlags.darkMode).toBe('boolean')
  })

  it('should have exportData flag defined', () => {
    expect(featureFlags.exportData).toBeDefined()
    expect(typeof featureFlags.exportData).toBe('boolean')
  })

  it('should have multiCurrency flag defined', () => {
    expect(featureFlags.multiCurrency).toBeDefined()
    expect(typeof featureFlags.multiCurrency).toBe('boolean')
  })

  it('should have all authentication flags', () => {
    expect(featureFlags.socialLogin).toBeDefined()
    expect(featureFlags.rememberMe).toBeDefined()
  })

  it('should have all dashboard flags', () => {
    expect(featureFlags.balanceHistoryChart).toBeDefined()
    expect(featureFlags.accountTypeDistribution).toBeDefined()
    expect(featureFlags.groupSummaries).toBeDefined()
  })

  it('should have all accounts flags', () => {
    expect(featureFlags.bulkActions).toBeDefined()
    expect(featureFlags.accountGroups).toBeDefined()
    expect(featureFlags.balanceHistoryPerAccount).toBeDefined()
  })

  it('should have all groups flags', () => {
    expect(featureFlags.groupMiniCharts).toBeDefined()
  })

  it('should have all settings flags', () => {
    expect(featureFlags.darkMode).toBeDefined()
    expect(featureFlags.exportData).toBeDefined()
    expect(featureFlags.multiCurrency).toBeDefined()
  })
})